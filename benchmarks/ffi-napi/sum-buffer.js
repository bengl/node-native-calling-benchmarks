'use strict';

const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = ffi.Library(fixturePath, {
  sum_buffer: ['uint64', ['pointer', 'uint64']],
});

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const expected = BigInt(size) * 0x42n;

bench(
  {
    backend: 'ffi-napi',
    scenario: 'sum-buffer',
    n: 1e6,
    params: { size },
    expected,
  },
  () => BigInt(lib.sum_buffer(buf, size))
);
