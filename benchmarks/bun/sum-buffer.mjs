import { dlopen, FFIType, ptr } from 'bun:ffi';
import { bench, fixturePath } from './_common.mjs';

const { symbols, close } = dlopen(fixturePath, { sum_buffer: { args: [FFIType.ptr, FFIType.u64], returns: FFIType.u64 } });
const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const pointer = ptr(buf);
try {
  bench({ backend: 'bun', scenario: 'sum-buffer', n: 1e6, params: { size }, expected: BigInt(size) * 0x42n }, () => symbols.sum_buffer(pointer, BigInt(size)));
} finally {
  close();
}
