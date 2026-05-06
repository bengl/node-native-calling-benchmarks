'use strict';
const addon = require('../../addons/addon-raw/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-raw', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => addon.getpid()
);
