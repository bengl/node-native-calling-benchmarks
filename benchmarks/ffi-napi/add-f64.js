'use strict';

const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = ffi.Library(fixturePath, {
  add_f64: ['double', ['double', 'double']],
});

bench(
  { backend: 'ffi-napi', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => lib.add_f64(1.5, 2.5)
);
