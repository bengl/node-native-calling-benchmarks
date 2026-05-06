'use strict';
const addon = require('../../addons/addon-nan/build/Release/addon.node');
const { bench } = require('../../lib/harness');

const buf = Buffer.alloc(8);
const expected = addon.pointer_to_usize(buf);

bench(
  { backend: 'addon-nan', scenario: 'pointer-bigint', n: 1e7, expected },
  () => addon.pointer_to_usize(buf)
);
