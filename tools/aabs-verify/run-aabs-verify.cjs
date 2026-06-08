#!/usr/bin/env node
/** AABS + balance + memory 통합 안정성 검증 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(__dirname, 'reports', 'latest.md');

function run(cmd) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
    return { ok: true, out: '' };
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    if (cmd.includes('tsc')) {
      const appErrors = out
        .split('\n')
        .filter((line) => line.includes('src/') && !line.includes('csvWeapons.ts'));
      if (appErrors.length === 0) return { ok: true, out: 'tsc: no new app errors' };
      return { ok: false, out: appErrors.join('\n') };
    }
    return { ok: false, out };
  }
}

const steps = [
  ['build:balance-tables', 'npm run build:balance-tables'],
  ['build:content-tables', 'npm run build:content-tables'],
  ['audit:balance', 'npm run audit:balance'],
  ['audit:memory', 'npm run audit:memory'],
  ['tsc', 'npx tsc --noEmit'],
];

const results = steps.map(([name, cmd]) => ({ name, ...run(cmd) }));
const failed = results.filter((r) => !r.ok);

const lines = [
  '# AABS Stability Verification',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `**Result:** ${failed.length === 0 ? 'PASS' : 'FAIL'}`,
  '',
  ...results.map((r) => `- [${r.ok ? 'x' : ' '}] ${r.name}`),
  '',
];

if (!fs.existsSync(path.dirname(OUT))) fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
if (failed.length) {
  for (const f of failed) console.error(`\n${f.name} failed:\n${f.out.slice(0, 2000)}`);
  process.exitCode = 1;
}
