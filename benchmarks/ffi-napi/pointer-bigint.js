'use strict';

const ffi = require('ffi-napi');
const ref = require('ref-napi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = ffi.Library(fixturePath, {
  pointer_to_usize: ['uint64', ['pointer']],
});

const buf = Buffer.alloc(8);
const expected = BigInt(ref.address(buf));

bench(
  { backend: 'ffi-napi', scenario: 'pointer-bigint', n: 1e7, expected },
  () => BigInt(lib.pointer_to_usize(buf))
);
