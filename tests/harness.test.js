'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

function runHarnessScript(code, env = {}) {
  return spawnSync(process.execPath, ['-e', code], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('bench emits a JSON line with required fields', () => {
  const code = `
    const { bench } = require('./lib/harness');
    bench({ backend: 'test', scenario: 'noop', n: 1000, expected: 42 }, () => 42);
  `;
  const res = runHarnessScript(code);
  assert.strictEqual(res.status, 0, res.stderr);
  const last = res.stdout.trim().split('\n').pop();
  const parsed = JSON.parse(last);
  assert.strictEqual(parsed.backend, 'test');
  assert.strictEqual(parsed.scenario, 'noop');
  assert.strictEqual(parsed.n, 1000);
  assert.ok(parsed.opsPerSec > 0);
  assert.ok(typeof parsed.durationNs === 'string');
});

test('bench exits non-zero when sanity check fails', () => {
  const code = `
    const { bench } = require('./lib/harness');
    bench({ backend: 'test', scenario: 'bad', n: 100, expected: 42 }, () => 999);
  `;
  const res = runHarnessScript(code);
  assert.notStrictEqual(res.status, 0);
  assert.match(res.stderr, /Sanity check failed/);
});

test('bench respects NCB_N override', () => {
  const code = `
    const { bench } = require('./lib/harness');
    bench({ backend: 'test', scenario: 'short', n: 1e9, expected: 1 }, () => 1);
  `;
  const res = runHarnessScript(code, { NCB_N: '500' });
  assert.strictEqual(res.status, 0, res.stderr);
  const parsed = JSON.parse(res.stdout.trim().split('\n').pop());
  assert.strictEqual(parsed.n, 500);
});

test('bench handles bigint expected', () => {
  const code = `
    const { bench } = require('./lib/harness');
    bench({ backend: 'test', scenario: 'big', n: 100, expected: 42n }, () => 42n);
  `;
  const res = runHarnessScript(code);
  assert.strictEqual(res.status, 0, res.stderr);
});
