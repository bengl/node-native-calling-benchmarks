'use strict';

const { bench } = require('../../lib/harness');
const { DataType, withFixture } = require('./_common');

withFixture({
  sum_buffer: { retType: DataType.U64, paramsType: [DataType.U8Array, DataType.U64] },
}, ({ sum_buffer }) => {
  const size = Number(process.env.NCB_SIZE || 1024);
  const buf = Buffer.alloc(size, 0x42);
  const expected = BigInt(size) * 0x42n;
  bench(
    {
      backend: 'ffi-rs',
      scenario: 'sum-buffer',
      n: 1e6,
      params: { size },
      expected,
    },
    () => sum_buffer([buf, size])
  );
});
