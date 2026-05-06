'use strict';
const addon = require('../../addons/addon-nan/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-nan', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => addon.add_i32(20, 22)
);
