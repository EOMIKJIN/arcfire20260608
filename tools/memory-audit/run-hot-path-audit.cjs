#!/usr/bin/env node
/**
 * Hot path tick — 루프 내 할당·persist 패턴 정적 스캔 (경고)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'hot-path-audit-latest.md');

const SCAN_DIRS = [
  'src/arcCore/subcores',
  'src/game/planetHub',
  'app/(game)/planet.tsx',
];

const FORBIDDEN_IN_TICK = [
  { re: /useFrameCallback[\s\S]{0,800}?\.map\s*\(/, label: 'useFrameCallback body .map()' },
  { re: /useFrameCallback[\s\S]{0,800}?JSON\.stringify/, label: 'useFrameCallback JSON.stringify' },
  { re: /onWallTick[\s\S]{0,400}?\.slice\s*\(/, label: 'onWallTick .slice()' },
];

function readFile(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function walkDir(relDir) {
  const abs = path.join(ROOT, relDir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(relDir, ent.name).replace(/\\/g, '/');
    if (ent.isDirectory()) out.push(...walkDir(rel));
    else if (/\.(tsx?|jsx?)$/.test(ent.name)) out.push(rel);
  }
  return out;
}

const files = new Set();
for (const d of SCAN_DIRS) {
  if (d.endsWith('.tsx')) {
    files.add(d);
  } else {
    for (const f of walkDir(d)) files.add(f);
  }
}

const hits = [];
for (const rel of files) {
  const body = readFile(rel);
  if (!body) continue;
  for (const rule of FORBIDDEN_IN_TICK) {
    if (rule.re.test(body)) hits.push({ file: rel, rule: rule.label });
  }
}

const pass = hits.length === 0;
const lines = [
  '# Hot Path Zero-Allocation Audit',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `**Result:** ${pass ? 'PASS' : 'WARN'} (hits=${hits.length})`,
  '',
];

if (hits.length) {
  lines.push('## Hits', ...hits.map((h) => `- \`${h.file}\` — ${h.rule}`), '');
} else {
  lines.push('No forbidden tick patterns in scanned paths.', '');
}

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
console.log(lines.slice(0, 5).join('\n'));
process.exit(0);
