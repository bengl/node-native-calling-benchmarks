'use strict';

const ffi = require('node:ffi');
const { bench } = require('../../lib/harness');

const { lib, functions } = ffi.dlopen(null, {
  uv_os_getpid: { result: 'i32', parameters: [] },
});
const getpid = functions.uv_os_getpid;

bench(
  { backend: 'core-ffi', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => getpid()
);
lib.close();
