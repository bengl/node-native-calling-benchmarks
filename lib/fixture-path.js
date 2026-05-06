'use strict';

const path = require('node:path');

const ext = process.platform === 'darwin' ? 'dylib' : 'so';

const fixturePath = path.join(
  __dirname, 'fixture', 'build', `ffi_test_library.${ext}`
);

module.exports = { fixturePath };
