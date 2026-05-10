'use strict';

const path = require('node:path');
const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const scenario = process.env.NCB_SCENARIO || path.basename(process.argv[1], '.js');

const cases = {
  'noop-void': { symbol: 'noop_void', signature: ['void', []], expected: undefined, args: [] },
  'identity-i32': { symbol: 'identity_i32', signature: ['int32', ['int32']], expected: 42, args: [42] },
  'add-i8': { symbol: 'add_i8', signature: ['int8', ['int8', 'int8']], expected: 42, args: [20, 22] },
  'add-u8': { symbol: 'add_u8', signature: ['uint8', ['uint8', 'uint8']], expected: 42, args: [20, 22] },
  'add-i16': { symbol: 'add_i16', signature: ['int16', ['int16', 'int16']], expected: 42, args: [20, 22] },
  'add-u16': { symbol: 'add_u16', signature: ['uint16', ['uint16', 'uint16']], expected: 42, args: [20, 22] },
  'add-i64': { symbol: 'add_i64', signature: ['int64', ['int64', 'int64']], expected: 42n, args: [20, 22], coerce: BigInt },
  'add-u64': { symbol: 'add_u64', signature: ['uint64', ['uint64', 'uint64']], expected: 42n, args: [20, 22], coerce: BigInt },
  'add-f32': { symbol: 'add_f32', signature: ['float', ['float', 'float']], expected: 42, args: [20.5, 21.5] },
  'sum-3-i32': { symbol: 'sum_3_i32', signature: ['int32', ['int32', 'int32', 'int32']], expected: 42, args: [10, 11, 21] },
  'sum-5-i32': { symbol: 'sum_5_i32', signature: ['int32', ['int32', 'int32', 'int32', 'int32', 'int32']], expected: 42, args: [2, 4, 8, 12, 16] },
  'sum-8-i32': { symbol: 'sum_8_i32', signature: ['int32', ['int32', 'int32', 'int32', 'int32', 'int32', 'int32', 'int32', 'int32']], expected: 42, args: [1, 2, 3, 4, 5, 6, 7, 14] },
  'string-length': { symbol: 'string_length', signature: ['uint64', ['string']], expected: 5n, args: ['hello'], coerce: BigInt },
  'string-first-char': { symbol: 'string_first_char', signature: ['uint8', ['string']], expected: 104, args: ['hello'] },
  'string-equals-hello': { symbol: 'string_equals_hello', signature: ['uint8', ['string']], expected: 1, args: ['hello'] },
};

const testCase = cases[scenario];
if (!testCase) throw new Error(`Unknown scenario: ${scenario}`);

const lib = ffi.Library(fixturePath, { [testCase.symbol]: testCase.signature });
const call = () => lib[testCase.symbol](...testCase.args);

bench(
  { backend: 'ffi-napi', scenario, n: 1e7, expected: testCase.expected },
  testCase.coerce ? () => testCase.coerce(call()) : call
);
