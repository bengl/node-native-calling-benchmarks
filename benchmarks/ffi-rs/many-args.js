'use strict';

const { bench } = require('../../lib/harness');
const { DataType, withFixture } = require('./_common');

withFixture({
  sum_6_i32: {
    retType: DataType.I32,
    paramsType: [DataType.I32, DataType.I32, DataType.I32, DataType.I32, DataType.I32, DataType.I32],
  },
}, ({ sum_6_i32 }) => {
  bench(
    { backend: 'ffi-rs', scenario: 'many-args', n: 1e7, expected: 21 },
    () => sum_6_i32([1, 2, 3, 4, 5, 6])
  );
});
