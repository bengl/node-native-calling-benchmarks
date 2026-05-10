'use strict';

const { bench } = require('../../lib/harness');
const { DataType, withFixture } = require('./_common');

withFixture({
  add_i32: { retType: DataType.I32, paramsType: [DataType.I32, DataType.I32] },
}, ({ add_i32 }) => {
  bench(
    { backend: 'ffi-rs', scenario: 'add-i32', n: 1e7, expected: 42 },
    () => add_i32([20, 22])
  );
});
