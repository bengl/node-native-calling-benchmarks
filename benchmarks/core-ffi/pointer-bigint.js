'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const { lib, functions } = ffi.dlopen(fixturePath, {
  pointer_to_usize: { result: 'u64', parameters: ['pointer'] },
});
const fn = functions.pointer_to_usize;

const buf = Buffer.alloc(8);
const ptr = ffi.getRawPointer(buf);

bench(
  { backend: 'core-ffi', scenario: 'pointer-bigint', n: 1e7, expected: ptr },
  () => fn(ptr)
);
lib.close();
