'use strict';
const addon = require('../../addons/napi-cpp/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-cpp', scenario: 'many-args', n: 1e7, expected: 21 },
  () => addon.sum_6_i32(1, 2, 3, 4, 5, 6)
);
