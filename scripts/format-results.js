#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { aggregate } = require('../lib/runner');

function usage() {
  console.error('Usage: node scripts/format-results.js [--md|--csv] <results.json>');
  console.error('       node scripts/format-results.js [--md|--csv] --latest');
  process.exit(2);
}

const args = process.argv.slice(2);
let format = 'text';
let target = null;
for (const arg of args) {
  if (arg === '--md') format = 'md';
  else if (arg === '--csv') format = 'csv';
  else if (arg === '--text') format = 'text';
  else if (arg === '--latest') target = '__latest__';
  else if (arg.startsWith('-')) usage();
  else target = arg;
}
if (!target) usage();

if (target === '__latest__') {
  const dir = path.resolve(__dirname, '..', 'results');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.error('No results files found in', dir);
    process.exit(1);
  }
  target = path.join(dir, files[files.length - 1]);
}

const data = JSON.parse(fs.readFileSync(target, 'utf8'));
const rows = aggregate(data.samples);

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

function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toFixed(0);
}

function cellValue(r) {
  if (!r) return '-';
  if (r.status === 'error') return 'ERR';
  return fmtNum(r.median);
}

function printText() {
  const header = ['Scenario', ...backendIds];
  const data = scenarioRows.map((sc) => {
    const row = [sc];
    for (const b of backendIds) row.push(cellValue(lookup.get(`${b}|${sc}`)));
    return row;
  });
  const widths = header.map((_, col) =>
    Math.max(header[col].length, ...data.map((r) => r[col].length)),
  );
  const padCell = (cell, col) => col === 0 ? cell.padEnd(widths[col]) : cell.padStart(widths[col]);
  const fmtRow = (r) => r.map(padCell).join('  ');
  console.log(fmtRow(header));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const r of data) console.log(fmtRow(r));
}

function printMarkdown() {
  const header = ['Scenario', ...backendIds];
  console.log('| ' + header.join(' | ') + ' |');
  console.log('|' + header.map((h, i) => i === 0 ? '---' : '---:').map((s) => ' ' + s + ' ').join('|') + '|');
  for (const sc of scenarioRows) {
    const row = [sc];
    for (const b of backendIds) row.push(cellValue(lookup.get(`${b}|${sc}`)));
    console.log('| ' + row.join(' | ') + ' |');
  }
}

function printCsv() {
  const header = ['Scenario', ...backendIds];
  console.log(header.join(','));
  for (const sc of scenarioRows) {
    const row = [sc];
    for (const b of backendIds) row.push(cellValue(lookup.get(`${b}|${sc}`)));
    console.log(row.join(','));
  }
}

if (format === 'md') printMarkdown();
else if (format === 'csv') printCsv();
else printText();
