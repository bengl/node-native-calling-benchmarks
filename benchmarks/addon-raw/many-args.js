'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-raw', scenario: 'many-args', n: 1e7, expected: 21 },
  () => addon.sum_6_i32(1, 2, 3, 4, 5, 6)
);
