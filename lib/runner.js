'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { backends } = require('./backends');

const SAMPLE_COUNT = process.env.NCB_SAMPLES
  ? Number(process.env.NCB_SAMPLES)
  : 5;

function backendMatchesFilter(backendId, filters) {
  if (filters.length === 0) return true;
  return filters.some((filter) => backendId === filter || backendId.startsWith(filter));
}

function parseBackendFilter(value = process.env.NCB_BACKENDS) {
  if (!value) return [];
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

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

  function winnerBackends(sc) {
    let best = -Infinity;
    const winners = new Set();
    for (const b of backendIds) {
      const r = lookup.get(`${b}|${sc}`);
      if (!r || r.status === 'error') continue;
      if (r.median > best) {
        best = r.median;
        winners.clear();
      }
      if (r.median === best) winners.add(b);
    }
    return winners;
  }

  const header = ['Scenario', ...backendIds];
  const data = scenarioRows.map((sc) => {
    const row = [sc];
    const winners = winnerBackends(sc);
    for (const b of backendIds) {
      const r = lookup.get(`${b}|${sc}`);
      if (!r) row.push('- ');
      else if (r.status === 'error') row.push('ERR ');
      else row.push(`${formatNum(r.median)}${winners.has(b) ? '*' : ' '}`);
    }
    return row;
  });
  const widths = header.map((_, col) =>
    Math.max(header[col].length, ...data.map((r) => r[col].length)),
  );
  const padCell = (cell, col) => col === 0 ? cell.padEnd(widths[col]) : cell.padStart(widths[col]);
  const fmtRow = (row) => row.map(padCell).join('  ');
  const lines = [
    fmtRow(header),
    widths.map((w) => '-'.repeat(w)).join('  '),
    ...data.map(fmtRow),
  ];
  return lines.join('\n');
}

function paramsForRun(run) {
  return run.env.NCB_SIZE ? { size: Number(run.env.NCB_SIZE) } : null;
}

function resolveExecutable(bin) {
  if (!bin) return null;
  if (bin.includes(path.sep)) return fs.existsSync(bin) ? bin : null;
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, bin);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // Try the next PATH entry.
    }
  }
  return null;
}

function runOne(backend, run, sampleIndex) {
  const bin = backend.nodeBinary();
  const resolvedBin = resolveExecutable(bin);
  if (!resolvedBin) {
    return {
      backend: backend.id,
      scenario: run.scenario,
      params: paramsForRun(run),
      status: 'error',
      error: `binary missing: ${bin}`,
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
  const res = spawnSync(resolvedBin, [...backend.flags, run.script], {
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
  parsed.binaryPath = resolvedBin;
  return parsed;
}

function runAll() {
  const all = [];
  const backendFilters = parseBackendFilter();
  for (const backend of backends) {
    if (!backendMatchesFilter(backend.id, backendFilters)) continue;
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

module.exports = { aggregate, backendMatchesFilter, formatTable, parseBackendFilter, resolveExecutable, runAll, main };
