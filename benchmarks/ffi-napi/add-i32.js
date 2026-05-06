'use strict';

const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = ffi.Library(fixturePath, {
  add_i32: ['int32', ['int32', 'int32']],
});

bench(
  { backend: 'ffi-napi', scenario: 'add-i32', n: 1e7, expected: 42 },
  () => lib.add_i32(20, 22)
);
