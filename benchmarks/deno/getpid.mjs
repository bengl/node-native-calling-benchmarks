import { bench, libcPath } from './_common.mjs';

const lib = Deno.dlopen(libcPath, { getpid: { parameters: [], result: 'i32' } });
try {
  bench({ backend: 'deno', scenario: 'getpid', n: 1e7, expected: Deno.pid }, () => lib.symbols.getpid());
} finally {
  lib.close();
}
