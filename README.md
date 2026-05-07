# node-native-calling-benchmarks

Compares operations-per-second across nine ways of calling native code from Node.js:

| Backend          | Mechanism                                       |
|------------------|-------------------------------------------------|
| `core-ffi-main`  | `node:ffi` on `nodejs/node` `main`              |
| `core-ffi-63140` | `node:ffi` on PR #63140 (`bengl/ffi-fastcalls`) |
| `core-ffi-63068` | `node:ffi` on PR #63068 (`ShogunPanda:fast-ffi`)|
| `koffi`          | userland FFI (npm `koffi`)                      |
| `ffi-napi`       | userland FFI (npm `ffi-napi`)                   |
| `napi-c`         | N-API addon, C                                  |
| `napi-cpp`       | N-API addon, C++ via `node-addon-api`           |
| `addon-nan`      | non-N-API addon via NAN                         |
| `addon-raw`      | non-N-API addon, raw `<v8.h>`                   |

All backends run the same six scenarios from `nodejs/node:benchmark/ffi/`:
`add-i32`, `add-f64`, `getpid`, `many-args`, `pointer-bigint`, and
`sum-buffer` (with sizes 64/1024/16384). The C-level workload is defined
once in `lib/native/scenarios.h` (header-only `static inline` functions)
and reused by both the FFI fixture library and every native addon. Same
source, separately compiled per backend.

## Requirements

- Linux or macOS (no Windows support).
- A C/C++ toolchain (`cc`/`clang`/`g++`, `make`).
- [`nvm`](https://github.com/nvm-sh/nvm) — required because `ffi-napi` is incompatible with current LTS Node releases. The repo pins **Node 20.10.0** via `.nvmrc` (the last version before the `node_api_basic_finalize` ABI change broke `ffi-napi`'s build). All system-Node backends run on this pinned version.
- ~10 GB free disk + ~90 minutes for building the three Node.js variants from source.

## Quick start

```bash
git clone <this repo>
cd node-native-calling-benchmarks
nvm install        # picks up .nvmrc → v20.10.0
nvm use
npm install        # builds ffi-napi against Node 20.10.0
npm run setup      # builds 3 Node.js variants + fixture library + 4 addons
npm run bench
```

`npm run bench` prints a console table and writes a full per-sample JSON
record to `results/<ISO-timestamp>.json`.

### Quick runs

A full run takes roughly an hour, almost all of it in `ffi-napi` (the
slowest backend, by orders of magnitude). For a quick sanity check or
when iterating on the suite itself, dial down via env vars:

```bash
# 1 sample per cell, 100k iterations per scenario (~1 min total)
NCB_SAMPLES=1 NCB_N=100000 npm run bench

# 2 samples, 1M iterations (~5 min total)
NCB_SAMPLES=2 NCB_N=1000000 npm run bench
```

| Var           | Default                       | Effect                                 |
|---------------|-------------------------------|----------------------------------------|
| `NCB_N`       | 1e7 (1e6 for `sum-buffer`)    | Iterations per measurement window      |
| `NCB_SAMPLES` | 5                             | Fresh-process samples per (backend, scenario) cell |
| `NCB_SIZE`    | (per scenario, set by runner) | Buffer size for `sum-buffer` (bytes)   |

Lowering `NCB_N` speeds up `ffi-napi` proportionally (it dominates total
runtime). The ops/sec reported gets noisier but trends remain visible.

## Skipping the Node.js source build

Building three Node.js variants takes ~30 minutes each. If you already have
local builds (or only care about a subset of backends), skip `setup-nodes.sh`
by setting any of:

```bash
export NODE_MAIN=/path/to/your/node
export NODE_PR_63140=/path/to/another/node
export NODE_PR_63068=/path/to/third/node
```

The runner uses these paths directly. Backends with neither a vendored binary
nor an env var are silently skipped (their column shows `-` / `ERR`).

You can also run partial setup:

```bash
npm run setup:nodes      # build the three Node.js variants
npm run setup:fixture    # build the FFI fixture library
npm run setup:addons     # build the four native addons
```

## Tests

```bash
npm test
```

Runs node:test against the harness, runner aggregation, and per-backend
smoke tests for the userland-FFI and addon backends. Tests skip
automatically for backends whose addons or the fixture library aren't
yet built.

## Reproducibility notes

Performance results vary with CPU governor, thermal state, and other
processes. For more stable numbers:

- On Linux: set CPU governor to `performance` and pin the run to specific
  cores (e.g. `taskset -c 0,1 npm run bench`).
- Close other heavy applications.
- Run multiple times and compare the JSON outputs in `results/`.

## Implementation notes

- `lib/native/scenarios.h` holds every workload as `static inline`. Every
  backend's native side ultimately calls one of those `_impl` functions.
- The FFI fixture library (`lib/fixture/`) is a thin set of `extern`
  wrappers around `scenarios.h`, with the symbol names `add_i32`,
  `add_f64`, etc. that the FFI backends `dlopen`.
- The four addons each `#include "scenarios.h"` directly. No `dlopen`
  hop, no separate library — same source code, separately compiled.
- The `pointer-bigint` scenario passes a real `Buffer.alloc(8)` rather
  than a constant BigInt (a deviation from upstream Node's
  `benchmark/ffi/pointer-bigint.js`). Each backend extracts the buffer's
  address using its own idiom; the FFI cost being measured is unchanged.
- `getpid` is the one minor asymmetry: FFI backends call the host
  process's `getpid`/`uv_os_getpid` symbol; addon backends call
  `getpid()` from `<unistd.h>`. Both wrap the same syscall.
- Some backends return `u64` values as JS `Number` (when ≤
  `Number.MAX_SAFE_INTEGER`) and others as `BigInt`. The harness's
  sanity-check accepts either for integer values.

## Known constraints

- **`ffi-napi` is unmaintained.** The latest release (4.0.3, 2021) does
  not build on Node ≥ 22.6 or ≥ 20.18 because of an upstream N-API ABI
  change (`node_api_basic_finalize`). This repo pins to Node 20.10.0
  via `.nvmrc` for that reason. Under that pin, the package builds and
  runs correctly. Bumping `ffi-napi` would require either a maintained
  fork or a dependency replacement.
- **NAN is in maintenance mode.** Included for historical completeness;
  many production addons still use it.

## Layout

```
lib/native/scenarios.h       # single source of truth for the workloads
lib/fixture/                 # FFI shared library wrapping scenarios.h
lib/harness.js               # ops/sec measurement (used by every script)
lib/runner.js                # spawns the matrix, aggregates, prints, writes JSON
lib/backends.js              # backend definitions (id, binary, scenarios)
benchmarks/<backend>/*.js    # per-backend scenario implementations
addons/<addon>/              # native addon sources + binding.gyp
scripts/                     # setup-nodes.sh, build-fixture.sh, build-addons.sh, run.sh
results/                     # gitignored; one JSON per `npm run bench`
vendor/                      # gitignored; populated by setup-nodes.sh
```

## License

MIT.
