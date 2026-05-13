#!/usr/bin/env bash
set -euo pipefail

URL="http://127.0.0.1:5173"
MAX_ATTEMPTS=30
SLEEP_SECONDS=2

cleanup() {
  docker compose down >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "[docker-smoke] Starting container (build + detached)..."
docker compose up --build -d

echo "[docker-smoke] Waiting for ${URL} ..."
for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
  if curl -sS -I "${URL}" >/tmp/docker-smoke-headers.txt 2>/dev/null; then
    echo "[docker-smoke] Runtime is reachable on attempt ${attempt}."
    cat /tmp/docker-smoke-headers.txt
    if grep -Eq '^HTTP/[0-9.]+ 200' /tmp/docker-smoke-headers.txt; then
      echo "[docker-smoke] OK: HTTP 200 received."
      exit 0
    fi
    echo "[docker-smoke] ERROR: endpoint responded but did not return HTTP 200."
    exit 1
  fi
  sleep "${SLEEP_SECONDS}"
done

echo "[docker-smoke] ERROR: runtime did not become reachable after $((MAX_ATTEMPTS * SLEEP_SECONDS))s."
exit 1
