# Native calling benchmarks — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clone-and-run benchmark suite that compares ops/sec across nine ways of calling native code from Node.js (3 core-ffi PR variants, koffi, ffi-napi, N-API in C, N-API in C++, NAN, raw V8).

**Architecture:** A single C header (`lib/native/scenarios.h`) holds every workload as `static inline`. An FFI fixture library and four native addons all `#include` it. A shared JS harness (`lib/harness.js`) measures ops/sec identically across every backend. A runner spawns each (backend, scenario) combo as a fresh child process, parses one JSON line per sample, aggregates, and prints a table.

**Tech Stack:** Node.js ≥20, C/C++ (cc / clang / g++), node-gyp, koffi, ffi-napi, node-addon-api, nan. Linux + macOS only.

**Spec:** `docs/superpowers/specs/2026-05-06-native-calling-benchmarks-design.md`

---

## Conventions used in this plan

- All paths are relative to the repo root.
- Benchmarks honor `NCB_N` env var as an override for iteration count (default = scenario's natural `n`). Tests use `NCB_N=100` to keep sanity-runs fast.
- Each backend's six benchmark scripts share an identical structure: load the native function, call `bench()` once with the known-good `expected` value, exit. The harness handles warmup, timing, JSON output.
- The `pointer-bigint` scenario passes a real `Buffer.alloc(8)` rather than a constant BigInt (deviation from the upstream core script). Each backend extracts the buffer's address using its own idiom (`ffi.getRawPointer`, `koffi.address`, `ref.address`). This keeps the comparison fair across backends. Note this in the README.

---

## Task 1: Bootstrap repo

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md` (skeleton; final content in Task 16)
- Create: `tests/.gitkeep`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "node-native-calling-benchmarks",
  "version": "0.0.0",
  "private": true,
  "description": "Compares operations-per-second across methods of calling native code from Node.js",
  "license": "MIT",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "setup": "npm run setup:nodes && npm run setup:fixture && npm run setup:addons",
    "setup:nodes": "bash scripts/setup-nodes.sh",
    "setup:fixture": "bash scripts/build-fixture.sh",
    "setup:addons": "bash scripts/build-addons.sh",
    "bench": "bash scripts/run.sh",
    "test": "node --test tests/"
  },
  "devDependencies": {
    "ffi-napi": "^4.0.3",
    "ref-napi": "^3.0.3",
    "koffi": "^2.10.0",
    "node-addon-api": "^8.2.1",
    "nan": "^2.22.0",
    "node-gyp": "^10.2.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
vendor/
results/
lib/fixture/build/
lib/native/build/
addons/*/build/
*.log
.DS_Store
```

- [ ] **Step 3: Create `README.md` skeleton**

```markdown
# node-native-calling-benchmarks

Compares operations-per-second across methods of calling native code from Node.js.

(Full README populated in Task 16.)
```

- [ ] **Step 4: Create empty tests dir marker**

```bash
touch tests/.gitkeep
```

- [ ] **Step 5: Install deps**

Run: `npm install`
Expected: completes; `node_modules/` populated; `ffi-napi` and `koffi` build their native bindings against system Node.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore README.md tests/.gitkeep
git commit -m "Bootstrap repo: package.json, gitignore, dev deps"
```

---

## Task 2: Shared workload (`scenarios.h`) + C smoke test

**Files:**
- Create: `lib/native/scenarios.h`
- Create: `lib/native/test_scenarios.c`
- Create: `lib/native/Makefile`

- [ ] **Step 1: Write the failing test**

Create `lib/native/test_scenarios.c`:

```c
#include "scenarios.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>

int main(void) {
  assert(add_i32_impl(20, 22) == 42);
  assert(add_f64_impl(1.5, 2.5) == 4.0);
  assert(sum_6_i32_impl(1, 2, 3, 4, 5, 6) == 21);

  int x;
  assert(pointer_to_usize_impl(&x) == (uint64_t)(uintptr_t)&x);

  uint8_t buf[64];
  memset(buf, 0x42, sizeof(buf));
  assert(sum_buffer_impl(buf, sizeof(buf)) == 64ULL * 0x42ULL);

  printf("scenarios: OK\n");
  return 0;
}
```

- [ ] **Step 2: Write the Makefile**

Create `lib/native/Makefile`:

```make
CC ?= cc
CFLAGS ?= -O2 -Wall -Wextra -std=c11

build/test_scenarios: test_scenarios.c scenarios.h
	@mkdir -p build
	$(CC) $(CFLAGS) -o $@ test_scenarios.c

.PHONY: test clean
test: build/test_scenarios
	./build/test_scenarios

clean:
	rm -rf build
```

- [ ] **Step 3: Run the test, verify it fails**

Run: `make -C lib/native test`
Expected: FAIL — `scenarios.h` does not exist yet.

- [ ] **Step 4: Write `scenarios.h`**

Create `lib/native/scenarios.h`:

```c
#ifndef NCB_SCENARIOS_H
#define NCB_SCENARIOS_H

#include <stdint.h>

static inline int32_t add_i32_impl(int32_t a, int32_t b) {
  return a + b;
}

static inline double add_f64_impl(double a, double b) {
  return a + b;
}

static inline int32_t sum_6_i32_impl(int32_t a, int32_t b, int32_t c,
                                     int32_t d, int32_t e, int32_t f) {
  return a + b + c + d + e + f;
}

static inline uint64_t pointer_to_usize_impl(const void* p) {
  return (uint64_t)(uintptr_t)p;
}

static inline uint64_t sum_buffer_impl(const uint8_t* buf, uint64_t n) {
  uint64_t s = 0;
  for (uint64_t i = 0; i < n; i++) s += buf[i];
  return s;
}

#endif
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `make -C lib/native test`
Expected: PASS — prints `scenarios: OK`.

- [ ] **Step 6: Commit**

```bash
git add lib/native/
git commit -m "Add scenarios.h with C-level smoke test"
```

---

## Task 3: FFI fixture library

**Files:**
- Create: `lib/fixture/fixture.c`
- Create: `lib/fixture/Makefile`

- [ ] **Step 1: Write `fixture.c`**

```c
#include "../native/scenarios.h"

#if defined(_WIN32)
  #define EXPORT __declspec(dllexport)
#else
  #define EXPORT __attribute__((visibility("default")))
#endif

EXPORT int32_t add_i32(int32_t a, int32_t b) {
  return add_i32_impl(a, b);
}

EXPORT double add_f64(double a, double b) {
  return add_f64_impl(a, b);
}

EXPORT int32_t sum_6_i32(int32_t a, int32_t b, int32_t c,
                         int32_t d, int32_t e, int32_t f) {
  return sum_6_i32_impl(a, b, c, d, e, f);
}

EXPORT uint64_t pointer_to_usize(const void* p) {
  return pointer_to_usize_impl(p);
}

EXPORT uint64_t sum_buffer(const uint8_t* buf, uint64_t n) {
  return sum_buffer_impl(buf, n);
}
```

- [ ] **Step 2: Write `Makefile`**

```make
UNAME_S := $(shell uname -s)

CC ?= cc
CFLAGS ?= -O2 -Wall -Wextra -std=c11 -fPIC -fvisibility=hidden

ifeq ($(UNAME_S),Darwin)
  EXT := dylib
  LDFLAGS := -dynamiclib
else
  EXT := so
  LDFLAGS := -shared
endif

LIB := build/ffi_test_library.$(EXT)

$(LIB): fixture.c ../native/scenarios.h
	@mkdir -p build
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ fixture.c

.PHONY: all clean
all: $(LIB)

clean:
	rm -rf build
```

- [ ] **Step 3: Build the library**

Run: `make -C lib/fixture`
Expected: produces `lib/fixture/build/ffi_test_library.{so,dylib}`.

- [ ] **Step 4: Verify exported symbols**

On Linux:
```bash
nm -D --defined-only lib/fixture/build/ffi_test_library.so | grep -E 'add_i32|add_f64|sum_6_i32|pointer_to_usize|sum_buffer'
```

On macOS:
```bash
nm -gU lib/fixture/build/ffi_test_library.dylib | grep -E '_add_i32|_add_f64|_sum_6_i32|_pointer_to_usize|_sum_buffer'
```

Expected: 5 lines, one per exported function.

- [ ] **Step 5: Commit**

```bash
git add lib/fixture/
git commit -m "Add FFI fixture library wrapping scenarios.h"
```

---

## Task 4: Harness (`lib/harness.js`)

**Files:**
- Create: `lib/harness.js`
- Create: `tests/harness.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/harness.test.js`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

function runHarnessScript(code, env = {}) {
  return spawnSync(process.execPath, ['-e', code], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('bench emits a JSON line with required fields', () => {
  const code = `
    const { bench } = require('./lib/harness');
    bench({ backend: 'test', scenario: 'noop', n: 1000, expected: 42 }, () => 42);
  `;
  const res = runHarnessScript(code);
  assert.strictEqual(res.status, 0, res.stderr);
  const last = res.stdout.trim().split('\n').pop();
  const parsed = JSON.parse(last);
  assert.strictEqual(parsed.backend, 'test');
  assert.strictEqual(parsed.scenario, 'noop');
  assert.strictEqual(parsed.n, 1000);
  assert.ok(parsed.opsPerSec > 0);
  assert.ok(typeof parsed.durationNs === 'string');
});

test('bench exits non-zero when sanity check fails', () => {
  const code = `
    const { bench } = require('./lib/harness');
    bench({ backend: 'test', scenario: 'bad', n: 100, expected: 42 }, () => 999);
  `;
  const res = runHarnessScript(code);
  assert.notStrictEqual(res.status, 0);
  assert.match(res.stderr, /Sanity check failed/);
});

test('bench respects NCB_N override', () => {
  const code = `
    const { bench } = require('./lib/harness');
    bench({ backend: 'test', scenario: 'short', n: 1e9, expected: 1 }, () => 1);
  `;
  const res = runHarnessScript(code, { NCB_N: '500' });
  assert.strictEqual(res.status, 0, res.stderr);
  const parsed = JSON.parse(res.stdout.trim().split('\n').pop());
  assert.strictEqual(parsed.n, 500);
});

test('bench handles bigint expected', () => {
  const code = `
    const { bench } = require('./lib/harness');
    bench({ backend: 'test', scenario: 'big', n: 100, expected: 42n }, () => 42n);
  `;
  const res = runHarnessScript(code);
  assert.strictEqual(res.status, 0, res.stderr);
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npm test`
Expected: all 4 tests fail — `lib/harness.js` does not exist.

- [ ] **Step 3: Implement `lib/harness.js`**

```js
'use strict';

const { hrtime } = require('node:process');

function valuesEqual(a, b) {
  if (a === b) return true;
  if (typeof a === 'bigint' && typeof b === 'bigint') return a === b;
  if (typeof a === 'number' && typeof b === 'number' &&
      Number.isNaN(a) && Number.isNaN(b)) return true;
  return false;
}

function bench(opts, fn) {
  const { backend, scenario, expected, params } = opts;
  const n = process.env.NCB_N ? Number(process.env.NCB_N) : opts.n;

  const observed = fn();
  if (!valuesEqual(observed, expected)) {
    throw new Error(
      `Sanity check failed for ${backend}/${scenario}: ` +
      `expected ${String(expected)}, got ${String(observed)}`
    );
  }

  const warmupNs = 200_000_000n;
  const warmupStart = hrtime.bigint();
  while (hrtime.bigint() - warmupStart < warmupNs) {
    fn();
  }

  const start = hrtime.bigint();
  for (let i = 0; i < n; i++) {
    fn();
  }
  const end = hrtime.bigint();

  const durationNs = end - start;
  const opsPerSec = n / (Number(durationNs) / 1e9);

  const sample = {
    backend,
    scenario,
    params: params ?? null,
    n,
    durationNs: durationNs.toString(),
    opsPerSec,
  };
  console.log(JSON.stringify(sample));
}

module.exports = { bench };
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npm test`
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/harness.js tests/harness.test.js
git commit -m "Add bench harness with TDD coverage"
```

---

## Task 5: Fixture path helper

**Files:**
- Create: `lib/fixture-path.js`

- [ ] **Step 1: Write the module**

```js
'use strict';

const path = require('node:path');

const ext = process.platform === 'darwin' ? 'dylib' : 'so';

const fixturePath = path.join(
  __dirname, 'fixture', 'build', `ffi_test_library.${ext}`
);

module.exports = { fixturePath };
```

- [ ] **Step 2: Verify file resolves**

Run: `node -e "console.log(require('./lib/fixture-path').fixturePath)"`
Expected: prints `<repo>/lib/fixture/build/ffi_test_library.dylib` or `.so`.

- [ ] **Step 3: Commit**

```bash
git add lib/fixture-path.js
git commit -m "Add fixture-path helper"
```

---

## Task 6: koffi benchmarks

**Files:**
- Create: `benchmarks/koffi/add-i32.js`
- Create: `benchmarks/koffi/add-f64.js`
- Create: `benchmarks/koffi/getpid.js`
- Create: `benchmarks/koffi/many-args.js`
- Create: `benchmarks/koffi/pointer-bigint.js`
- Create: `benchmarks/koffi/sum-buffer.js`
- Create: `tests/koffi.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/koffi.test.js`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const { fixturePath } = require('../lib/fixture-path');
const skip = !fs.existsSync(fixturePath);
const scripts = ['add-i32', 'add-f64', 'getpid', 'many-args', 'pointer-bigint', 'sum-buffer'];

for (const script of scripts) {
  test(`koffi/${script} produces a valid JSON sample`, { skip }, () => {
    const res = spawnSync(
      process.execPath,
      [`benchmarks/koffi/${script}.js`],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, NCB_N: '1000' },
      }
    );
    assert.strictEqual(res.status, 0, res.stderr);
    const last = res.stdout.trim().split('\n').pop();
    const parsed = JSON.parse(last);
    assert.strictEqual(parsed.backend, 'koffi');
    assert.ok(parsed.opsPerSec > 0);
  });
}
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- --test-name-pattern='koffi'`
Expected: FAIL — scripts don't exist.

- [ ] **Step 3: Write `benchmarks/koffi/add-i32.js`**

```js
'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = koffi.load(fixturePath);
const add_i32 = lib.func('int32_t add_i32(int32_t, int32_t)');

bench(
  { backend: 'koffi', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => add_i32(20, 22)
);
```

- [ ] **Step 4: Write `benchmarks/koffi/add-f64.js`**

```js
'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = koffi.load(fixturePath);
const add_f64 = lib.func('double add_f64(double, double)');

bench(
  { backend: 'koffi', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => add_f64(1.5, 2.5)
);
```

- [ ] **Step 5: Write `benchmarks/koffi/getpid.js`**

```js
'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');

const libcPath = process.platform === 'darwin' ? 'libc.dylib' : 'libc.so.6';
const libc = koffi.load(libcPath);
const getpid = libc.func('int getpid(void)');

bench(
  { backend: 'koffi', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => getpid()
);
```

- [ ] **Step 6: Write `benchmarks/koffi/many-args.js`**

```js
'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = koffi.load(fixturePath);
const sum_6_i32 = lib.func(
  'int32_t sum_6_i32(int32_t, int32_t, int32_t, int32_t, int32_t, int32_t)'
);

bench(
  { backend: 'koffi', scenario: 'many-args', n: 1e7, expected: 21 },
  () => sum_6_i32(1, 2, 3, 4, 5, 6)
);
```

- [ ] **Step 7: Write `benchmarks/koffi/pointer-bigint.js`**

```js
'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = koffi.load(fixturePath);
const pointer_to_usize = lib.func('uint64_t pointer_to_usize(const void *)');

const buf = Buffer.alloc(8);
const expected = BigInt(koffi.address(buf));

bench(
  { backend: 'koffi', scenario: 'pointer-bigint', n: 1e7, expected },
  () => pointer_to_usize(buf)
);
```

- [ ] **Step 8: Write `benchmarks/koffi/sum-buffer.js`**

```js
'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = koffi.load(fixturePath);
const sum_buffer = lib.func('uint64_t sum_buffer(const uint8_t *, uint64_t)');

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const expected = BigInt(size) * 0x42n;

bench(
  {
    backend: 'koffi',
    scenario: 'sum-buffer',
    n: 1e6,
    params: { size },
    expected,
  },
  () => sum_buffer(buf, size)
);
```

- [ ] **Step 9: Run tests, verify pass**

Run: `npm test -- --test-name-pattern='koffi'`
Expected: 6 tests pass.

- [ ] **Step 10: Smoke run one script with full n**

Run: `node benchmarks/koffi/add-i32.js`
Expected: prints one JSON line; `opsPerSec` is a real number; takes a couple of seconds.

- [ ] **Step 11: Commit**

```bash
git add benchmarks/koffi/ tests/koffi.test.js
git commit -m "Add koffi benchmark scripts for all 6 scenarios"
```

---

## Task 7: ffi-napi benchmarks

**Files:**
- Create: `benchmarks/ffi-napi/add-i32.js`
- Create: `benchmarks/ffi-napi/add-f64.js`
- Create: `benchmarks/ffi-napi/getpid.js`
- Create: `benchmarks/ffi-napi/many-args.js`
- Create: `benchmarks/ffi-napi/pointer-bigint.js`
- Create: `benchmarks/ffi-napi/sum-buffer.js`
- Create: `tests/ffi-napi.test.js`

`ffi-napi` requires `ref-napi` for type definitions. `uint64` arrives in JS as a string-formatted decimal (per ref-napi convention) — convert to BigInt via `BigInt(str)`.

- [ ] **Step 1: Write the failing test**

Create `tests/ffi-napi.test.js`. Same shape as `tests/koffi.test.js`, with `koffi` replaced by `ffi-napi`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const { fixturePath } = require('../lib/fixture-path');
const skip = !fs.existsSync(fixturePath);
const scripts = ['add-i32', 'add-f64', 'getpid', 'many-args', 'pointer-bigint', 'sum-buffer'];

for (const script of scripts) {
  test(`ffi-napi/${script} produces a valid JSON sample`, { skip }, () => {
    const res = spawnSync(
      process.execPath,
      [`benchmarks/ffi-napi/${script}.js`],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, NCB_N: '1000' },
      }
    );
    assert.strictEqual(res.status, 0, res.stderr);
    const last = res.stdout.trim().split('\n').pop();
    const parsed = JSON.parse(last);
    assert.strictEqual(parsed.backend, 'ffi-napi');
    assert.ok(parsed.opsPerSec > 0);
  });
}
```

- [ ] **Step 2: Run, verify failure**

Run: `npm test -- --test-name-pattern='ffi-napi'`
Expected: 6 failures.

- [ ] **Step 3: Write `benchmarks/ffi-napi/add-i32.js`**

```js
'use strict';

const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = ffi.Library(fixturePath, {
  add_i32: ['int32', ['int32', 'int32']],
});

bench(
  { backend: 'ffi-napi', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => lib.add_i32(20, 22)
);
```

- [ ] **Step 4: Write `benchmarks/ffi-napi/add-f64.js`**

```js
'use strict';

const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = ffi.Library(fixturePath, {
  add_f64: ['double', ['double', 'double']],
});

bench(
  { backend: 'ffi-napi', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => lib.add_f64(1.5, 2.5)
);
```

- [ ] **Step 5: Write `benchmarks/ffi-napi/getpid.js`**

```js
'use strict';

const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');

const libcPath = process.platform === 'darwin' ? 'libc.dylib' : 'libc.so.6';
const libc = ffi.Library(libcPath, {
  getpid: ['int32', []],
});

bench(
  { backend: 'ffi-napi', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => libc.getpid()
);
```

- [ ] **Step 6: Write `benchmarks/ffi-napi/many-args.js`**

```js
'use strict';

const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = ffi.Library(fixturePath, {
  sum_6_i32: ['int32', ['int32', 'int32', 'int32', 'int32', 'int32', 'int32']],
});

bench(
  { backend: 'ffi-napi', scenario: 'many-args', n: 1e7, expected: 21 },
  () => lib.sum_6_i32(1, 2, 3, 4, 5, 6)
);
```

- [ ] **Step 7: Write `benchmarks/ffi-napi/pointer-bigint.js`**

```js
'use strict';

const ffi = require('ffi-napi');
const ref = require('ref-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = ffi.Library(fixturePath, {
  // ffi-napi returns uint64 as a decimal string
  pointer_to_usize: ['uint64', ['pointer']],
});

const buf = Buffer.alloc(8);
const expected = BigInt(ref.address(buf));

bench(
  { backend: 'ffi-napi', scenario: 'pointer-bigint', n: 1e7, expected },
  () => BigInt(lib.pointer_to_usize(buf))
);
```

> Note: `ref.address(buf)` returns a JS number on most builds, accurate up to ~2^53; on 64-bit systems with high-bit addresses this is lossy. For the sanity check we trust `Buffer.alloc(8)` to live in the low half of the address space; the loop body call doesn't re-read the address.

- [ ] **Step 8: Write `benchmarks/ffi-napi/sum-buffer.js`**

```js
'use strict';

const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = ffi.Library(fixturePath, {
  sum_buffer: ['uint64', ['pointer', 'uint64']],
});

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const expected = BigInt(size) * 0x42n;

bench(
  {
    backend: 'ffi-napi',
    scenario: 'sum-buffer',
    n: 1e6,
    params: { size },
    expected,
  },
  () => BigInt(lib.sum_buffer(buf, size))
);
```

- [ ] **Step 9: Run tests, verify pass**

Run: `npm test -- --test-name-pattern='ffi-napi'`
Expected: 6 tests pass.

- [ ] **Step 10: Commit**

```bash
git add benchmarks/ffi-napi/ tests/ffi-napi.test.js
git commit -m "Add ffi-napi benchmark scripts for all 6 scenarios"
```

---

## Task 8: Runner (`lib/runner.js`)

**Files:**
- Create: `lib/runner.js`
- Create: `lib/backends.js`
- Create: `tests/runner.test.js`

`backends.js` enumerates the nine backends as data: id, node-binary resolver, benchmark dir, scenarios list, optional flags. Runner imports and iterates.

- [ ] **Step 1: Write the failing tests for pure helpers**

Create `tests/runner.test.js`:

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { aggregate, formatTable } = require('../lib/runner');

test('aggregate computes min/median/max per (backend, scenario, params) cell', () => {
  const samples = [
    { backend: 'a', scenario: 'x', params: null, opsPerSec: 100 },
    { backend: 'a', scenario: 'x', params: null, opsPerSec: 110 },
    { backend: 'a', scenario: 'x', params: null, opsPerSec: 90 },
    { backend: 'a', scenario: 'x', params: null, opsPerSec: 105 },
    { backend: 'a', scenario: 'x', params: null, opsPerSec: 95 },
  ];
  const out = aggregate(samples);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].min, 90);
  assert.strictEqual(out[0].max, 110);
  assert.strictEqual(out[0].median, 100);
});

test('aggregate groups sum-buffer by params.size', () => {
  const samples = [
    { backend: 'a', scenario: 'sum-buffer', params: { size: 64 }, opsPerSec: 100 },
    { backend: 'a', scenario: 'sum-buffer', params: { size: 1024 }, opsPerSec: 50 },
    { backend: 'a', scenario: 'sum-buffer', params: { size: 64 }, opsPerSec: 110 },
  ];
  const out = aggregate(samples);
  const sizes = out.map((r) => r.params.size).sort((a, b) => a - b);
  assert.deepStrictEqual(sizes, [64, 1024]);
});

test('aggregate records errored cells as status=error', () => {
  const samples = [
    { backend: 'a', scenario: 'x', params: null, status: 'error', error: 'boom' },
  ];
  const out = aggregate(samples);
  assert.strictEqual(out[0].status, 'error');
});

test('formatTable produces a string with backend column headers', () => {
  const aggregated = [
    { backend: 'a', scenario: 'x', params: null, median: 100, min: 90, max: 110 },
    { backend: 'b', scenario: 'x', params: null, median: 200, min: 190, max: 210 },
  ];
  const table = formatTable(aggregated);
  assert.match(table, /\ba\b/);
  assert.match(table, /\bb\b/);
  assert.match(table, /\bx\b/);
});
```

- [ ] **Step 2: Write the failing tests, run them**

Run: `npm test -- --test-name-pattern='aggregate|formatTable'`
Expected: failures — `lib/runner.js` doesn't exist.

- [ ] **Step 3: Implement `lib/backends.js`**

```js
'use strict';

const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

const SCENARIOS_PRIMITIVE = ['add-i32', 'add-f64', 'getpid', 'many-args', 'pointer-bigint'];
const SUM_BUFFER_SIZES = [64, 1024, 16384];

function scenarioRuns(benchmarkDir) {
  const runs = [];
  for (const s of SCENARIOS_PRIMITIVE) {
    runs.push({
      scenario: s,
      script: path.join(repoRoot, 'benchmarks', benchmarkDir, `${s}.js`),
      env: {},
    });
  }
  for (const size of SUM_BUFFER_SIZES) {
    runs.push({
      scenario: 'sum-buffer',
      script: path.join(repoRoot, 'benchmarks', benchmarkDir, 'sum-buffer.js'),
      env: { NCB_SIZE: String(size) },
    });
  }
  return runs;
}

function vendoredNode(name, envVar) {
  return () => {
    if (process.env[envVar]) return process.env[envVar];
    const p = path.join(repoRoot, 'vendor', name, 'node');
    return p;
  };
}

const backends = [
  {
    id: 'core-ffi-main',
    nodeBinary: vendoredNode('node-main', 'NODE_MAIN'),
    flags: ['--experimental-ffi'],
    runs: scenarioRuns('core-ffi'),
  },
  {
    id: 'core-ffi-63140',
    nodeBinary: vendoredNode('node-pr-63140', 'NODE_PR_63140'),
    flags: ['--experimental-ffi'],
    runs: scenarioRuns('core-ffi'),
  },
  {
    id: 'core-ffi-63068',
    nodeBinary: vendoredNode('node-pr-63068', 'NODE_PR_63068'),
    flags: ['--experimental-ffi'],
    runs: scenarioRuns('core-ffi'),
  },
  { id: 'koffi',     nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('koffi') },
  { id: 'ffi-napi',  nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('ffi-napi') },
  { id: 'napi-c',    nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('napi-c') },
  { id: 'napi-cpp',  nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('napi-cpp') },
  { id: 'addon-nan', nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('addon-nan') },
  { id: 'addon-raw', nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('addon-raw') },
];

module.exports = { backends };
```

- [ ] **Step 4: Implement `lib/runner.js`**

```js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { backends } = require('./backends');

const SAMPLE_COUNT = 5;

function cellKey(s) {
  const p = s.params ? JSON.stringify(s.params) : '';
  return `${s.backend}|${s.scenario}|${p}`;
}

function aggregate(samples) {
  const groups = new Map();
  for (const s of samples) {
    const k = cellKey(s);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(s);
  }
  const out = [];
  for (const [, list] of groups) {
    const first = list[0];
    const errored = list.find((s) => s.status === 'error');
    if (errored) {
      out.push({
        backend: first.backend,
        scenario: first.scenario,
        params: first.params,
        status: 'error',
        error: errored.error,
      });
      continue;
    }
    const ops = list.map((s) => s.opsPerSec).sort((a, b) => a - b);
    out.push({
      backend: first.backend,
      scenario: first.scenario,
      params: first.params,
      min: ops[0],
      median: ops[Math.floor(ops.length / 2)],
      max: ops[ops.length - 1],
      samples: list.length,
    });
  }
  return out;
}

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toFixed(0);
}

function formatTable(rows) {
  const backendIds = [...new Set(rows.map((r) => r.backend))];
  const scenarioRows = [...new Set(rows.map((r) => {
    const suffix = r.params?.size != null ? `-${r.params.size}` : '';
    return r.scenario + suffix;
  }))];

  const lookup = new Map();
  for (const r of rows) {
    const suffix = r.params?.size != null ? `-${r.params.size}` : '';
    lookup.set(`${r.backend}|${r.scenario}${suffix}`, r);
  }

  const header = ['Scenario', ...backendIds];
  const lines = [header.join('\t')];
  for (const sc of scenarioRows) {
    const row = [sc];
    for (const b of backendIds) {
      const r = lookup.get(`${b}|${sc}`);
      if (!r) row.push('-');
      else if (r.status === 'error') row.push('ERR');
      else row.push(formatNum(r.median));
    }
    lines.push(row.join('\t'));
  }
  return lines.join('\n');
}

function runOne(backend, run, sampleIndex) {
  const bin = backend.nodeBinary();
  if (!bin || !fs.existsSync(bin)) {
    return {
      backend: backend.id, scenario: run.scenario,
      params: run.env.NCB_SIZE ? { size: Number(run.env.NCB_SIZE) } : null,
      status: 'error', error: `node binary missing: ${bin}`,
    };
  }
  if (!fs.existsSync(run.script)) {
    return {
      backend: backend.id, scenario: run.scenario,
      params: run.env.NCB_SIZE ? { size: Number(run.env.NCB_SIZE) } : null,
      status: 'error', error: `script missing: ${run.script}`,
    };
  }
  const res = spawnSync(bin, [...backend.flags, run.script], {
    encoding: 'utf8',
    env: { ...process.env, ...run.env },
  });
  if (res.status !== 0) {
    return {
      backend: backend.id, scenario: run.scenario,
      params: run.env.NCB_SIZE ? { size: Number(run.env.NCB_SIZE) } : null,
      status: 'error', error: (res.stderr || '').trim().slice(0, 500),
    };
  }
  const last = res.stdout.trim().split('\n').pop();
  const parsed = JSON.parse(last);
  // Scripts emit a generic backend label (e.g. "core-ffi"); replace with
  // the outer backend's id so aggregation keys correctly per node binary.
  parsed.backend = backend.id;
  parsed.sampleIndex = sampleIndex;
  parsed.binaryPath = bin;
  return parsed;
}

function runAll() {
  const all = [];
  for (const backend of backends) {
    for (const run of backend.runs) {
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const s = runOne(backend, run, i);
        all.push(s);
      }
    }
  }
  return all;
}

function main() {
  const samples = runAll();
  const aggregated = aggregate(samples);
  console.log('\n' + formatTable(aggregated) + '\n');

  fs.mkdirSync('results', { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join('results', `${ts}.json`);
  fs.writeFileSync(outPath, JSON.stringify({
    meta: {
      ts,
      os: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
    samples,
  }, null, 2));
  console.log(`Wrote ${outPath}`);
}

if (require.main === module) main();

module.exports = { aggregate, formatTable, runAll, main };
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npm test`
Expected: all tests pass (existing harness/koffi/ffi-napi + new runner aggregate/formatTable).

- [ ] **Step 6: Smoke run runner against the two backends present so far**

Run: `node lib/runner.js`
Expected: prints a table with `koffi` and `ffi-napi` columns; rows for the 8 cells; `core-ffi-*` and `napi-*` and `addon-*` columns show `ERR` (binaries / scripts missing). A `results/<ts>.json` file is written.

- [ ] **Step 7: Commit**

```bash
git add lib/backends.js lib/runner.js tests/runner.test.js
git commit -m "Add runner with aggregation, table formatting, and TDD coverage"
```

---

## Task 9: setup-nodes.sh

**Files:**
- Create: `scripts/setup-nodes.sh`

This script is not unit-tested (a full Node build is too slow for CI/local test loops). The "test" is running it manually and seeing that it produces the expected binaries.

- [ ] **Step 1: Write the script**

```bash
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
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/setup-nodes.sh
```

- [ ] **Step 3: Lint with shellcheck if available**

```bash
shellcheck scripts/setup-nodes.sh || echo "(shellcheck not installed; skipping)"
```

Expected: no errors. Warnings about `${!envvar}` indirection are acceptable.

- [ ] **Step 4: Verify dry-run output (don't actually run a 90-min build)**

Run: `bash -n scripts/setup-nodes.sh`
Expected: no syntax errors.

- [ ] **Step 5: Commit**

```bash
git add scripts/setup-nodes.sh
git commit -m "Add setup-nodes.sh for building the three Node.js variants"
```

---

## Task 10: core-ffi benchmarks

**Files:**
- Create: `benchmarks/core-ffi/add-i32.js`
- Create: `benchmarks/core-ffi/add-f64.js`
- Create: `benchmarks/core-ffi/getpid.js`
- Create: `benchmarks/core-ffi/many-args.js`
- Create: `benchmarks/core-ffi/pointer-bigint.js`
- Create: `benchmarks/core-ffi/sum-buffer.js`

These scripts use `node:ffi` and require running on one of the vendored Node binaries with `--experimental-ffi`. There's no automated unit test (system node doesn't have `node:ffi`); the test is a manual smoke run on a built variant.

- [ ] **Step 1: Write `benchmarks/core-ffi/add-i32.js`**

```js
'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const { lib, functions } = ffi.dlopen(fixturePath, {
  add_i32: { result: 'i32', parameters: ['i32', 'i32'] },
});
const add_i32 = functions.add_i32;

bench(
  { backend: 'core-ffi', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => add_i32(20, 22)
);
lib.close();
```

- [ ] **Step 2: Write `benchmarks/core-ffi/add-f64.js`**

```js
'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const { lib, functions } = ffi.dlopen(fixturePath, {
  add_f64: { result: 'f64', parameters: ['f64', 'f64'] },
});
const add_f64 = functions.add_f64;

bench(
  { backend: 'core-ffi', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => add_f64(1.5, 2.5)
);
lib.close();
```

- [ ] **Step 3: Write `benchmarks/core-ffi/getpid.js`**

```js
'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');

const { lib, functions } = ffi.dlopen(null, {
  uv_os_getpid: { result: 'i32', parameters: [] },
});
const getpid = functions.uv_os_getpid;

bench(
  { backend: 'core-ffi', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => getpid()
);
lib.close();
```

- [ ] **Step 4: Write `benchmarks/core-ffi/many-args.js`**

```js
'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const { lib, functions } = ffi.dlopen(fixturePath, {
  sum_6_i32: { result: 'i32', parameters: ['i32', 'i32', 'i32', 'i32', 'i32', 'i32'] },
});
const sum_6_i32 = functions.sum_6_i32;

bench(
  { backend: 'core-ffi', scenario: 'many-args', n: 1e7, expected: 21 },
  () => sum_6_i32(1, 2, 3, 4, 5, 6)
);
lib.close();
```

- [ ] **Step 5: Write `benchmarks/core-ffi/pointer-bigint.js`**

```js
'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const { lib, functions } = ffi.dlopen(fixturePath, {
  pointer_to_usize: { result: 'u64', parameters: ['pointer'] },
});
const fn = functions.pointer_to_usize;

const buf = Buffer.alloc(8);
const ptr = ffi.getRawPointer(buf);

bench(
  { backend: 'core-ffi', scenario: 'pointer-bigint', n: 1e7, expected: ptr },
  () => fn(ptr)
);
lib.close();
```

- [ ] **Step 6: Write `benchmarks/core-ffi/sum-buffer.js`**

```js
'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const { lib, functions } = ffi.dlopen(fixturePath, {
  sum_buffer: { result: 'u64', parameters: ['pointer', 'u64'] },
});
const sum_buffer = functions.sum_buffer;

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const ptr = ffi.getRawPointer(buf);
const len = BigInt(size);
const expected = BigInt(size) * 0x42n;

bench(
  {
    backend: 'core-ffi',
    scenario: 'sum-buffer',
    n: 1e6,
    params: { size },
    expected,
  },
  () => sum_buffer(ptr, len)
);
lib.close();
```

- [ ] **Step 7: Smoke run**

Once at least `vendor/node-main/node` exists (built via Task 9 or via `NODE_MAIN=` env override pointing at any local Node.js build with `node:ffi` support), run:

```bash
NCB_N=1000 ./vendor/node-main/node --experimental-ffi benchmarks/core-ffi/add-i32.js
```

Expected: one JSON line on stdout with `backend: "core-ffi"`, `opsPerSec > 0`. Repeat for the other 5 scripts.

- [ ] **Step 8: Commit**

```bash
git add benchmarks/core-ffi/
git commit -m "Add core-ffi benchmark scripts for all 6 scenarios"
```

---

## Task 11: napi-c addon + benchmarks

**Files:**
- Create: `addons/napi-c/binding.gyp`
- Create: `addons/napi-c/addon.c`
- Create: `benchmarks/napi-c/add-i32.js`
- Create: `benchmarks/napi-c/add-f64.js`
- Create: `benchmarks/napi-c/getpid.js`
- Create: `benchmarks/napi-c/many-args.js`
- Create: `benchmarks/napi-c/pointer-bigint.js`
- Create: `benchmarks/napi-c/sum-buffer.js`
- Create: `tests/napi-c.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/napi-c.test.js` (mirror of koffi.test.js, with `napi-c` and skip if addon not built):

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const addonPath = path.join(repoRoot, 'addons', 'napi-c', 'build', 'Release', 'addon.node');
const skip = !fs.existsSync(addonPath);

const scripts = ['add-i32', 'add-f64', 'getpid', 'many-args', 'pointer-bigint', 'sum-buffer'];

for (const script of scripts) {
  test(`napi-c/${script} produces a valid JSON sample`, { skip }, () => {
    const res = spawnSync(
      process.execPath,
      [`benchmarks/napi-c/${script}.js`],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, NCB_N: '1000' },
      }
    );
    assert.strictEqual(res.status, 0, res.stderr);
    const parsed = JSON.parse(res.stdout.trim().split('\n').pop());
    assert.strictEqual(parsed.backend, 'napi-c');
  });
}
```

- [ ] **Step 2: Write `addons/napi-c/binding.gyp`**

```python
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "addon.c" ],
      "include_dirs": [ "<(module_root_dir)/../../lib/native" ],
      "cflags": [ "-O2", "-Wall", "-Wextra" ]
    }
  ]
}
```

- [ ] **Step 3: Write `addons/napi-c/addon.c`**

```c
#define NAPI_VERSION 8
#include <node_api.h>
#include <unistd.h>
#include "scenarios.h"

#define DECLARE_METHOD(name) \
  { #name, NULL, name, NULL, NULL, NULL, napi_default, NULL }

static napi_value add_i32(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  int32_t a, b;
  napi_get_value_int32(env, argv[0], &a);
  napi_get_value_int32(env, argv[1], &b);
  napi_value out;
  napi_create_int32(env, add_i32_impl(a, b), &out);
  return out;
}

static napi_value add_f64(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  double a, b;
  napi_get_value_double(env, argv[0], &a);
  napi_get_value_double(env, argv[1], &b);
  napi_value out;
  napi_create_double(env, add_f64_impl(a, b), &out);
  return out;
}

static napi_value getpid_fn(napi_env env, napi_callback_info info) {
  (void)info;
  napi_value out;
  napi_create_int32(env, (int32_t)getpid(), &out);
  return out;
}

static napi_value sum_6_i32(napi_env env, napi_callback_info info) {
  size_t argc = 6;
  napi_value argv[6];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  int32_t v[6];
  for (size_t i = 0; i < 6; i++) napi_get_value_int32(env, argv[i], &v[i]);
  napi_value out;
  napi_create_int32(env, sum_6_i32_impl(v[0],v[1],v[2],v[3],v[4],v[5]), &out);
  return out;
}

static napi_value pointer_to_usize(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  void* data; size_t len;
  napi_get_buffer_info(env, argv[0], &data, &len);
  napi_value out;
  napi_create_bigint_uint64(env, pointer_to_usize_impl(data), &out);
  return out;
}

static napi_value sum_buffer(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  void* data; size_t len;
  napi_get_buffer_info(env, argv[0], &data, &len);
  napi_value out;
  napi_create_bigint_uint64(env, sum_buffer_impl((const uint8_t*)data, (uint64_t)len), &out);
  return out;
}

NAPI_MODULE_INIT() {
  napi_property_descriptor props[] = {
    DECLARE_METHOD(add_i32),
    DECLARE_METHOD(add_f64),
    { "getpid", NULL, getpid_fn, NULL, NULL, NULL, napi_default, NULL },
    DECLARE_METHOD(sum_6_i32),
    DECLARE_METHOD(pointer_to_usize),
    DECLARE_METHOD(sum_buffer),
  };
  napi_define_properties(env, exports, sizeof(props)/sizeof(*props), props);
  return exports;
}
```

> Note: the JS-side benchmark for `pointer-bigint` passes a fixed Buffer; `pointer_to_usize` extracts the buffer's data pointer. Same for `sum-buffer`. This matches what the FFI backends do.

- [ ] **Step 4: Build the addon**

```bash
(cd addons/napi-c && npx node-gyp rebuild)
```

Expected: produces `addons/napi-c/build/Release/addon.node`.

- [ ] **Step 5: Write benchmark scripts**

`benchmarks/napi-c/add-i32.js`:

```js
'use strict';
const addon = require('../../addons/napi-c/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-c', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => addon.add_i32(20, 22)
);
```

`benchmarks/napi-c/add-f64.js`:

```js
'use strict';
const addon = require('../../addons/napi-c/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-c', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => addon.add_f64(1.5, 2.5)
);
```

`benchmarks/napi-c/getpid.js`:

```js
'use strict';
const addon = require('../../addons/napi-c/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-c', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => addon.getpid()
);
```

`benchmarks/napi-c/many-args.js`:

```js
'use strict';
const addon = require('../../addons/napi-c/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-c', scenario: 'many-args', n: 1e7, expected: 21 },
  () => addon.sum_6_i32(1, 2, 3, 4, 5, 6)
);
```

`benchmarks/napi-c/pointer-bigint.js`:

```js
'use strict';
const addon = require('../../addons/napi-c/build/Release/addon.node');
const { bench } = require('../../lib/harness');

const buf = Buffer.alloc(8);
// addon returns the buffer's data-pointer as bigint; we read once for expected.
const expected = addon.pointer_to_usize(buf);

bench(
  { backend: 'napi-c', scenario: 'pointer-bigint', n: 1e7, expected },
  () => addon.pointer_to_usize(buf)
);
```

`benchmarks/napi-c/sum-buffer.js`:

```js
'use strict';
const addon = require('../../addons/napi-c/build/Release/addon.node');
const { bench } = require('../../lib/harness');

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const expected = BigInt(size) * 0x42n;

bench(
  { backend: 'napi-c', scenario: 'sum-buffer', n: 1e6, params: { size }, expected },
  () => addon.sum_buffer(buf)
);
```

- [ ] **Step 6: Run tests**

Run: `npm test -- --test-name-pattern='napi-c'`
Expected: 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add addons/napi-c/binding.gyp addons/napi-c/addon.c benchmarks/napi-c/ tests/napi-c.test.js
git commit -m "Add napi-c addon and benchmark scripts"
```

---

## Task 12: napi-cpp addon + benchmarks

**Files:**
- Create: `addons/napi-cpp/binding.gyp`
- Create: `addons/napi-cpp/addon.cc`
- Create: `benchmarks/napi-cpp/{add-i32,add-f64,getpid,many-args,pointer-bigint,sum-buffer}.js`
- Create: `tests/napi-cpp.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/napi-cpp.test.js`. Identical structure to `tests/napi-c.test.js`, replace `napi-c` with `napi-cpp` everywhere.

- [ ] **Step 2: Write `binding.gyp`**

```python
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "addon.cc" ],
      "include_dirs": [
        "<(module_root_dir)/../../lib/native",
        "<!@(node -p \"require('node-addon-api').include_dir\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [ "NAPI_VERSION=8", "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "NO"
      }
    }
  ]
}
```

- [ ] **Step 3: Write `addon.cc`**

```cpp
#include <napi.h>
#include <unistd.h>
extern "C" {
#include "scenarios.h"
}

static Napi::Value AddI32(const Napi::CallbackInfo& info) {
  int32_t a = info[0].As<Napi::Number>().Int32Value();
  int32_t b = info[1].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(), add_i32_impl(a, b));
}

static Napi::Value AddF64(const Napi::CallbackInfo& info) {
  double a = info[0].As<Napi::Number>().DoubleValue();
  double b = info[1].As<Napi::Number>().DoubleValue();
  return Napi::Number::New(info.Env(), add_f64_impl(a, b));
}

static Napi::Value Getpid(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), (int32_t)getpid());
}

static Napi::Value Sum6I32(const Napi::CallbackInfo& info) {
  int32_t v[6];
  for (size_t i = 0; i < 6; i++) v[i] = info[i].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(),
    sum_6_i32_impl(v[0], v[1], v[2], v[3], v[4], v[5]));
}

static Napi::Value PointerToUsize(const Napi::CallbackInfo& info) {
  Napi::Buffer<uint8_t> buf = info[0].As<Napi::Buffer<uint8_t>>();
  bool lossless;
  return Napi::BigInt::New(info.Env(),
    pointer_to_usize_impl(buf.Data()));
  (void)lossless;
}

static Napi::Value SumBuffer(const Napi::CallbackInfo& info) {
  Napi::Buffer<uint8_t> buf = info[0].As<Napi::Buffer<uint8_t>>();
  return Napi::BigInt::New(info.Env(),
    sum_buffer_impl(buf.Data(), (uint64_t)buf.Length()));
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("add_i32", Napi::Function::New(env, AddI32));
  exports.Set("add_f64", Napi::Function::New(env, AddF64));
  exports.Set("getpid",  Napi::Function::New(env, Getpid));
  exports.Set("sum_6_i32", Napi::Function::New(env, Sum6I32));
  exports.Set("pointer_to_usize", Napi::Function::New(env, PointerToUsize));
  exports.Set("sum_buffer", Napi::Function::New(env, SumBuffer));
  return exports;
}

NODE_API_MODULE(addon, Init)
```

- [ ] **Step 4: Build the addon**

```bash
(cd addons/napi-cpp && npx node-gyp rebuild)
```

- [ ] **Step 5: Write benchmark scripts**

The six scripts in `benchmarks/napi-cpp/` are identical to those in `benchmarks/napi-c/` from Task 11, with two changes per file: replace `'../../addons/napi-c/build/Release/addon.node'` with `'../../addons/napi-cpp/build/Release/addon.node'`, and replace `'napi-c'` with `'napi-cpp'` in the `backend` field.

(Repeated in full for clarity.)

`benchmarks/napi-cpp/add-i32.js`:

```js
'use strict';
const addon = require('../../addons/napi-cpp/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-cpp', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => addon.add_i32(20, 22)
);
```

`benchmarks/napi-cpp/add-f64.js`:

```js
'use strict';
const addon = require('../../addons/napi-cpp/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-cpp', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => addon.add_f64(1.5, 2.5)
);
```

`benchmarks/napi-cpp/getpid.js`:

```js
'use strict';
const addon = require('../../addons/napi-cpp/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-cpp', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => addon.getpid()
);
```

`benchmarks/napi-cpp/many-args.js`:

```js
'use strict';
const addon = require('../../addons/napi-cpp/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-cpp', scenario: 'many-args', n: 1e7, expected: 21 },
  () => addon.sum_6_i32(1, 2, 3, 4, 5, 6)
);
```

`benchmarks/napi-cpp/pointer-bigint.js`:

```js
'use strict';
const addon = require('../../addons/napi-cpp/build/Release/addon.node');
const { bench } = require('../../lib/harness');

const buf = Buffer.alloc(8);
const expected = addon.pointer_to_usize(buf);

bench(
  { backend: 'napi-cpp', scenario: 'pointer-bigint', n: 1e7, expected },
  () => addon.pointer_to_usize(buf)
);
```

`benchmarks/napi-cpp/sum-buffer.js`:

```js
'use strict';
const addon = require('../../addons/napi-cpp/build/Release/addon.node');
const { bench } = require('../../lib/harness');

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const expected = BigInt(size) * 0x42n;

bench(
  { backend: 'napi-cpp', scenario: 'sum-buffer', n: 1e6, params: { size }, expected },
  () => addon.sum_buffer(buf)
);
```

- [ ] **Step 6: Run tests**

Run: `npm test -- --test-name-pattern='napi-cpp'`
Expected: 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add addons/napi-cpp/binding.gyp addons/napi-cpp/addon.cc benchmarks/napi-cpp/ tests/napi-cpp.test.js
git commit -m "Add napi-cpp (node-addon-api) addon and benchmark scripts"
```

---

## Task 13: addon-nan addon + benchmarks

**Files:**
- Create: `addons/addon-nan/binding.gyp`
- Create: `addons/addon-nan/addon.cc`
- Create: `benchmarks/addon-nan/{add-i32,add-f64,getpid,many-args,pointer-bigint,sum-buffer}.js`
- Create: `tests/addon-nan.test.js`

- [ ] **Step 1: Write the failing test**

`tests/addon-nan.test.js` — same shape as `tests/napi-c.test.js`, replace `napi-c` with `addon-nan` and the path with `addons/addon-nan/build/Release/addon.node`.

- [ ] **Step 2: Write `binding.gyp`**

```python
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "addon.cc" ],
      "include_dirs": [
        "<(module_root_dir)/../../lib/native",
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
```

- [ ] **Step 3: Write `addon.cc`**

```cpp
#include <nan.h>
#include <unistd.h>
extern "C" {
#include "scenarios.h"
}

using namespace Nan;
using namespace v8;

NAN_METHOD(AddI32) {
  int32_t a = info[0]->Int32Value(Nan::GetCurrentContext()).FromJust();
  int32_t b = info[1]->Int32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Int32>(add_i32_impl(a, b)));
}

NAN_METHOD(AddF64) {
  double a = info[0]->NumberValue(Nan::GetCurrentContext()).FromJust();
  double b = info[1]->NumberValue(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Number>(add_f64_impl(a, b)));
}

NAN_METHOD(Getpid) {
  info.GetReturnValue().Set(Nan::New<Int32>((int32_t)getpid()));
}

NAN_METHOD(Sum6I32) {
  int32_t v[6];
  for (int i = 0; i < 6; i++)
    v[i] = info[i]->Int32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Int32>(
    sum_6_i32_impl(v[0],v[1],v[2],v[3],v[4],v[5])));
}

NAN_METHOD(PointerToUsize) {
  Local<Object> bufObj = info[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
  uint64_t addr = pointer_to_usize_impl((const void*)node::Buffer::Data(bufObj));
  bool lossless;
  info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(info.GetIsolate(), addr));
  (void)lossless;
}

NAN_METHOD(SumBuffer) {
  Local<Object> bufObj = info[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
  uint64_t r = sum_buffer_impl(
    (const uint8_t*)node::Buffer::Data(bufObj),
    (uint64_t)node::Buffer::Length(bufObj));
  info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(info.GetIsolate(), r));
}

NAN_MODULE_INIT(Init) {
  Nan::Set(target, Nan::New("add_i32").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(AddI32)).ToLocalChecked());
  Nan::Set(target, Nan::New("add_f64").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(AddF64)).ToLocalChecked());
  Nan::Set(target, Nan::New("getpid").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(Getpid)).ToLocalChecked());
  Nan::Set(target, Nan::New("sum_6_i32").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(Sum6I32)).ToLocalChecked());
  Nan::Set(target, Nan::New("pointer_to_usize").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(PointerToUsize)).ToLocalChecked());
  Nan::Set(target, Nan::New("sum_buffer").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(SumBuffer)).ToLocalChecked());
}

NODE_MODULE(addon, Init)
```

- [ ] **Step 4: Build**

```bash
(cd addons/addon-nan && npx node-gyp rebuild)
```

- [ ] **Step 5: Write benchmark scripts**

Same six as napi-cpp, but:
- replace path `'../../addons/napi-cpp/build/Release/addon.node'` → `'../../addons/addon-nan/build/Release/addon.node'`
- replace `'napi-cpp'` → `'addon-nan'` in the `backend` field

`benchmarks/addon-nan/add-i32.js`:

```js
'use strict';
const addon = require('../../addons/addon-nan/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-nan', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => addon.add_i32(20, 22)
);
```

`benchmarks/addon-nan/add-f64.js`:

```js
'use strict';
const addon = require('../../addons/addon-nan/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-nan', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => addon.add_f64(1.5, 2.5)
);
```

`benchmarks/addon-nan/getpid.js`:

```js
'use strict';
const addon = require('../../addons/addon-nan/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-nan', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => addon.getpid()
);
```

`benchmarks/addon-nan/many-args.js`:

```js
'use strict';
const addon = require('../../addons/addon-nan/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-nan', scenario: 'many-args', n: 1e7, expected: 21 },
  () => addon.sum_6_i32(1, 2, 3, 4, 5, 6)
);
```

`benchmarks/addon-nan/pointer-bigint.js`:

```js
'use strict';
const addon = require('../../addons/addon-nan/build/Release/addon.node');
const { bench } = require('../../lib/harness');

const buf = Buffer.alloc(8);
const expected = addon.pointer_to_usize(buf);

bench(
  { backend: 'addon-nan', scenario: 'pointer-bigint', n: 1e7, expected },
  () => addon.pointer_to_usize(buf)
);
```

`benchmarks/addon-nan/sum-buffer.js`:

```js
'use strict';
const addon = require('../../addons/addon-nan/build/Release/addon.node');
const { bench } = require('../../lib/harness');

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const expected = BigInt(size) * 0x42n;

bench(
  { backend: 'addon-nan', scenario: 'sum-buffer', n: 1e6, params: { size }, expected },
  () => addon.sum_buffer(buf)
);
```

- [ ] **Step 6: Run tests**

Run: `npm test -- --test-name-pattern='addon-nan'`
Expected: 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add addons/addon-nan/ benchmarks/addon-nan/ tests/addon-nan.test.js
git commit -m "Add addon-nan addon and benchmark scripts"
```

---

## Task 14: addon-raw addon + benchmarks

**Files:**
- Create: `addons/addon-raw/binding.gyp`
- Create: `addons/addon-raw/addon.cc`
- Create: `benchmarks/addon-raw/{add-i32,add-f64,getpid,many-args,pointer-bigint,sum-buffer}.js`
- Create: `tests/addon-raw.test.js`

- [ ] **Step 1: Write the failing test**

`tests/addon-raw.test.js` — same shape as `tests/napi-c.test.js`, replace `napi-c` with `addon-raw`, addon path with `addons/addon-raw/build/Release/addon.node`.

- [ ] **Step 2: Write `binding.gyp`**

```python
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "addon.cc" ],
      "include_dirs": [ "<(module_root_dir)/../../lib/native" ]
    }
  ]
}
```

- [ ] **Step 3: Write `addon.cc`**

```cpp
#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include <unistd.h>
extern "C" {
#include "scenarios.h"
}

using v8::Context;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::Value;
using v8::String;
using v8::FunctionTemplate;
using v8::BigInt;
using v8::Int32;

static void AddI32(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int32_t a = args[0]->Int32Value(ctx).FromJust();
  int32_t b = args[1]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate, add_i32_impl(a, b)));
}

static void AddF64(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  double a = args[0]->NumberValue(ctx).FromJust();
  double b = args[1]->NumberValue(ctx).FromJust();
  args.GetReturnValue().Set(Number::New(isolate, add_f64_impl(a, b)));
}

static void Getpid(const FunctionCallbackInfo<Value>& args) {
  args.GetReturnValue().Set(Int32::New(args.GetIsolate(), (int32_t)getpid()));
}

static void Sum6I32(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int32_t v[6];
  for (int i = 0; i < 6; i++) v[i] = args[i]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate,
    sum_6_i32_impl(v[0], v[1], v[2], v[3], v[4], v[5])));
}

static void PointerToUsize(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Object> bufObj = args[0].As<Object>();
  uint64_t r = pointer_to_usize_impl((const void*)node::Buffer::Data(bufObj));
  args.GetReturnValue().Set(BigInt::NewFromUnsigned(isolate, r));
}

static void SumBuffer(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Object> bufObj = args[0].As<Object>();
  uint64_t r = sum_buffer_impl(
    (const uint8_t*)node::Buffer::Data(bufObj),
    (uint64_t)node::Buffer::Length(bufObj));
  args.GetReturnValue().Set(BigInt::NewFromUnsigned(isolate, r));
}

static void Init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "add_i32",         AddI32);
  NODE_SET_METHOD(exports, "add_f64",         AddF64);
  NODE_SET_METHOD(exports, "getpid",          Getpid);
  NODE_SET_METHOD(exports, "sum_6_i32",       Sum6I32);
  NODE_SET_METHOD(exports, "pointer_to_usize", PointerToUsize);
  NODE_SET_METHOD(exports, "sum_buffer",      SumBuffer);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)
```

- [ ] **Step 4: Build**

```bash
(cd addons/addon-raw && npx node-gyp rebuild)
```

- [ ] **Step 5: Write benchmark scripts**

Six files in `benchmarks/addon-raw/`. Identical to `benchmarks/addon-nan/*.js` from Task 13 with the path and backend ID substituted:

`benchmarks/addon-raw/add-i32.js`:

```js
'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-raw', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => addon.add_i32(20, 22)
);
```

`benchmarks/addon-raw/add-f64.js`:

```js
'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-raw', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => addon.add_f64(1.5, 2.5)
);
```

`benchmarks/addon-raw/getpid.js`:

```js
'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-raw', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => addon.getpid()
);
```

`benchmarks/addon-raw/many-args.js`:

```js
'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-raw', scenario: 'many-args', n: 1e7, expected: 21 },
  () => addon.sum_6_i32(1, 2, 3, 4, 5, 6)
);
```

`benchmarks/addon-raw/pointer-bigint.js`:

```js
'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

const buf = Buffer.alloc(8);
const expected = addon.pointer_to_usize(buf);

bench(
  { backend: 'addon-raw', scenario: 'pointer-bigint', n: 1e7, expected },
  () => addon.pointer_to_usize(buf)
);
```

`benchmarks/addon-raw/sum-buffer.js`:

```js
'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const expected = BigInt(size) * 0x42n;

bench(
  { backend: 'addon-raw', scenario: 'sum-buffer', n: 1e6, params: { size }, expected },
  () => addon.sum_buffer(buf)
);
```

- [ ] **Step 6: Run tests**

Run: `npm test -- --test-name-pattern='addon-raw'`
Expected: 6 tests pass.

- [ ] **Step 7: Commit**

```bash
git add addons/addon-raw/ benchmarks/addon-raw/ tests/addon-raw.test.js
git commit -m "Add addon-raw (raw V8) addon and benchmark scripts"
```

---

## Task 15: Orchestration scripts

**Files:**
- Create: `scripts/build-fixture.sh`
- Create: `scripts/build-addons.sh`
- Create: `scripts/run.sh`

- [ ] **Step 1: Write `scripts/build-fixture.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
make -C "$REPO_ROOT/lib/fixture"
```

- [ ] **Step 2: Write `scripts/build-addons.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
for d in napi-c napi-cpp addon-nan addon-raw; do
  echo "[build-addons] building $d ..."
  (cd "$REPO_ROOT/addons/$d" && npx node-gyp rebuild)
done
```

- [ ] **Step 3: Write `scripts/run.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$REPO_ROOT/lib/runner.js"
```

- [ ] **Step 4: Make all scripts executable**

```bash
chmod +x scripts/build-fixture.sh scripts/build-addons.sh scripts/run.sh
```

- [ ] **Step 5: Smoke run**

```bash
npm run setup:fixture   # already built earlier; should be a no-op
npm run setup:addons    # rebuilds the four addons
npm run bench           # runs the matrix
```

Expected: full table prints; `core-ffi-*` show `ERR` unless variants have been built (Task 9).

- [ ] **Step 6: Commit**

```bash
git add scripts/build-fixture.sh scripts/build-addons.sh scripts/run.sh
git commit -m "Add orchestration scripts (build-fixture, build-addons, run)"
```

---

## Task 16: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the README**

Replace `README.md` with:

````markdown
# node-native-calling-benchmarks

Compares operations-per-second across nine ways of calling native code from Node.js:

| Backend          | Mechanism                                      |
|------------------|------------------------------------------------|
| `core-ffi-main`  | `node:ffi` on `nodejs/node` `main`             |
| `core-ffi-63140` | `node:ffi` on PR #63140 (`bengl/ffi-fastcalls`)|
| `core-ffi-63068` | `node:ffi` on PR #63068 (`ShogunPanda:fast-ffi`)|
| `koffi`          | userland FFI (npm `koffi`)                     |
| `ffi-napi`       | userland FFI (npm `ffi-napi`)                  |
| `napi-c`         | N-API addon, C                                 |
| `napi-cpp`       | N-API addon, C++ via `node-addon-api`          |
| `addon-nan`      | non-N-API addon via NAN                        |
| `addon-raw`      | non-N-API addon, raw `<v8.h>`                  |

All backends call the same six scenarios from `nodejs/node:benchmark/ffi/`:
`add-i32`, `add-f64`, `getpid`, `many-args`, `pointer-bigint`, and
`sum-buffer` (with sizes 64/1024/16384). The C-level workload is defined
once in `lib/native/scenarios.h` and reused by the FFI fixture library and
by every native addon.

## Requirements

- Linux or macOS (no Windows support).
- Node.js ≥ 20 on PATH (for system-node backends).
- A C/C++ toolchain (`cc`/`clang`/`g++`, `make`).
- ~10 GB free disk + ~90 minutes for building the three Node.js variants
  from source.

## Quick start

```bash
git clone <this repo>
cd node-native-calling-benchmarks
npm install
npm run setup    # builds 3 Node.js variants + fixture library + 4 addons
npm run bench
```

`npm run bench` prints a console table and writes a full per-sample JSON
record to `results/<ISO-timestamp>.json`.

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
nor an env var are silently skipped (their column shows `-`/`ERR`).

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
automatically for backends whose addons are not yet built.

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
- `getpid` is the one minor asymmetry: FFI backends call `uv_os_getpid`
  from the host process's symbol table (matching what core's benchmark
  does); addon backends call `getpid()` from `<unistd.h>`. Both wrap the
  same syscall.

## Layout

```
lib/native/scenarios.h       # single source of truth for the workloads
lib/fixture/                 # FFI shared library wrapping scenarios.h
lib/harness.js               # ops/sec measurement (used by every script)
lib/runner.js                # spawns the matrix, aggregates, prints, writes JSON
benchmarks/<backend>/*.js    # per-backend scenario implementations
addons/<addon>/              # native addon sources + binding.gyp
scripts/                     # setup-nodes.sh, build-fixture.sh, build-addons.sh, run.sh
results/                     # gitignored; one JSON per `npm run bench`
vendor/                      # gitignored; populated by setup-nodes.sh
```

## License

MIT.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Add README"
```

---

## Final verification

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: every test passes (or skips with `skip: true` for backends whose addons aren't built in this checkout).

- [ ] **Step 2: Run the full benchmark matrix**

Run: `npm run bench`
Expected: a console table is printed; a JSON file is created in `results/`. `core-ffi-*` columns show `ERR` if you haven't run `setup-nodes.sh` or set the env-var overrides; everything else shows real numbers.

- [ ] **Step 3: Optionally, run `npm run setup:nodes`** (~90 min) to populate the three Node.js variants and re-run `npm run bench` for a full table.
