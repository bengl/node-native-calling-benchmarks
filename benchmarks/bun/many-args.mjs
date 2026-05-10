import { dlopen, FFIType } from 'bun:ffi';
import { bench, fixturePath } from './_common.mjs';

const { symbols, close } = dlopen(fixturePath, {
  sum_6_i32: { args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32 },
});
try {
  bench({ backend: 'bun', scenario: 'many-args', n: 1e7, expected: 21 }, () => symbols.sum_6_i32(1, 2, 3, 4, 5, 6));
} finally {
  close();
}
