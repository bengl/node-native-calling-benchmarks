import { dlopen, FFIType } from 'bun:ffi';
import { bench, fixturePath } from './_common.mjs';

const { symbols, close } = dlopen(fixturePath, { add_f64: { args: [FFIType.f64, FFIType.f64], returns: FFIType.f64 } });
try {
  bench({ backend: 'bun', scenario: 'add-f64', n: 1e7, expected: 4.0 }, () => symbols.add_f64(1.5, 2.5));
} finally {
  close();
}
