'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { backends } = require('./backends');

const SAMPLE_COUNT = process.env.NCB_SAMPLES
  ? Number(process.env.NCB_SAMPLES)
  : 5;

function cellKey(s) {
  const p = s.params ? JSON.stringify(s.params) : '';
  return `${s.backend}|${s.scenario}|${p}`;
}

function aggregate(samples) {
  const groups = new Map();
  for (const s of samples) {
    const k = cellKey(s);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(s);
  }
  const out = [];
  for (const [, list] of groups) {
    const first = list[0];
    const errored = list.find((s) => s.status === 'error');
    if (errored) {
      out.push({
        backend: first.backend,
        scenario: first.scenario,
        params: first.params,
        status: 'error',
        error: errored.error,
      });
      continue;
    }
    const ops = list.map((s) => s.opsPerSec).sort((a, b) => a - b);
    out.push({
      backend: first.backend,
      scenario: first.scenario,
      params: first.params,
      min: ops[0],
      median: ops[Math.floor(ops.length / 2)],
      max: ops[ops.length - 1],
      samples: list.length,
    });
  }
  return out;
}

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toFixed(0);
}

function formatTable(rows) {
  const backendIds = [...new Set(rows.map((r) => r.backend))];
  const scenarioRows = [...new Set(rows.map((r) => {
    const suffix = r.params?.size != null ? `-${r.params.size}` : '';
    return r.scenario + suffix;
  }))];

  const lookup = new Map();
  for (const r of rows) {
    const suffix = r.params?.size != null ? `-${r.params.size}` : '';
    lookup.set(`${r.backend}|${r.scenario}${suffix}`, r);
  }

  const header = ['Scenario', ...backendIds];
  const lines = [header.join('\t')];
  for (const sc of scenarioRows) {
    const row = [sc];
    for (const b of backendIds) {
      const r = lookup.get(`${b}|${sc}`);
      if (!r) row.push('-');
      else if (r.status === 'error') row.push('ERR');
      else row.push(formatNum(r.median));
    }
    lines.push(row.join('\t'));
  }
  return lines.join('\n');
}

function paramsForRun(run) {
  return run.env.NCB_SIZE ? { size: Number(run.env.NCB_SIZE) } : null;
}

function runOne(backend, run, sampleIndex) {
  const bin = backend.nodeBinary();
  if (!bin || !fs.existsSync(bin)) {
    return {
      backend: backend.id,
      scenario: run.scenario,
      params: paramsForRun(run),
      status: 'error',
      error: `node binary missing: ${bin}`,
    };
  }
  if (!fs.existsSync(run.script)) {
    return {
      backend: backend.id,
      scenario: run.scenario,
      params: paramsForRun(run),
      status: 'error',
      error: `script missing: ${run.script}`,
    };
  }
  const res = spawnSync(bin, [...backend.flags, run.script], {
    encoding: 'utf8',
    env: { ...process.env, ...run.env },
  });
  if (res.status !== 0) {
    return {
      backend: backend.id,
      scenario: run.scenario,
      params: paramsForRun(run),
      status: 'error',
      error: (res.stderr || '').trim().slice(0, 500),
    };
  }
  const last = res.stdout.trim().split('\n').pop();
  const parsed = JSON.parse(last);
  // Scripts emit a generic backend label (e.g. "core-ffi"); replace with
  // the outer backend's id so aggregation keys correctly per node binary.
  parsed.backend = backend.id;
  parsed.sampleIndex = sampleIndex;
  parsed.binaryPath = bin;
  return parsed;
}

function runAll() {
  const all = [];
  for (const backend of backends) {
    for (const run of backend.runs) {
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const s = runOne(backend, run, i);
        all.push(s);
      }
    }
  }
  return all;
}

function main() {
  const samples = runAll();
  const aggregated = aggregate(samples);
  console.log('\n' + formatTable(aggregated) + '\n');

  fs.mkdirSync('results', { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join('results', `${ts}.json`);
  fs.writeFileSync(outPath, JSON.stringify({
    meta: {
      ts,
      os: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    },
    samples,
  }, null, 2));
  console.log(`Wrote ${outPath}`);
}

if (require.main === module) main();

module.exports = { aggregate, formatTable, runAll, main };
