'use strict';

const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

const SCENARIOS_PRIMITIVE = ['add-i32', 'add-f64', 'getpid', 'many-args', 'pointer-bigint'];
const SUM_BUFFER_SIZES = [64, 1024, 16384];

function scenarioRuns(benchmarkDir) {
  const runs = [];
  for (const s of SCENARIOS_PRIMITIVE) {
    runs.push({
      scenario: s,
      script: path.join(repoRoot, 'benchmarks', benchmarkDir, `${s}.js`),
      env: {},
    });
  }
  for (const size of SUM_BUFFER_SIZES) {
    runs.push({
      scenario: 'sum-buffer',
      script: path.join(repoRoot, 'benchmarks', benchmarkDir, 'sum-buffer.js'),
      env: { NCB_SIZE: String(size) },
    });
  }
  return runs;
}

function vendoredNode(name, envVar) {
  return () => {
    if (process.env[envVar]) return process.env[envVar];
    return path.join(repoRoot, 'vendor', name, 'node');
  };
}

const backends = [
  {
    id: 'core-ffi-main',
    nodeBinary: vendoredNode('node-main', 'NODE_MAIN'),
    flags: ['--experimental-ffi'],
    runs: scenarioRuns('core-ffi'),
  },
  {
    id: 'core-ffi-63140',
    nodeBinary: vendoredNode('node-pr-63140', 'NODE_PR_63140'),
    flags: ['--experimental-ffi'],
    runs: scenarioRuns('core-ffi'),
  },
  {
    id: 'core-ffi-63068',
    nodeBinary: vendoredNode('node-pr-63068', 'NODE_PR_63068'),
    flags: ['--experimental-ffi'],
    runs: scenarioRuns('core-ffi'),
  },
  { id: 'koffi',     nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('koffi') },
  { id: 'ffi-napi',  nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('ffi-napi') },
  { id: 'napi-c',    nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('napi-c') },
  { id: 'napi-cpp',  nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('napi-cpp') },
  { id: 'addon-nan', nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('addon-nan') },
  { id: 'addon-raw', nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('addon-raw') },
];

module.exports = { backends };
