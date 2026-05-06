'use strict';
const addon = require('../../addons/napi-c/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-c', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => addon.add_i32(20, 22)
);
