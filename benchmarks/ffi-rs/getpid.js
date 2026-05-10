'use strict';

const { close, DataType, define, open } = require('ffi-rs');
const { bench } = require('../../lib/harness');

const libcPath = process.platform === 'darwin' ? 'libc.dylib' : 'libc.so.6';

open({ library: 'ncb_libc', path: libcPath });
const { getpid } = define({
  getpid: { library: 'ncb_libc', retType: DataType.I32, paramsType: [] },
});

try {
  bench(
    { backend: 'ffi-rs', scenario: 'getpid', n: 1e7, expected: process.pid },
    () => getpid([])
  );
} finally {
  close('ncb_libc');
}
