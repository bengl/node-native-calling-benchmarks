'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { resolveExecutable } = require('../lib/runner');

const repoRoot = path.resolve(__dirname, '..');
const { fixturePath } = require('../lib/fixture-path');
const bun = resolveExecutable(process.env.BUN || 'bun');
const skip = !bun || !fs.existsSync(fixturePath);
const scripts = ['add-i32', 'add-f64', 'getpid', 'many-args', 'pointer-bigint', 'sum-buffer'];

for (const script of scripts) {
  test(`bun/${script} produces a valid JSON sample`, { skip }, () => {
    const res = spawnSync(
      bun,
      [`benchmarks/bun/${script}.mjs`],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, NCB_N: '1000' },
      }
    );
    assert.strictEqual(res.status, 0, res.stderr);
    const parsed = JSON.parse(res.stdout.trim().split('\n').pop());
    assert.strictEqual(parsed.backend, 'bun');
    assert.ok(parsed.opsPerSec > 0);
  });
}
