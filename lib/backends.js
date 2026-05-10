'use strict';

const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

const SCENARIOS_PRIMITIVE = ['add-i32', 'add-f64', 'getpid', 'many-args', 'pointer-bigint'];
const SCENARIOS_FFI_TESTS_EXTRA = [
  'noop-void',
  'identity-i32',
  'add-i8',
  'add-u8',
  'add-i16',
  'add-u16',
  'add-i64',
  'add-u64',
  'add-f32',
  'sum-3-i32',
  'sum-5-i32',
  'sum-8-i32',
  'string-length',
  'string-first-char',
  'string-equals-hello',
];
const SCENARIOS_FFI_RS_EXTRA = SCENARIOS_FFI_TESTS_EXTRA.filter((scenario) =>
  !['add-i8', 'add-u16', 'add-f32'].includes(scenario)
);
const SUM_BUFFER_SIZES = [64, 1024, 16384];

function scenarioRuns(benchmarkDir, options = {}) {
  const extraScenarios = options.extraScenarios ?? SCENARIOS_FFI_TESTS_EXTRA;
  const extension = options.extension ?? 'js';
  const runs = [];
  for (const s of SCENARIOS_PRIMITIVE) {
    runs.push({
      scenario: s,
      script: path.join(repoRoot, 'benchmarks', benchmarkDir, `${s}.${extension}`),
      env: {},
    });
  }
  for (const size of SUM_BUFFER_SIZES) {
    runs.push({
      scenario: 'sum-buffer',
      script: path.join(repoRoot, 'benchmarks', benchmarkDir, `sum-buffer.${extension}`),
      env: { NCB_SIZE: String(size) },
    });
  }
  for (const s of extraScenarios) {
    runs.push({
      scenario: s,
      script: path.join(repoRoot, 'benchmarks', benchmarkDir, `_ffi-tests-extra.${extension}`),
      env: { NCB_SCENARIO: s },
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

function executable(name, envVar) {
  return () => process.env[envVar] || name;
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
  { id: 'ffi-rs',    nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('ffi-rs', { extraScenarios: SCENARIOS_FFI_RS_EXTRA }) },
  {
    id: 'deno',
    nodeBinary: executable('deno', 'DENO'),
    flags: ['run', '--allow-ffi', '--allow-env=NCB_N,NCB_SIZE,NCB_SCENARIO'],
    runs: scenarioRuns('deno', { extension: 'mjs' }),
  },
  { id: 'bun',       nodeBinary: executable('bun', 'BUN'), flags: [], runs: scenarioRuns('bun', { extension: 'mjs' }) },
  { id: 'napi-c',    nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('napi-c') },
  { id: 'napi-cpp',  nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('napi-cpp') },
  { id: 'addon-nan', nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('addon-nan') },
  { id: 'addon-raw', nodeBinary: () => process.execPath, flags: [], runs: scenarioRuns('addon-raw') },
];

module.exports = { backends };
