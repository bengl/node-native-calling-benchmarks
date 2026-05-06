'use strict';

const koffi = require('koffi');
const { bench } = require('../../lib/harness');

const libcPath = process.platform === 'darwin' ? 'libc.dylib' : 'libc.so.6';
const libc = koffi.load(libcPath);
const getpid = libc.func('int getpid(void)');

bench(
  { backend: 'koffi', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => getpid()
);
