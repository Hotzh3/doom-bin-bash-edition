import { describe, expect, it } from "vitest";
import {
  formatRaycastRuntimeFooter,
  formatRaycastRuntimeLabel,
} from "../game/runtime/RaycastRuntimeInfo";

describe("raycast runtime info", () => {
  it("formats concise build labels for menu observability", () => {
    expect(
      formatRaycastRuntimeLabel({
        appName: "doom-bin-bash-edition",
        appVersion: "0.1.0",
        buildSha: "abcdef123456",
        buildDateIso: "2026-05-12T00:00:00.000Z",
        runtimeChannel: "preview",
        basePath: "/",
        telemetryMode: "local",
      }),
    ).toBe("0.1.0 · preview · abcdef1");
  });

  it("formats a runtime footer with base path and telemetry state", () => {
    expect(
      formatRaycastRuntimeFooter({
        appName: "doom-bin-bash-edition",
        appVersion: "0.1.0",
        buildSha: "local",
        buildDateIso: "2026-05-12T00:00:00.000Z",
        runtimeChannel: "development",
        basePath: "/doom-bin-bash-edition/",
        telemetryMode: "local",
      }),
    ).toContain("BASE /doom-bin-bash-edition/");
  });
});
