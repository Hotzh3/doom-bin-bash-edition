export interface RaycastRuntimeInfo {
  appName: string;
  appVersion: string;
  buildSha: string;
  buildDateIso: string;
  runtimeChannel: string;
  basePath: string;
  telemetryMode: "local" | "off" | "remote";
}

function readString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export function getRaycastRuntimeInfo(): RaycastRuntimeInfo {
  return {
    appName: "doom-bin-bash-edition",
    appVersion: readString(import.meta.env.VITE_APP_VERSION, "0.1.0"),
    buildSha: readString(import.meta.env.VITE_APP_BUILD_SHA, "local"),
    buildDateIso: readString(import.meta.env.VITE_APP_BUILD_DATE, "unknown"),
    runtimeChannel: readString(
      import.meta.env.VITE_APP_RUNTIME_CHANNEL,
      import.meta.env.DEV ? "development" : "preview",
    ),
    basePath: import.meta.env.BASE_URL,
    telemetryMode: readString(import.meta.env.VITE_APP_TELEMETRY, "local") as
      | "local"
      | "off"
      | "remote",
  };
}

export function formatRaycastRuntimeLabel(
  info: RaycastRuntimeInfo = getRaycastRuntimeInfo(),
): string {
  const shortSha =
    info.buildSha.length > 7 ? info.buildSha.slice(0, 7) : info.buildSha;
  return `${info.appVersion} · ${info.runtimeChannel} · ${shortSha}`;
}

export function formatRaycastRuntimeFooter(
  info: RaycastRuntimeInfo = getRaycastRuntimeInfo(),
): string {
  return `BUILD · ${formatRaycastRuntimeLabel(info)} · BASE ${info.basePath} · TELEMETRY ${info.telemetryMode.toUpperCase()}`;
}

export function toRaycastRuntimeManifest(
  info: RaycastRuntimeInfo = getRaycastRuntimeInfo(),
): Record<string, string> {
  return {
    appName: info.appName,
    appVersion: info.appVersion,
    buildSha: info.buildSha,
    buildDateIso: info.buildDateIso,
    runtimeChannel: info.runtimeChannel,
    basePath: info.basePath,
    telemetryMode: info.telemetryMode,
  };
}
