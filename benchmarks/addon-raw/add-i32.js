'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-raw', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => addon.add_i32(20, 22)
);
