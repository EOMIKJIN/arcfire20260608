#!/usr/bin/env node
/**
 * i18n 검수 — (1) KO/EN 사전 패리티 (2) 코드 한글 잔여량.
 *   npm run audit:i18n  [-- --top=30] [--json]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SCAN_DIRS = ['app', 'src'];
const SKIP_DIR = new Set(['node_modules', '.git', 'functions', 'assets']);
const HANGUL = /[\uAC00-\uD7A3]/;

const SKIP_FILE = [
  /\.test\.[tj]sx?$/,
  /\/data\/generated\//,
  /\/data\/balance\/generated\//,
  /\/i18n\/locales\//,
];

function listFiles(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) listFiles(full, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) out.push(full);
  }
  return out;
}

function stripComments(src) {
  let s = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  s = s.replace(/(^|[^:'"`])\/\/[^\n]*/g, (m, p1) => p1 + ''.padEnd(m.length - p1.length, ' '));
  return s;
}

function scanFile(full) {
  const rel = path.relative(ROOT, full).replace(/\\/g, '/');
  if (SKIP_FILE.some((re) => re.test('/' + rel))) return null;
  const raw = fs.readFileSync(full, 'utf8');
  const code = stripComments(raw);
  const lines = code.split('\n');
  const rawLines = raw.split('\n');
  let count = 0;
  const samples = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!HANGUL.test(lines[i])) continue;
    count += 1;
    if (samples.length < 3) samples.push(rawLines[i].trim().slice(0, 80));
  }
  return count > 0 ? { rel, count, samples } : null;
}

function parseDict(src) {
  const out = new Map();
  const re = /['"]([a-zA-Z0-9_.\uAC00-\uD7A3]+)['"]\s*:\s*((?:'[^']*'|"[^"]*"|`[^`]*`))/g;
  let m;
  while ((m = re.exec(src))) {
    let v = m[2];
    v = v.startsWith('`') ? v.slice(1, -1) : v.slice(1, -1);
    out.set(m[1], v);
  }
  return out;
}

function paramsOf(v) {
  return [...String(v).matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort();
}

function runParity() {
  const ko = fs.readFileSync(path.join(ROOT, 'src/i18n/locales/ko.ts'), 'utf8');
  const en = fs.readFileSync(path.join(ROOT, 'src/i18n/locales/en.ts'), 'utf8');
  const K = parseDict(ko);
  const E = parseDict(en);
  const onlyKo = [...K.keys()].filter((k) => !E.has(k)).sort();
  const onlyEn = [...E.keys()].filter((k) => !K.has(k) && !k.startsWith('skill.')).sort();
  const paramMism = [];
  for (const k of K.keys()) {
    if (!E.has(k)) continue;
    const a = paramsOf(K.get(k)).join(',');
    const b = paramsOf(E.get(k)).join(',');
    if (a !== b) paramMism.push({ k, ko: a, en: b });
  }
  const enHangul = [...E.entries()]
    .filter(([, v]) => HANGUL.test(v))
    .map(([k, v]) => ({ k, v: v.slice(0, 80) }));
  return {
    ko: K.size,
    en: E.size,
    onlyKo,
    onlyEn,
    paramMism,
    enHangul,
    ok: onlyKo.length === 0 && onlyEn.length === 0 && paramMism.length === 0,
  };
}

function main() {
  const args = process.argv.slice(2);
  const top = Number((args.find((a) => a.startsWith('--top=')) || '--top=25').split('=')[1]) || 25;
  const asJson = args.includes('--json');

  const parity = runParity();

  const files = [];
  for (const d of SCAN_DIRS) {
    const abs = path.join(ROOT, d);
    if (fs.existsSync(abs)) listFiles(abs, files);
  }

  const results = [];
  for (const f of files) {
    const r = scanFile(f);
    if (r) results.push(r);
  }
  results.sort((a, b) => b.count - a.count);

  const totalLines = results.reduce((s, r) => s + r.count, 0);
  const totalFiles = results.length;

  if (asJson) {
    process.stdout.write(
      JSON.stringify({ parity, totalLines, totalFiles, files: results }, null, 2),
    );
    return;
  }

  const out = [];
  out.push('# i18n 검수 (패리티 + 한국어 잔여)');
  out.push('');
  out.push(`Generated: ${new Date().toISOString()}`);
  out.push('');
  out.push('## KO/EN 사전 패리티');
  out.push('');
  out.push(`- KO keys: **${parity.ko}** · EN keys: **${parity.en}**`);
  out.push(`- onlyKo: **${parity.onlyKo.length}** · onlyEn: **${parity.onlyEn.length}**`);
  out.push(`- param mismatch: **${parity.paramMism.length}**`);
  out.push(`- EN 값 내 한글(의도 가능): **${parity.enHangul.length}**`);
  out.push(`- 패리티: **${parity.ok ? 'PASS' : 'FAIL'}**`);
  if (parity.onlyKo.length) out.push(`- onlyKo sample: ${parity.onlyKo.slice(0, 8).join(', ')}`);
  if (parity.onlyEn.length) out.push(`- onlyEn sample: ${parity.onlyEn.slice(0, 8).join(', ')}`);
  if (parity.paramMism.length) {
    for (const m of parity.paramMism.slice(0, 10)) {
      out.push(`- param \`${m.k}\` ko={${m.ko}} en={${m.en}}`);
    }
  }
  for (const h of parity.enHangul) {
    out.push(`- EN hangul \`${h.k}\`: ${h.v}`);
  }
  out.push('');
  out.push('## 한국어 잔여 문자열');
  out.push('');
  out.push(`- 한국어 노출 후보 라인(코멘트 제외): **${totalLines}**`);
  out.push(`- 해당 파일 수: **${totalFiles}**`);
  out.push('');
  out.push(`## 잔여량 상위 ${Math.min(top, results.length)}개 파일`);
  out.push('');
  out.push('| 잔여 | 파일 |');
  out.push('|---:|---|');
  for (const r of results.slice(0, top)) {
    out.push(`| ${r.count} | ${r.rel} |`);
  }
  out.push('');
  out.push(
    '> 잔여 상위는 LEGACY_MIGRATE / DEV_CONSOLE / DATA_SEED / KO_MATCHER 가 섞임. 스토리 CSV는 별도 파이프라인.',
  );

  const report = out.join('\n');
  const reportDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'latest.md'), report, 'utf8');
  process.stdout.write(report + '\n');

  if (!parity.ok) process.exitCode = 1;
}

main();
