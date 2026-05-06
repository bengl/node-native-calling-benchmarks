'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const { fixturePath } = require('../lib/fixture-path');
const skip = !fs.existsSync(fixturePath);
const scripts = ['add-i32', 'add-f64', 'getpid', 'many-args', 'pointer-bigint', 'sum-buffer'];

for (const script of scripts) {
  test(`koffi/${script} produces a valid JSON sample`, { skip }, () => {
    const res = spawnSync(
      process.execPath,
      [`benchmarks/koffi/${script}.js`],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, NCB_N: '1000' },
      }
    );
    assert.strictEqual(res.status, 0, res.stderr);
    const last = res.stdout.trim().split('\n').pop();
    const parsed = JSON.parse(last);
    assert.strictEqual(parsed.backend, 'koffi');
    assert.ok(parsed.opsPerSec > 0);
  });
}
