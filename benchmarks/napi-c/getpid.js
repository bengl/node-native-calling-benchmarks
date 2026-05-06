'use strict';
const addon = require('../../addons/napi-c/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-c', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => addon.getpid()
);
