'use strict';

const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = ffi.Library(fixturePath, {
  sum_6_i32: ['int32', ['int32', 'int32', 'int32', 'int32', 'int32', 'int32']],
});

bench(
  { backend: 'ffi-napi', scenario: 'many-args', n: 1e7, expected: 21 },
  () => lib.sum_6_i32(1, 2, 3, 4, 5, 6)
);
