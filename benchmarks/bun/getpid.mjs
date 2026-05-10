import { dlopen, FFIType } from 'bun:ffi';
import { bench, libcPath } from './_common.mjs';

const { symbols, close } = dlopen(libcPath, { getpid: { args: [], returns: FFIType.i32 } });
try {
  bench({ backend: 'bun', scenario: 'getpid', n: 1e7, expected: process.pid }, () => symbols.getpid());
} finally {
  close();
}
