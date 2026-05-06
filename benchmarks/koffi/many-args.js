'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = koffi.load(fixturePath);
const sum_6_i32 = lib.func(
  'int32_t sum_6_i32(int32_t, int32_t, int32_t, int32_t, int32_t, int32_t)'
);

bench(
  { backend: 'koffi', scenario: 'many-args', n: 1e7, expected: 21 },
  () => sum_6_i32(1, 2, 3, 4, 5, 6)
);
