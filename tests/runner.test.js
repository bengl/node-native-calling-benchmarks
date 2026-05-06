'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { aggregate, formatTable } = require('../lib/runner');

test('aggregate computes min/median/max per (backend, scenario, params) cell', () => {
  const samples = [
    { backend: 'a', scenario: 'x', params: null, opsPerSec: 100 },
    { backend: 'a', scenario: 'x', params: null, opsPerSec: 110 },
    { backend: 'a', scenario: 'x', params: null, opsPerSec: 90 },
    { backend: 'a', scenario: 'x', params: null, opsPerSec: 105 },
    { backend: 'a', scenario: 'x', params: null, opsPerSec: 95 },
  ];
  const out = aggregate(samples);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].min, 90);
  assert.strictEqual(out[0].max, 110);
  assert.strictEqual(out[0].median, 100);
});

test('aggregate groups sum-buffer by params.size', () => {
  const samples = [
    { backend: 'a', scenario: 'sum-buffer', params: { size: 64 }, opsPerSec: 100 },
    { backend: 'a', scenario: 'sum-buffer', params: { size: 1024 }, opsPerSec: 50 },
    { backend: 'a', scenario: 'sum-buffer', params: { size: 64 }, opsPerSec: 110 },
  ];
  const out = aggregate(samples);
  const sizes = out.map((r) => r.params.size).sort((a, b) => a - b);
  assert.deepStrictEqual(sizes, [64, 1024]);
});

test('aggregate records errored cells as status=error', () => {
  const samples = [
    { backend: 'a', scenario: 'x', params: null, status: 'error', error: 'boom' },
  ];
  const out = aggregate(samples);
  assert.strictEqual(out[0].status, 'error');
});

test('formatTable produces a string with backend column headers', () => {
  const aggregated = [
    { backend: 'a', scenario: 'x', params: null, median: 100, min: 90, max: 110 },
    { backend: 'b', scenario: 'x', params: null, median: 200, min: 190, max: 210 },
  ];
  const table = formatTable(aggregated);
  assert.match(table, /\ba\b/);
  assert.match(table, /\bb\b/);
  assert.match(table, /\bx\b/);
});
