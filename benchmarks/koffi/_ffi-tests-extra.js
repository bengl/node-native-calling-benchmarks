'use strict';

const path = require('node:path');
const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const scenario = process.env.NCB_SCENARIO || path.basename(process.argv[1], '.js');

const cases = {
  'noop-void': { decl: 'void noop_void(void)', expected: undefined, args: [] },
  'identity-i32': { decl: 'int32_t identity_i32(int32_t)', expected: 42, args: [42] },
  'add-i8': { decl: 'int8_t add_i8(int8_t, int8_t)', expected: 42, args: [20, 22] },
  'add-u8': { decl: 'uint8_t add_u8(uint8_t, uint8_t)', expected: 42, args: [20, 22] },
  'add-i16': { decl: 'int16_t add_i16(int16_t, int16_t)', expected: 42, args: [20, 22] },
  'add-u16': { decl: 'uint16_t add_u16(uint16_t, uint16_t)', expected: 42, args: [20, 22] },
  'add-i64': { decl: 'int64_t add_i64(int64_t, int64_t)', expected: 42n, args: [20n, 22n] },
  'add-u64': { decl: 'uint64_t add_u64(uint64_t, uint64_t)', expected: 42n, args: [20n, 22n] },
  'add-f32': { decl: 'float add_f32(float, float)', expected: 42, args: [20.5, 21.5] },
  'sum-3-i32': { decl: 'int32_t sum_3_i32(int32_t, int32_t, int32_t)', expected: 42, args: [10, 11, 21] },
  'sum-5-i32': { decl: 'int32_t sum_5_i32(int32_t, int32_t, int32_t, int32_t, int32_t)', expected: 42, args: [2, 4, 8, 12, 16] },
  'sum-8-i32': { decl: 'int32_t sum_8_i32(int32_t, int32_t, int32_t, int32_t, int32_t, int32_t, int32_t, int32_t)', expected: 42, args: [1, 2, 3, 4, 5, 6, 7, 14] },
  'string-length': { decl: 'uint64_t string_length(const char *)', expected: 5n, args: ['hello'] },
  'string-first-char': { decl: 'uint8_t string_first_char(const char *)', expected: 104, args: ['hello'] },
  'string-equals-hello': { decl: 'uint8_t string_equals_hello(const char *)', expected: 1, args: ['hello'] },
};

const testCase = cases[scenario];
if (!testCase) throw new Error(`Unknown scenario: ${scenario}`);

const lib = koffi.load(fixturePath);
const fn = lib.func(testCase.decl);

bench(
  { backend: 'koffi', scenario, n: 1e7, expected: testCase.expected },
  () => fn(...testCase.args)
);
