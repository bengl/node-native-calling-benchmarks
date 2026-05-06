'use strict';
const addon = require('../../addons/napi-cpp/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-cpp', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => addon.add_i32(20, 22)
);
