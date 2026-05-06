'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = koffi.load(fixturePath);
const add_i32 = lib.func('int32_t add_i32(int32_t, int32_t)');

bench(
  { backend: 'koffi', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => add_i32(20, 22)
);
