'use strict';
const addon = require('../../addons/addon-nan/build/Release/addon.node');
const { bench } = require('../../lib/harness');

bench(
  { backend: 'addon-nan', scenario: 'getpid', n: 1e7, expected: process.pid },
  () => addon.getpid()
);
