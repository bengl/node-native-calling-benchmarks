import { bench, dlopenFixture } from './_common.mjs';

const lib = dlopenFixture({ pointer_to_usize: { parameters: ['pointer'], result: 'u64' } });
const buf = new Uint8Array(8);
const ptr = Deno.UnsafePointer.of(buf);
try {
  bench({ backend: 'deno', scenario: 'pointer-bigint', n: 1e7, expected: lib.symbols.pointer_to_usize(ptr) }, () => lib.symbols.pointer_to_usize(ptr));
} finally {
  lib.close();
}
