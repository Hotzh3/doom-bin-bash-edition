/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_BUILD_SHA?: string;
  readonly VITE_APP_BUILD_DATE?: string;
  readonly VITE_APP_RUNTIME_CHANNEL?: string;
  readonly VITE_APP_TELEMETRY?: string;
}
