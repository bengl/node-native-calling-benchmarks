'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const { lib, functions } = ffi.dlopen(fixturePath, {
  add_i32: { result: 'i32', parameters: ['i32', 'i32'] },
});
const add_i32 = functions.add_i32;

bench(
  { backend: 'core-ffi', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => add_i32(20, 22)
);
lib.close();
