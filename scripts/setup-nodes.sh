#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_ROOT="${REPO_ROOT}/vendor/node-src"
OUT_ROOT="${REPO_ROOT}/vendor"

NODEJS_REMOTE="https://github.com/nodejs/node"
BENGL_REMOTE="https://github.com/bengl/node"
SHOGUN_REMOTE="https://github.com/ShogunPanda/node"

# (id, ref, source-worktree, output-dir, env-var-override)
build_variant() {
  local id="$1" ref="$2" worktree="$3" outdir="$4" envvar="$5"

  if [ -n "${!envvar:-}" ]; then
    echo "[setup-nodes] $id: using $envvar=${!envvar}, skipping build"
    return 0
  fi

  if [ -x "${outdir}/node" ]; then
    echo "[setup-nodes] $id: ${outdir}/node already present, skipping build"
    return 0
  fi

  echo "[setup-nodes] $id: configuring..."
  (cd "$worktree" && ./configure --ninja)
  echo "[setup-nodes] $id: building (this takes ~30 minutes)..."
  (cd "$worktree" && ninja -C out/Release node)

  mkdir -p "$outdir"
  cp "$worktree/out/Release/node" "$outdir/node"
  echo "[setup-nodes] $id: built -> $outdir/node"
}

# 1. Clone main if needed
if [ ! -d "$SRC_ROOT/main" ]; then
  echo "[setup-nodes] cloning nodejs/node into $SRC_ROOT/main ..."
  mkdir -p "$SRC_ROOT"
  git clone "$NODEJS_REMOTE" "$SRC_ROOT/main"
fi

# 2. Add remotes & fetch refs
(
  cd "$SRC_ROOT/main"
  git remote get-url bengl  >/dev/null 2>&1 || git remote add bengl  "$BENGL_REMOTE"
  git remote get-url shogun >/dev/null 2>&1 || git remote add shogun "$SHOGUN_REMOTE"
  git fetch origin main
  git fetch bengl  ffi-fastcalls
  git fetch shogun fast-ffi
)

# 3. Worktrees for the two PR refs
if [ ! -d "$SRC_ROOT/pr-63140" ]; then
  (cd "$SRC_ROOT/main" && git worktree add "$SRC_ROOT/pr-63140" bengl/ffi-fastcalls)
fi
if [ ! -d "$SRC_ROOT/pr-63068" ]; then
  (cd "$SRC_ROOT/main" && git worktree add "$SRC_ROOT/pr-63068" shogun/fast-ffi)
fi

# 4. Build each variant
build_variant "node-main"     "main"           "$SRC_ROOT/main"     "$OUT_ROOT/node-main"     "NODE_MAIN"
build_variant "node-pr-63140" "ffi-fastcalls"  "$SRC_ROOT/pr-63140" "$OUT_ROOT/node-pr-63140" "NODE_PR_63140"
build_variant "node-pr-63068" "fast-ffi"       "$SRC_ROOT/pr-63068" "$OUT_ROOT/node-pr-63068" "NODE_PR_63068"

echo "[setup-nodes] done."
