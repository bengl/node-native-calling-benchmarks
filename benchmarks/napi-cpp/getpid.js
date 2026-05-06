'use strict';
const addon = require('../../addons/napi-cpp/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'napi-cpp', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => addon.getpid()
);
