#!/usr/bin/env node
/*
  check-bundle-budgets.js — Sprint 1 placeholder
  - Purpose: fail CI when built bundles exceed provisional size budgets
  - Current state: prints bundle sizes and exits 0 (non-enforcing)
  - Owner: Frontend Engineer (WEDA-57)
*/

const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '..', 'dist');

function formatKB(bytes){ return (bytes/1024).toFixed(1) + 'KB'; }

function listFiles(dir){
  if(!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir)){
    const p = path.join(dir, entry);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) out.push(...listFiles(p));
    else out.push({ file: p, size: stat.size });
  }
  return out;
}

const files = listFiles(dist).filter(f => /\.(js|css)$/.test(f.file));
const total = files.reduce((a,b)=>a+b.size,0);

console.log('Bundle size report (placeholder)');
for(const f of files){
  console.log('-', path.relative(dist, f.file), formatKB(f.size));
}
console.log('Total', formatKB(total));
console.log('\nNOTE: Budgets not enforced yet. Implement thresholds in WEDA-57.');
process.exit(0);
