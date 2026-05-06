'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const addonPath = path.join(repoRoot, 'addons', 'addon-nan', 'build', 'Release', 'addon.node');
const skip = !fs.existsSync(addonPath);

const scripts = ['add-i32', 'add-f64', 'getpid', 'many-args', 'pointer-bigint', 'sum-buffer'];

for (const script of scripts) {
  test(`addon-nan/${script} produces a valid JSON sample`, { skip }, () => {
    const res = spawnSync(
      process.execPath,
      [`benchmarks/addon-nan/${script}.js`],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, NCB_N: '1000' },
      }
    );
    assert.strictEqual(res.status, 0, res.stderr);
    const parsed = JSON.parse(res.stdout.trim().split('\n').pop());
    assert.strictEqual(parsed.backend, 'addon-nan');
  });
}
