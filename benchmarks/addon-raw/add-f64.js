'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-raw', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => addon.add_f64(1.5, 2.5)
);
