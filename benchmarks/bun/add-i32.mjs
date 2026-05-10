import { dlopen, FFIType } from 'bun:ffi';
import { bench, fixturePath } from './_common.mjs';

const { symbols, close } = dlopen(fixturePath, { add_i32: { args: [FFIType.i32, FFIType.i32], returns: FFIType.i32 } });
try {
  bench({ backend: 'bun', scenario: 'add-i32', n: 1e7, expected: 42 }, () => symbols.add_i32(20, 22));
} finally {
  close();
}
