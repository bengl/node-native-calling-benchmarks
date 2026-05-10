import { bench, dlopenFixture } from './_common.mjs';

const scenario = Deno.env.get('NCB_SCENARIO') || new URL(import.meta.url).pathname.split('/').pop().replace(/\.mjs$/, '');
const encodedString = new TextEncoder().encode('hello\0');
const encodedStringPointer = Deno.UnsafePointer.of(encodedString);

const cases = {
  'noop-void': { symbol: 'noop_void', parameters: [], result: 'void', expected: undefined, call: (fn) => fn() },
  'identity-i32': { symbol: 'identity_i32', parameters: ['i32'], result: 'i32', expected: 42, call: (fn) => fn(42) },
  'add-i8': { symbol: 'add_i8', parameters: ['i8', 'i8'], result: 'i8', expected: 42, call: (fn) => fn(20, 22) },
  'add-u8': { symbol: 'add_u8', parameters: ['u8', 'u8'], result: 'u8', expected: 42, call: (fn) => fn(20, 22) },
  'add-i16': { symbol: 'add_i16', parameters: ['i16', 'i16'], result: 'i16', expected: 42, call: (fn) => fn(20, 22) },
  'add-u16': { symbol: 'add_u16', parameters: ['u16', 'u16'], result: 'u16', expected: 42, call: (fn) => fn(20, 22) },
  'add-i64': { symbol: 'add_i64', parameters: ['i64', 'i64'], result: 'i64', expected: 42n, call: (fn) => fn(20n, 22n) },
  'add-u64': { symbol: 'add_u64', parameters: ['u64', 'u64'], result: 'u64', expected: 42n, call: (fn) => fn(20n, 22n) },
  'add-f32': { symbol: 'add_f32', parameters: ['f32', 'f32'], result: 'f32', expected: 42, call: (fn) => fn(20.5, 21.5) },
  'sum-3-i32': { symbol: 'sum_3_i32', parameters: ['i32', 'i32', 'i32'], result: 'i32', expected: 42, call: (fn) => fn(10, 11, 21) },
  'sum-5-i32': { symbol: 'sum_5_i32', parameters: ['i32', 'i32', 'i32', 'i32', 'i32'], result: 'i32', expected: 42, call: (fn) => fn(2, 4, 8, 12, 16) },
  'sum-8-i32': { symbol: 'sum_8_i32', parameters: ['i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32'], result: 'i32', expected: 42, call: (fn) => fn(1, 2, 3, 4, 5, 6, 7, 14) },
  'string-length': { symbol: 'string_length', parameters: ['pointer'], result: 'u64', expected: 5n, call: (fn) => fn(encodedStringPointer) },
  'string-first-char': { symbol: 'string_first_char', parameters: ['pointer'], result: 'u8', expected: 104, call: (fn) => fn(encodedStringPointer) },
  'string-equals-hello': { symbol: 'string_equals_hello', parameters: ['pointer'], result: 'u8', expected: 1, call: (fn) => fn(encodedStringPointer) },
};

const testCase = cases[scenario];
if (!testCase) throw new Error(`Unknown scenario: ${scenario}`);

const lib = dlopenFixture({ [testCase.symbol]: { parameters: testCase.parameters, result: testCase.result } });
try {
  bench({ backend: 'deno', scenario, n: 1e7, expected: testCase.expected }, () => testCase.call(lib.symbols[testCase.symbol]));
} finally {
  lib.close();
}
