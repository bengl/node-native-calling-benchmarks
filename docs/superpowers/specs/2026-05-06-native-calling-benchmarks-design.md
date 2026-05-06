# Node native calling benchmarks — design

A clone-and-run benchmark suite comparing operations-per-second across the
common methods of calling native code from Node.js — both FFI implementations
and native addon styles.

Backends compared:

1. `node:ffi` (Node.js core FFI) on `nodejs/node` `main`
2. `node:ffi` on PR [#63140](https://github.com/nodejs/node/pull/63140) (`bengl/ffi-fastcalls`)
3. `node:ffi` on PR [#63068](https://github.com/nodejs/node/pull/63068) (`ShogunPanda:fast-ffi`)
4. [`koffi`](https://www.npmjs.com/package/koffi) on system Node
5. [`node-ffi-napi`](https://www.npmjs.com/package/ffi-napi) on system Node
6. N-API addon written in C (`<node_api.h>`) on system Node
7. N-API addon written in C++ via `node-addon-api` on system Node
8. Non-N-API addon via [NAN](https://www.npmjs.com/package/nan) on system Node
9. Non-N-API addon written directly against `<v8.h>` / `<node.h>` on system Node

The three Node.js variants share an identical public `node:ffi` API and an
identical set of in-tree benchmark scripts (the SHAs of every file under
`benchmark/ffi/` match across all three refs as of 2026-05-06). The PRs change
the underlying FFI implementation, not its surface, so the same JavaScript
runs unchanged against each of the three binaries.

## Goals

- A single `git clone && npm install && npm run setup && npm run bench` flow
  produces an apples-to-apples ops/sec table across all nine backends.
- Every backend exercises the **same source-level workload**. There is one
  set of C implementations (`lib/native/scenarios.h`); FFI backends call into
  a shared library built from it, native-addon backends include the same
  header. Different binaries, same source.
- All backends are measured by the **same harness**, so timing methodology
  doesn't bias results.
- Setup is automated where it has to be (no public artifacts exist for the
  PRs) and bypassable where contributors already have local builds.

## Non-goals

- Windows support (Linux + macOS only for v1).
- Cross-language comparisons (no Bun, Deno, WASM).
- Statistical sophistication beyond min/median/max across a small number of
  fresh-process samples. No outlier rejection, no confidence intervals.
- Reproducing every exotic call pattern; the scenario set is deliberately
  the curated six already in `nodejs/node:benchmark/ffi/`.
- Running native addons on each Node variant (system Node only — addons
  serve as a fixed baseline; FFI implementation differences are what vary).

## Scenarios

The exact six scenarios from `nodejs/node:benchmark/ffi/`. Each tests one
dimension of native-call overhead.

| Scenario          | Signature                              | n     | Notes                                      |
|-------------------|----------------------------------------|-------|--------------------------------------------|
| `add-i32`         | `i32 add_i32(i32, i32)`                | 1e7   | primitive ints                             |
| `add-f64`         | `f64 add_f64(f64, f64)`                | 1e7   | primitive floats                           |
| `getpid`          | `i32 getpid()` / `uv_os_getpid()`      | 1e7   | no-args                                    |
| `many-args`       | `i32 sum_6_i32(i32×6)`                 | 1e7   | many primitive args                        |
| `pointer-bigint`  | `u64 pointer_to_usize(pointer)`        | 1e7   | pointer-as-bigint, u64 return              |
| `sum-buffer`      | `u64 sum_buffer(pointer, u64)`         | 1e6   | parametrized by buffer size: 64/1024/16384 |

`sum-buffer` runs three times (one per size), so each backend produces 8
measured cells.

## Backends

A backend is a (Node.js binary, calling-mechanism) pair. The table below is
the complete list; each row is one column in the result table.

| Backend ID         | Mechanism                          | Node binary           | Build step              | Extra node flags    |
|--------------------|------------------------------------|-----------------------|-------------------------|---------------------|
| `core-ffi-main`    | `node:ffi`                         | `vendor/node-main`    | source build            | `--experimental-ffi`|
| `core-ffi-63140`   | `node:ffi`                         | `vendor/node-pr-63140`| source build            | `--experimental-ffi`|
| `core-ffi-63068`   | `node:ffi`                         | `vendor/node-pr-63068`| source build            | `--experimental-ffi`|
| `koffi`            | userland FFI (npm `koffi`)         | system node           | npm install             | (none)              |
| `ffi-napi`         | userland FFI (npm `ffi-napi`)      | system node           | npm install + node-gyp  | (none)              |
| `napi-c`           | N-API addon, C                     | system node           | node-gyp                | (none)              |
| `napi-cpp`         | N-API addon, C++ (`node-addon-api`)| system node           | node-gyp                | (none)              |
| `addon-nan`        | non-N-API addon via NAN            | system node           | node-gyp                | (none)              |
| `addon-raw`        | non-N-API addon, raw `<v8.h>`      | system node           | node-gyp                | (none)              |

The three `core-ffi-*` backends share identical JavaScript; the difference
is solely the `node` binary they run on.

## Shared workload (`lib/native/scenarios.h`)

Single source of truth for the actual computations. Header-only, every
implementation as `static inline`:

```c
// lib/native/scenarios.h (sketch)
static inline int32_t  add_i32_impl(int32_t a, int32_t b)            { return a + b; }
static inline double   add_f64_impl(double a, double b)              { return a + b; }
static inline int32_t  sum_6_i32_impl(int32_t a, int32_t b, int32_t c,
                                      int32_t d, int32_t e, int32_t f) { return a+b+c+d+e+f; }
static inline uint64_t pointer_to_usize_impl(const void* p)           { return (uint64_t)(uintptr_t)p; }
static inline uint64_t sum_buffer_impl(const uint8_t* buf, uint64_t n) {
  uint64_t s = 0; for (uint64_t i = 0; i < n; i++) s += buf[i]; return s;
}
```

Every backend's native side ultimately invokes one of these `_impl`
functions. Change the formula here and all nine backends update.

The `getpid` scenario is the only minor exception: the FFI backends call
`uv_os_getpid` from the host process's own symbol table (matching what core's
benchmark does today); the addon backends call `getpid()` from `<unistd.h>`.
Both are equivalent thin wrappers around the same syscall — a few-ns
difference at most. Documented inline; not papered over.

## FFI fixture library (`lib/fixture/`)

A small shared library that the FFI backends (`core-ffi-*`, `koffi`,
`ffi-napi`) `dlopen`. Built once into `lib/fixture/build/ffi_test_library.{so,dylib}`
by `lib/fixture/Makefile`.

```c
// lib/fixture/fixture.c
#include "../native/scenarios.h"

int32_t  add_i32(int32_t a, int32_t b)                               { return add_i32_impl(a, b); }
double   add_f64(double a, double b)                                 { return add_f64_impl(a, b); }
int32_t  sum_6_i32(int32_t a, int32_t b, int32_t c,
                   int32_t d, int32_t e, int32_t f)                   { return sum_6_i32_impl(a,b,c,d,e,f); }
uint64_t pointer_to_usize(const void* p)                              { return pointer_to_usize_impl(p); }
uint64_t sum_buffer(const uint8_t* buf, uint64_t n)                   { return sum_buffer_impl(buf, n); }
```

Symbol names match the existing `nodejs/node:benchmark/ffi/` scripts so the
core-ffi benchmarks need no modification.

## Native addons (`addons/<id>/`)

Four addons, each exposing the same six scenario functions as JS-callable
exports. Each `#include`s `lib/native/scenarios.h` directly — no `dlopen`,
no extra hop. The addon's job is purely to translate JS values to/from C
primitives and call the inline `_impl`.

```
addons/
├── napi-c/     {binding.gyp, addon.c}
├── napi-cpp/   {binding.gyp, addon.cc}
├── addon-nan/  {binding.gyp, addon.cc}
└── addon-raw/  {binding.gyp, addon.cc}
```

Each addon exports a JS object with all six functions, e.g.
`require('./build/Release/addon').add_i32(20, 22)`. The benchmark scripts
in `benchmarks/<addon-id>/` import from the corresponding addon's build
output.

`node-addon-api`, `nan`, and `node-gyp` are dev dependencies in
`package.json`. The `raw/` addon depends on the headers shipped with the
target Node binary; nothing extra to install.

## Repository structure

```
node-native-calling-benchmarks/
├── README.md
├── package.json                         # dev deps: koffi, ffi-napi, ref-napi,
│                                        #          node-addon-api, nan, node-gyp
├── docs/superpowers/specs/              # this file
├── scripts/
│   ├── setup-nodes.sh                   # build 3 Node variants into vendor/
│   ├── build-fixture.sh                 # make -C lib/fixture
│   ├── build-addons.sh                  # node-gyp rebuild in each addons/*
│   └── run.sh                           # full matrix → results/<ts>.json + table
├── lib/
│   ├── native/
│   │   └── scenarios.h                  # single source of truth (static inline)
│   ├── fixture/
│   │   ├── fixture.c                    # #includes scenarios.h
│   │   └── Makefile
│   ├── harness.js                       # shared ops/sec measurement
│   ├── runner.js                        # iterates backends × scenarios
│   └── fixture-path.js                  # resolves the built library path
├── benchmarks/
│   ├── core-ffi/   {add-f64,add-i32,getpid,many-args,pointer-bigint,sum-buffer}.js
│   ├── koffi/      (same six)
│   ├── ffi-napi/   (same six)
│   ├── napi-c/     (same six)
│   ├── napi-cpp/   (same six)
│   ├── addon-nan/  (same six)
│   └── addon-raw/  (same six)
├── addons/
│   ├── napi-c/     {binding.gyp, addon.c}
│   ├── napi-cpp/   {binding.gyp, addon.cc}
│   ├── addon-nan/  {binding.gyp, addon.cc}
│   └── addon-raw/  {binding.gyp, addon.cc}
├── results/                             # gitignored; one JSON per run
└── vendor/                              # gitignored; populated by setup-nodes.sh
    ├── node-src/                        # one clone with worktrees per ref
    │   ├── main/
    │   ├── pr-63140/
    │   └── pr-63068/
    ├── node-main/node
    ├── node-pr-63140/node
    └── node-pr-63068/node
```

## Node binary acquisition (hybrid)

`scripts/setup-nodes.sh`:

1. If `vendor/node-src/main/` does not exist, `git clone https://github.com/nodejs/node vendor/node-src/main`.
2. Add remotes `bengl → https://github.com/bengl/node` and `shogun → https://github.com/ShogunPanda/node`; fetch `bengl/ffi-fastcalls` and `fast-ffi`.
3. Create worktrees: `vendor/node-src/pr-63140/` (checking out `bengl/ffi-fastcalls`) and `vendor/node-src/pr-63068/` (checking out `fast-ffi`).
4. For each of the three worktrees: `./configure --ninja && ninja -C out/Release node`. Copy the resulting `out/Release/node` into `vendor/node-<id>/node`.
5. Each step is skipped if its output already exists (idempotent re-runs).

Build is **release**, default flags. No `--debug`, no PGO, no LTO toggles
beyond Node's defaults.

**Env var override.** If any of `NODE_MAIN`, `NODE_PR_63140`, `NODE_PR_63068`
are set to an existing executable path, the runner uses that path and the
setup script skips building that variant.

## Build orchestration

`npm run setup` runs in this order:

1. `scripts/setup-nodes.sh` — build (or skip via env var) the three Node variants.
2. `scripts/build-fixture.sh` — `make -C lib/fixture`.
3. `scripts/build-addons.sh` — for each `addons/<id>/`: `node-gyp rebuild` against system Node.

Each step is idempotent. `npm run setup:nodes`, `setup:fixture`, `setup:addons`
run them individually for partial re-builds.

## Harness (`lib/harness.js`)

A small module shared across every benchmark script in every backend. Single
exported `bench({ backend, scenario, n, params }, fn)`:

1. **Sanity assertion**: call `fn()` once and compare result to a known value
   (`add_i32(20,22) === 42`, `sum_buffer(zeros(64)) === 0n`, etc.). On
   mismatch, throw — script exits non-zero, runner reports the cell as ERR.
   Catches signature mistakes that would otherwise produce fast garbage.
2. **Warmup**: free-run `fn()` for ~200 ms (wall clock). Discarded.
3. **Measurement**: call `fn()` exactly `n` times under a single
   `process.hrtime.bigint()` window. `opsPerSec = n / (durationNs / 1e9)`.
4. **Output**: one line of JSON on stdout —
   `{ backend, scenario, params, n, durationNs, opsPerSec }`.

The script process exits after one sample. Multiple samples = multiple
process spawns.

## Runner (`lib/runner.js` + `scripts/run.sh`)

1. Resolve every backend's Node binary (vendored path, or env-var override
   for the FFI variants; `process.execPath` of the invoking shell for the
   six system-node backends). Skip-with-message any backend whose
   prerequisites are missing (binary, fixture lib, addon `.node`).
2. For each `(backend, scenario, sample-index)` where
   `sample-index ∈ 0..4` (5 samples), spawn `<binary> [flags] <script>`
   and parse the single JSON line from stdout.
3. Group results by `(backend, scenario, params)`. Compute min, median, max
   of the 5 `opsPerSec` values per cell.
4. Print a console table: rows = scenarios (with size suffix for
   `sum-buffer`), columns = backends, cells = median ops/sec with min–max
   range below.
5. Write the full raw record (every individual sample) to
   `results/<ISO-timestamp>.json`.

## Failure handling

- **Backend missing** (binary not built, addon not compiled, `ffi-napi` install
  failed): skip with a clear log line; the matrix shrinks but every present
  backend still produces a complete column.
- **Scenario throws** (sanity-check fail or runtime crash): caught by the
  harness; the cell is recorded as `{ status: "error", message }` and shown
  as `ERR` in the table; other cells continue.
- **Sample dispersion**: no automatic rejection. Min/max in the JSON make
  noise visible; user inspects.

## Reporting

Console table (median, min–max underneath each cell), example shape
(numbers illustrative):

```
Scenario          core-ffi(main)  core-ffi(63140)  core-ffi(63068)  koffi      ffi-napi  napi-c     napi-cpp   addon-nan  addon-raw
add-i32           12,400,000      38,500,000       35,200,000       4,100,000  820,000   45,200,000 44,800,000 30,500,000 50,100,000
                  12.0M–12.5M     38.0M–38.7M      34.9M–35.5M      ...
add-f64           ...
...
```

`results/<ts>.json` has the structure
`{ meta: { node_versions: {...}, os, arch, ts, cpu }, samples: [ ... ] }`
where each sample is the raw harness JSON line plus the `sampleIndex` and
the absolute Node binary path used.

## Out of scope (explicit YAGNI)

- HTML/charts output. JSON + console table only.
- CI workflow files. (Maintainer-driven runs only; CI builds of three
  Node.js variants per PR is too expensive.)
- Running native addons on each Node variant. Addons run on system Node
  only — they're a fixed baseline.
- Auto-detecting CPU governor / pinning to cores. Document a recommended
  manual setup in README; don't enforce.

## Open questions / risks

- **Build time for setup**: ~30 min × 3 = ~90 min on a typical laptop. A
  README warning + a `--only=<id>` flag on `setup-nodes.sh` for incremental
  use are acceptable mitigations; not solved beyond that.
- **`node-ffi-napi` ABI**: it's a native add-on and may not build against
  every system Node. Documented as "use a recent LTS for system node" in
  the README.
- **Raw `<v8.h>` addon longevity**: V8 internals change. Pinning the addon
  to whatever V8 ships in current LTS is fine; a future Node may require
  small edits. Acknowledged, not pre-solved.
- **NAN obsolescence**: NAN is in maintenance mode. Included for historical
  completeness — many production addons still use it.
- **Compiler-flag parity**: `node-gyp` builds use Node's gyp configuration
  defaults; the fixture library uses its own Makefile flags. Both build
  with `-O2` or `-O3` via their respective defaults; for trivial inline
  functions the codegen difference is negligible. Documented; not enforced.
- **`koffi` calling-convention parity**: koffi distinguishes `Sync` vs
  `Async` calls. We use sync everywhere — matches what core FFI does today.
