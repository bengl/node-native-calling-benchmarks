import { dlopen, FFIType, ptr } from 'bun:ffi';
import { bench, fixturePath } from './_common.mjs';

const scenario = process.env.NCB_SCENARIO || process.argv[1].split('/').pop().replace(/\.mjs$/, '');
const encodedString = Buffer.from('hello\0');
const encodedStringPointer = ptr(encodedString);

const cases = {
  'noop-void': { symbol: 'noop_void', args: [], returns: FFIType.void, expected: undefined, call: (fn) => fn() },
  'identity-i32': { symbol: 'identity_i32', args: [FFIType.i32], returns: FFIType.i32, expected: 42, call: (fn) => fn(42) },
  'add-i8': { symbol: 'add_i8', args: [FFIType.i8, FFIType.i8], returns: FFIType.i8, expected: 42, call: (fn) => fn(20, 22) },
  'add-u8': { symbol: 'add_u8', args: [FFIType.u8, FFIType.u8], returns: FFIType.u8, expected: 42, call: (fn) => fn(20, 22) },
  'add-i16': { symbol: 'add_i16', args: [FFIType.i16, FFIType.i16], returns: FFIType.i16, expected: 42, call: (fn) => fn(20, 22) },
  'add-u16': { symbol: 'add_u16', args: [FFIType.u16, FFIType.u16], returns: FFIType.u16, expected: 42, call: (fn) => fn(20, 22) },
  'add-i64': { symbol: 'add_i64', args: [FFIType.i64, FFIType.i64], returns: FFIType.i64, expected: 42n, call: (fn) => fn(20n, 22n) },
  'add-u64': { symbol: 'add_u64', args: [FFIType.u64, FFIType.u64], returns: FFIType.u64, expected: 42n, call: (fn) => fn(20n, 22n) },
  'add-f32': { symbol: 'add_f32', args: [FFIType.f32, FFIType.f32], returns: FFIType.f32, expected: 42, call: (fn) => fn(20.5, 21.5) },
  'sum-3-i32': { symbol: 'sum_3_i32', args: [FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32, expected: 42, call: (fn) => fn(10, 11, 21) },
  'sum-5-i32': { symbol: 'sum_5_i32', args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32, expected: 42, call: (fn) => fn(2, 4, 8, 12, 16) },
  'sum-8-i32': { symbol: 'sum_8_i32', args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32], returns: FFIType.i32, expected: 42, call: (fn) => fn(1, 2, 3, 4, 5, 6, 7, 14) },
  'string-length': { symbol: 'string_length', args: [FFIType.ptr], returns: FFIType.u64, expected: 5n, call: (fn) => fn(encodedStringPointer) },
  'string-first-char': { symbol: 'string_first_char', args: [FFIType.ptr], returns: FFIType.u8, expected: 104, call: (fn) => fn(encodedStringPointer) },
  'string-equals-hello': { symbol: 'string_equals_hello', args: [FFIType.ptr], returns: FFIType.u8, expected: 1, call: (fn) => fn(encodedStringPointer) },
};

const testCase = cases[scenario];
if (!testCase) throw new Error(`Unknown scenario: ${scenario}`);

const { symbols, close } = dlopen(fixturePath, {
  [testCase.symbol]: { args: testCase.args, returns: testCase.returns },
});
try {
  bench({ backend: 'bun', scenario, n: 1e7, expected: testCase.expected }, () => testCase.call(symbols[testCase.symbol]));
} finally {
  close();
}
