import { bench, dlopenFixture } from './_common.mjs';

const lib = dlopenFixture({ sum_buffer: { parameters: ['pointer', 'u64'], result: 'u64' } });
const size = Number(Deno.env.get('NCB_SIZE') || 1024);
const buf = new Uint8Array(size).fill(0x42);
const ptr = Deno.UnsafePointer.of(buf);
const len = BigInt(size);
try {
  bench({ backend: 'deno', scenario: 'sum-buffer', n: 1e6, params: { size }, expected: BigInt(size) * 0x42n }, () => lib.symbols.sum_buffer(ptr, len));
} finally {
  lib.close();
}
