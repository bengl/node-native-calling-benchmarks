'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

const size = Number(process.env.NCB_SIZE || 1024);
const buf = Buffer.alloc(size, 0x42);
const expected = BigInt(size) * 0x42n;

bench(
  { backend: 'addon-raw', scenario: 'sum-buffer', n: 1e6, params: { size }, expected },
  () => addon.sum_buffer(buf)
);
