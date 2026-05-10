'use strict';

const path = require('node:path');
const { bench } = require('../lib/harness');

module.exports = function runAddonExtra(backend, addon) {
  const scenario = process.env.NCB_SCENARIO || path.basename(process.argv[1], '.js');
  const cases = {
    'noop-void': { method: 'noop_void', expected: undefined, args: [] },
    'identity-i32': { method: 'identity_i32', expected: 42, args: [42] },
    'add-i8': { method: 'add_i8', expected: 42, args: [20, 22] },
    'add-u8': { method: 'add_u8', expected: 42, args: [20, 22] },
    'add-i16': { method: 'add_i16', expected: 42, args: [20, 22] },
    'add-u16': { method: 'add_u16', expected: 42, args: [20, 22] },
    'add-i64': { method: 'add_i64', expected: 42n, args: [20n, 22n] },
    'add-u64': { method: 'add_u64', expected: 42n, args: [20n, 22n] },
    'add-f32': { method: 'add_f32', expected: 42, args: [20.5, 21.5] },
    'sum-3-i32': { method: 'sum_3_i32', expected: 42, args: [10, 11, 21] },
    'sum-5-i32': { method: 'sum_5_i32', expected: 42, args: [2, 4, 8, 12, 16] },
    'sum-8-i32': { method: 'sum_8_i32', expected: 42, args: [1, 2, 3, 4, 5, 6, 7, 14] },
    'string-length': { method: 'string_length', expected: 5n, args: ['hello'] },
    'string-first-char': { method: 'string_first_char', expected: 104, args: ['hello'] },
    'string-equals-hello': { method: 'string_equals_hello', expected: 1, args: ['hello'] },
  };
  const testCase = cases[scenario];
  if (!testCase) throw new Error(`Unknown scenario: ${scenario}`);

  bench(
    { backend, scenario, n: 1e7, expected: testCase.expected },
    () => addon[testCase.method](...testCase.args)
  );
};
