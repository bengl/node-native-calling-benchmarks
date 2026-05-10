'use strict';

const { close, DataType, define, open } = require('ffi-rs');
const { fixturePath } = require('../../lib/fixture-path');

function withFixture(definitions, callback) {
  open({ library: 'ncb_fixture', path: fixturePath });
  const functions = define(
    Object.fromEntries(
      Object.entries(definitions).map(([name, definition]) => [
        name,
        { library: 'ncb_fixture', ...definition },
      ])
    )
  );
  try {
    return callback(functions);
  } finally {
    close('ncb_fixture');
  }
}

module.exports = { DataType, withFixture };
