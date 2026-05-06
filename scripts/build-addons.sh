#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
for d in napi-c napi-cpp addon-nan addon-raw; do
  echo "[build-addons] building $d ..."
  (cd "$REPO_ROOT/addons/$d" && npx node-gyp rebuild)
done
