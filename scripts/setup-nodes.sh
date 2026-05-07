#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${REPO_ROOT}/vendor/node-src"
OUT_ROOT="${REPO_ROOT}/vendor"
STATE_DIR="${REPO_ROOT}/vendor/state"

NODEJS_REMOTE="https://github.com/nodejs/node"
BENGL_REMOTE="https://github.com/bengl/node"
SHOGUN_REMOTE="https://github.com/ShogunPanda/node"

read_state() {
  cat "$STATE_DIR/$1.sha" 2>/dev/null || true
}

write_state() {
  mkdir -p "$STATE_DIR"
  echo "$2" > "$STATE_DIR/$1.sha"
}

# Build a single variant: check out its upstream commit, configure, build,
# copy the binary out to vendor/<id>/node, record the built commit.
build_variant() {
  local id="$1" ref="$2" envvar="$3"
  local outdir="$OUT_ROOT/$id"

  if [ -n "${!envvar:-}" ]; then
    echo "[setup-nodes] $id: using $envvar=${!envvar}, skipping build"
    return 0
  fi

  local upstream
  upstream=$(cd "$SRC" && git rev-parse "$ref")

  local last_built
  last_built=$(read_state "$id")

  if [ "$last_built" = "$upstream" ] && [ -x "$outdir/node" ]; then
    echo "[setup-nodes] $id: $upstream already built, skipping"
    return 0
  fi

  local dirty
  dirty=$(cd "$SRC" && git status --porcelain)
  if [ -n "$dirty" ]; then
    echo "[setup-nodes] $id: $SRC has uncommitted changes; aborting" >&2
    exit 1
  fi

  echo "[setup-nodes] $id: checking out $upstream"
  (cd "$SRC" && git checkout --detach --quiet "$upstream")

  echo "[setup-nodes] $id: configuring..."
  (cd "$SRC" && ./configure --ninja)
  echo "[setup-nodes] $id: building (this takes ~30 minutes)..."
  (cd "$SRC" && ninja -C out/Release node)

  mkdir -p "$outdir"
  cp "$SRC/out/Release/node" "$outdir/node"
  write_state "$id" "$upstream"
  echo "[setup-nodes] $id: built -> $outdir/node @ $upstream"
}

# Step 1: clone if missing
if [ ! -d "$SRC" ]; then
  echo "[setup-nodes] cloning nodejs/node into $SRC ..."
  mkdir -p "$(dirname "$SRC")"
  git clone "$NODEJS_REMOTE" "$SRC"
fi

# Step 2: remotes & fetch
(
  cd "$SRC"
  git remote get-url bengl  >/dev/null 2>&1 || git remote add bengl  "$BENGL_REMOTE"
  git remote get-url shogun >/dev/null 2>&1 || git remote add shogun "$SHOGUN_REMOTE"
  git fetch origin main
  git fetch bengl  bengl/ffi-fastcalls
  git fetch shogun fast-ffi
)

# Step 3: build each variant sequentially in the single source tree
build_variant "node-main"     "origin/main"               "NODE_MAIN"
build_variant "node-pr-63140" "bengl/bengl/ffi-fastcalls" "NODE_PR_63140"
build_variant "node-pr-63068" "shogun/fast-ffi"           "NODE_PR_63068"

echo "[setup-nodes] done."
