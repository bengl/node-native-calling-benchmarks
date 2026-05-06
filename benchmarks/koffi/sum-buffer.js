'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = koffi.load(fixturePath);
const sum_buffer = lib.func('uint64_t sum_buffer(const uint8_t *, uint64_t)');

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const expected = BigInt(size) * 0x42n;

bench(
  {
    backend: 'koffi',
    scenario: 'sum-buffer',
    n: 1e6,
    params: { size },
    expected,
  },
  () => sum_buffer(buf, size)
);
