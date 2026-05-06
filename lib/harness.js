'use strict';

const { hrtime } = require('node:process');

function valuesEqual(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number' &&
      Number.isNaN(a) && Number.isNaN(b)) return true;
  // Allow Number ↔ BigInt comparison for integral values. Several FFI
  // backends return u64 as Number when small, BigInt when large; we want
  // the sanity check to be type-agnostic.
  const isIntegral = (v) =>
    typeof v === 'bigint' ||
    (typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v));
  if (isIntegral(a) && isIntegral(b)) return BigInt(a) === BigInt(b);
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
