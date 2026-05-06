'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const { lib, functions } = ffi.dlopen(fixturePath, {
  add_f64: { result: 'f64', parameters: ['f64', 'f64'] },
});
const add_f64 = functions.add_f64;

bench(
  { backend: 'core-ffi', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => add_f64(1.5, 2.5)
);
lib.close();
