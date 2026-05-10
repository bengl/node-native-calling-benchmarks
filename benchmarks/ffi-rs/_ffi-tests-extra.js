'use strict';

const path = require('node:path');
const { bench } = require('../../lib/harness');
const { DataType, withFixture } = require('./_common');

const scenario = process.env.NCB_SCENARIO || path.basename(process.argv[1], '.js');
const i32x8 = [DataType.I32, DataType.I32, DataType.I32, DataType.I32, DataType.I32, DataType.I32, DataType.I32, DataType.I32];

const cases = {
  'noop-void': { symbol: 'noop_void', retType: DataType.Void, paramsType: [], expected: undefined, args: [] },
  'identity-i32': { symbol: 'identity_i32', retType: DataType.I32, paramsType: [DataType.I32], expected: 42, args: [42] },
  'add-u8': { symbol: 'add_u8', retType: DataType.U8, paramsType: [DataType.U8, DataType.U8], expected: 42, args: [20, 22] },
  'add-i16': { symbol: 'add_i16', retType: DataType.I16, paramsType: [DataType.I16, DataType.I16], expected: 42, args: [20, 22] },
  'add-i32': { symbol: 'add_i32', retType: DataType.I32, paramsType: [DataType.I32, DataType.I32], expected: 42, args: [20, 22] },
  'add-i64': { symbol: 'add_i64', retType: DataType.BigInt, paramsType: [DataType.BigInt, DataType.BigInt], expected: 42n, args: [20n, 22n] },
  'add-u64': { symbol: 'add_u64', retType: DataType.U64, paramsType: [DataType.U64, DataType.U64], expected: 42n, args: [20, 22] },
  'add-f64': { symbol: 'add_f64', retType: DataType.Double, paramsType: [DataType.Double, DataType.Double], expected: 42, args: [20.5, 21.5] },
  'sum-3-i32': { symbol: 'sum_3_i32', retType: DataType.I32, paramsType: [DataType.I32, DataType.I32, DataType.I32], expected: 42, args: [10, 11, 21] },
  'sum-5-i32': { symbol: 'sum_5_i32', retType: DataType.I32, paramsType: [DataType.I32, DataType.I32, DataType.I32, DataType.I32, DataType.I32], expected: 42, args: [2, 4, 8, 12, 16] },
  'sum-8-i32': { symbol: 'sum_8_i32', retType: DataType.I32, paramsType: i32x8, expected: 42, args: [1, 2, 3, 4, 5, 6, 7, 14] },
  'string-length': { symbol: 'string_length', retType: DataType.U64, paramsType: [DataType.String], expected: 5n, args: ['hello'] },
  'string-first-char': { symbol: 'string_first_char', retType: DataType.U8, paramsType: [DataType.String], expected: 104, args: ['hello'] },
  'string-equals-hello': { symbol: 'string_equals_hello', retType: DataType.U8, paramsType: [DataType.String], expected: 1, args: ['hello'] },
};

const testCase = cases[scenario];
if (!testCase) throw new Error(`Unsupported ffi-rs scenario: ${scenario}`);

withFixture({
  [testCase.symbol]: { retType: testCase.retType, paramsType: testCase.paramsType },
}, (functions) => {
  const fn = functions[testCase.symbol];
  bench(
    { backend: 'ffi-rs', scenario, n: 1e7, expected: testCase.expected },
    () => fn(testCase.args)
  );
});
