'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const { lib, functions } = ffi.dlopen(fixturePath, {
  sum_buffer: { result: 'u64', parameters: ['pointer', 'u64'] },
});
const sum_buffer = functions.sum_buffer;

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const ptr = ffi.getRawPointer(buf);
const len = BigInt(size);
const expected = BigInt(size) * 0x42n;

bench(
  {
    backend: 'core-ffi',
    scenario: 'sum-buffer',
    n: 1e6,
    params: { size },
    expected,
  },
  () => sum_buffer(ptr, len)
);
lib.close();
