'use strict';

const ffi = require('ffi-napi');
const { bench } = require('../../lib/harness');

const libcPath = process.platform === 'darwin' ? 'libc.dylib' : 'libc.so.6';
const libc = ffi.Library(libcPath, {
  getpid: ['int32', []],
});

bench(
  { backend: 'ffi-napi', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => libc.getpid()
);
