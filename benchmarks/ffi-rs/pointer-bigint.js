'use strict';

const { bench } = require('../../lib/harness');
const { DataType, withFixture } = require('./_common');

withFixture({
  pointer_to_usize: { retType: DataType.U64, paramsType: [DataType.U8Array] },
}, ({ pointer_to_usize }) => {
  const buf = Buffer.alloc(8);
  const expected = pointer_to_usize([buf]);
  bench(
    { backend: 'ffi-rs', scenario: 'pointer-bigint', n: 1e7, expected },
    () => pointer_to_usize([buf])
  );
});
