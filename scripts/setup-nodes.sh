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
  # PR #63140's head branch is literally "bengl/ffi-fastcalls" on bengl's fork
  git fetch bengl  bengl/ffi-fastcalls
  git fetch shogun fast-ffi
)

# 3. Worktrees for the two PR refs (remote/branch form: bengl/bengl/ffi-fastcalls)
if [ ! -d "$SRC_ROOT/pr-63140" ]; then
  (cd "$SRC_ROOT/main" && git worktree add "$SRC_ROOT/pr-63140" bengl/bengl/ffi-fastcalls)
fi
if [ ! -d "$SRC_ROOT/pr-63068" ]; then
  (cd "$SRC_ROOT/main" && git worktree add "$SRC_ROOT/pr-63068" shogun/fast-ffi)
fi

# 3b. Fast-forward existing PR worktrees to their latest tracking ref so a
# subsequent rebuild picks up new commits. If they've diverged or had local
# edits, leave them alone and warn.
sync_worktree() {
  local worktree="$1" remote_ref="$2" outdir="$3"
  local current upstream
  current=$(cd "$worktree" && git rev-parse HEAD)
  upstream=$(cd "$SRC_ROOT/main" && git rev-parse "$remote_ref")
  if [ "$current" = "$upstream" ]; then
    return 0
  fi
  if (cd "$worktree" && git merge-base --is-ancestor "$current" "$upstream"); then
    echo "[setup-nodes] $worktree: fast-forwarding $current -> $upstream"
    (cd "$worktree" && git reset --hard "$upstream")
    rm -f "$outdir/node"
  else
    echo "[setup-nodes] $worktree: HEAD has diverged from $remote_ref; not touching"
  fi
}
sync_worktree "$SRC_ROOT/pr-63140" bengl/bengl/ffi-fastcalls "$OUT_ROOT/node-pr-63140"
sync_worktree "$SRC_ROOT/pr-63068" shogun/fast-ffi             "$OUT_ROOT/node-pr-63068"
sync_worktree "$SRC_ROOT/main"     origin/main                  "$OUT_ROOT/node-main"

# 4. Build each variant
build_variant "node-main"     "main"           "$SRC_ROOT/main"     "$OUT_ROOT/node-main"     "NODE_MAIN"
build_variant "node-pr-63140" "ffi-fastcalls"  "$SRC_ROOT/pr-63140" "$OUT_ROOT/node-pr-63140" "NODE_PR_63140"
build_variant "node-pr-63068" "fast-ffi"       "$SRC_ROOT/pr-63068" "$OUT_ROOT/node-pr-63068" "NODE_PR_63068"

echo "[setup-nodes] done."
