import { dlopen, FFIType, ptr } from 'bun:ffi';
import { bench, fixturePath } from './_common.mjs';

const { symbols, close } = dlopen(fixturePath, { pointer_to_usize: { args: [FFIType.ptr], returns: FFIType.u64 } });
const buf = Buffer.alloc(8);
const pointer = ptr(buf);
try {
  bench({ backend: 'bun', scenario: 'pointer-bigint', n: 1e7, expected: symbols.pointer_to_usize(pointer) }, () => symbols.pointer_to_usize(pointer));
} finally {
  close();
}
