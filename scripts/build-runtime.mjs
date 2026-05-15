#!/usr/bin/env node
/**
 * Build wrapper that separates compile-time assets from runtime metadata.
 * It keeps the repo simple: tsc + Vite build + a small dist manifest for traceability.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PACKAGE_JSON_PATH = join(ROOT, "package.json");
const DIST_DIR = join(ROOT, "dist");

function readPackageJson() {
  return JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8"));
}

function parseArgs(argv) {
  const result = {};
  for (const arg of argv) {
    const [key, rawValue] = arg.split("=");
    if (key === "--base-path") result.basePath = rawValue ?? "";
    if (key === "--channel") result.channel = rawValue ?? "";
  }
  return result;
}

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function resolveGitSha() {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
  });

  return result.status === 0 ? result.stdout.trim() : "local";
}

function resolveRuntimeChannel(cliChannel) {
  if (cliChannel) return cliChannel;
  if (process.env.RAYCAST_RUNTIME_CHANNEL)
    return process.env.RAYCAST_RUNTIME_CHANNEL;
  if (process.env.GITHUB_REF_TYPE === "tag") return "release";
  if (process.env.GITHUB_REF_NAME === "main") return "preview";
  return "development";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const pkg = readPackageJson();
  const basePath = args.basePath || process.env.BASE_PATH || "/";
  const runtimeChannel = resolveRuntimeChannel(args.channel);
  const buildSha = process.env.VITE_APP_BUILD_SHA || resolveGitSha();
  const version = process.env.VITE_APP_VERSION || pkg.version;
  const buildDateIso =
    process.env.VITE_APP_BUILD_DATE || new Date().toISOString();
  const telemetryMode = process.env.VITE_APP_TELEMETRY || "local";

  run("tsc", ["-b"]);
  run("vite", ["build"], {
    BASE_PATH: basePath,
    VITE_APP_VERSION: version,
    VITE_APP_BUILD_SHA: buildSha,
    VITE_APP_BUILD_DATE: buildDateIso,
    VITE_APP_RUNTIME_CHANNEL: runtimeChannel,
    VITE_APP_TELEMETRY: telemetryMode,
  });

  await mkdir(DIST_DIR, { recursive: true });
  const manifest = {
    appName: pkg.name,
    appVersion: version,
    buildSha,
    buildDateIso,
    runtimeChannel,
    basePath,
    telemetryMode:
      telemetryMode === "remote"
        ? "remote"
        : telemetryMode === "off"
          ? "off"
          : "local",
  };

  writeFileSync(
    join(DIST_DIR, "runtime-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(
    `Runtime manifest written: dist/runtime-manifest.json (${runtimeChannel})`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
