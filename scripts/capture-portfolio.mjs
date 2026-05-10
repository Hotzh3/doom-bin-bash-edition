#!/usr/bin/env node
/**
 * Automated portfolio captures: starts Vite, grabs WebP stills + short WebM for GIF conversion.
 * Requires: playwright (chromium), ffmpeg on PATH for GIF palette optimization.
 *
 * Usage: npm run capture:media
 * Manual: see docs/assets/screenshots/SHOT_LIST.md (level-clear still).
 */

import { spawn, spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT_SHOTS = join(ROOT, 'docs/assets/screenshots');
const OUT_GIFS = join(ROOT, 'docs/assets/gifs');
const BASE_URL = process.env.CAPTURE_URL ?? 'http://127.0.0.1:5173';

async function waitForOk(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server not reachable: ${url}`);
}

async function startVite() {
  const vite = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none' }
  });
  await waitForOk(BASE_URL);
  return vite;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureWebp(page, outBaseName) {
  const pngPath = join(OUT_SHOTS, `${outBaseName}.tmp.png`);
  const webpPath = join(OUT_SHOTS, `${outBaseName}.webp`);
  await page.screenshot({ path: pngPath, type: 'png' });
  try {
    await sharp(pngPath).webp({ quality: 82, effort: 6 }).toFile(webpPath);
    await rm(pngPath, { force: true });
  } catch (e) {
    console.warn('WebP encode failed for', outBaseName, e?.message ?? e);
    const { rename } = await import('node:fs/promises');
    await rename(pngPath, join(OUT_SHOTS, `${outBaseName}.png`)).catch(() => {});
  }
}

async function main() {
  await mkdir(OUT_SHOTS, { recursive: true });
  await mkdir(OUT_GIFS, { recursive: true });

  let vite;
  if (process.env.CAPTURE_URL) {
    await waitForOk(BASE_URL, 5000);
  } else {
    vite = await startVite();
  }

  const tmpVidDir = await mkdtemp(join(tmpdir(), 'dbf-capture-'));

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 960, height: 540 },
    recordVideo: { dir: tmpVidDir, size: { width: 960, height: 540 } }
  });

  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60_000 });
  await sleep(900);

  await captureWebp(page, 'raycast-menu');

  await page.keyboard.press('KeyA');
  await sleep(700);

  await captureWebp(page, 'raycast-prologue');

  await page.keyboard.press('KeyA');
  await sleep(3200);

  await captureWebp(page, 'raycast-sector-hud');

  await page.keyboard.down('KeyW');
  await sleep(1200);
  await page.keyboard.up('KeyW');
  await sleep(400);

  await captureWebp(page, 'raycast-exploration');

  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Space');
    await sleep(180);
  }
  await sleep(400);

  await captureWebp(page, 'raycast-combat-director');

  await context.close();
  await browser.close();

  const videoFiles = await readdir(tmpVidDir).catch(() => []);
  const webm = videoFiles.find((f) => f.endsWith('.webm'));

  if (webm) {
    const src = join(tmpVidDir, webm);
    const bootGif = join(OUT_GIFS, 'raycast-boot-to-sector.gif');
    const combatGif = join(OUT_GIFS, 'raycast-combat-loop.gif');
    const palette =
      'fps=12,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5';
    const boot = spawnSync(
      'ffmpeg',
      ['-y', '-i', src, '-t', '10', '-vf', palette, bootGif],
      { encoding: 'utf8' }
    );
    if (boot.status !== 0) {
      console.warn('ffmpeg GIF (boot) skipped:', boot.stderr?.slice?.(0, 400) ?? boot.error);
    }
    const combat = spawnSync(
      'ffmpeg',
      ['-y', '-ss', '5', '-i', src, '-t', '4', '-vf', palette, combatGif],
      { encoding: 'utf8' }
    );
    if (combat.status !== 0) {
      console.warn('ffmpeg GIF (combat) skipped:', combat.stderr?.slice?.(0, 400) ?? combat.error);
    }
  }

  await rm(tmpVidDir, { recursive: true, force: true }).catch(() => {});

  if (vite) {
    vite.kill('SIGTERM');
    await sleep(400);
    vite.kill('SIGKILL');
  }

  console.log('Capture done → docs/assets/screenshots/*.webp, docs/assets/gifs/ (if ffmpeg OK)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
