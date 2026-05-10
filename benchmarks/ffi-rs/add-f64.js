'use strict';

const { bench } = require('../../lib/harness');
const { DataType, withFixture } = require('./_common');

withFixture({
  add_f64: { retType: DataType.Double, paramsType: [DataType.Double, DataType.Double] },
}, ({ add_f64 }) => {
  bench(
    { backend: 'ffi-rs', scenario: 'add-f64', n: 1e7, expected: 4.0 },
    () => add_f64([1.5, 2.5])
  );
});
