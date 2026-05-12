#!/usr/bin/env node
/**
 * Small runtime info helper for local inspection.
 * Reads the generated dist manifest when available; otherwise prints the current env contract.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MANIFEST_PATH = join(ROOT, "dist", "runtime-manifest.json");

function fallbackInfo() {
  return {
    appName: "doom-bin-bash-edition",
    appVersion: process.env.VITE_APP_VERSION || "0.1.0",
    buildSha: process.env.VITE_APP_BUILD_SHA || "local",
    buildDateIso: process.env.VITE_APP_BUILD_DATE || "unknown",
    runtimeChannel: process.env.RAYCAST_RUNTIME_CHANNEL || "development",
    basePath: process.env.BASE_PATH || "/",
    telemetryMode: process.env.VITE_APP_TELEMETRY || "local",
  };
}

const info = existsSync(MANIFEST_PATH)
  ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
  : fallbackInfo();

console.log(JSON.stringify(info, null, 2));
