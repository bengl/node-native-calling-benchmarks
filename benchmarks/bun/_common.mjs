import { suffix } from 'bun:ffi';

const repoRoot = new URL('../../', import.meta.url);

export const fixturePath = new URL(`lib/fixture/build/ffi_test_library.${suffix}`, repoRoot).pathname;
export const libcPath = process.platform === 'darwin' ? 'libc.dylib' : 'libc.so.6';

export function bench(opts, fn) {
  const n = process.env.NCB_N ? Number(process.env.NCB_N) : opts.n;
  const observed = fn();
  if (!valuesEqual(observed, opts.expected)) {
    throw new Error(
      `Sanity check failed for ${opts.backend}/${opts.scenario}: ` +
      `expected ${String(opts.expected)}, got ${String(observed)}`
    );
  }

  const warmupNs = 200_000_000n;
  const warmupStart = nowNs();
  while (nowNs() - warmupStart < warmupNs) fn();

  const start = nowNs();
  for (let i = 0; i < n; i++) fn();
  const end = nowNs();

  const durationNs = end - start;
  console.log(JSON.stringify({
    backend: opts.backend,
    scenario: opts.scenario,
    params: opts.params ?? null,
    n,
    durationNs: durationNs.toString(),
    opsPerSec: n / (Number(durationNs) / 1e9),
  }));
}

function nowNs() {
  return BigInt(Math.floor(performance.now() * 1e6));
}

function valuesEqual(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b)) return true;
  if (isIntegral(a) && isIntegral(b)) return BigInt(a) === BigInt(b);
  return false;
}

function isIntegral(v) {
  return typeof v === 'bigint' ||
    (typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v));
}
