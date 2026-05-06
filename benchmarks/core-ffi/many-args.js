'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const { lib, functions } = ffi.dlopen(fixturePath, {
  sum_6_i32: { result: 'i32', parameters: ['i32', 'i32', 'i32', 'i32', 'i32', 'i32'] },
});
const sum_6_i32 = functions.sum_6_i32;

bench(
  { backend: 'core-ffi', scenario: 'many-args', n: 1e7, expected: 21 },
  () => sum_6_i32(1, 2, 3, 4, 5, 6)
);
lib.close();
