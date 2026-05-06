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
