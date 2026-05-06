'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = koffi.load(fixturePath);
const add_f64 = lib.func('double add_f64(double, double)');

bench(
  { backend: 'koffi', scenario: 'add-f64', n: 1e7, expected: 4.0 },
  () => add_f64(1.5, 2.5)
);
