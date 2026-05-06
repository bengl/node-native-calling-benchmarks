'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');
const { fixturePath } = require('../../lib/fixture-path');

const lib = koffi.load(fixturePath);
const pointer_to_usize = lib.func('uint64_t pointer_to_usize(const void *)');

const buf = Buffer.alloc(8);
const expected = BigInt(koffi.address(buf));

bench(
  { backend: 'koffi', scenario: 'pointer-bigint', n: 1e7, expected },
  () => pointer_to_usize(buf)
);
