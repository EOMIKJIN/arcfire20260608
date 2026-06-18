#!/usr/bin/env node
/**
 * i18n 검수 스캐너 — 코드(app/src) 내 "사용자 노출 한국어 문자열" 잔여량 측정.
 *   목적: 영어 전환 진행률/검수의 객관적 지표. (스토리 CSV·데이터 생성물은 별도 파이프라인)
 *   npm run audit:i18n  [-- --top=30] [--json]
 *
 * 탐지: 따옴표('"`) 문자열 리터럴 안의 한글, 또는 JSX 텍스트 노드의 한글.
 * 제외: 라인/블록 코멘트, *.test.ts, data/generated, i18n/locales, 콘솔·throw 메시지(개발용).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SCAN_DIRS = ['app', 'src'];
const SKIP_DIR = new Set(['node_modules', '.git', 'functions', 'assets']);
const HANGUL = /[\uAC00-\uD7A3]/;

// 검수 대상에서 제외하는 경로 패턴(데이터 생성물·사전·개발 도구)
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
    if (st.isDirectory()) {
      listFiles(full, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/** 코멘트 라인 제거(단순 휴리스틱: 블록 코멘트 + // 라인). */
function stripComments(src) {
  // 블록 코멘트
  let s = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  // 라인 코멘트(문자열 안의 //는 드물어 허용 오차)
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

function main() {
  const args = process.argv.slice(2);
  const top = Number((args.find((a) => a.startsWith('--top=')) || '--top=25').split('=')[1]) || 25;
  const asJson = args.includes('--json');

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
    process.stdout.write(JSON.stringify({ totalLines, totalFiles, files: results }, null, 2));
    return;
  }

  const out = [];
  out.push('# i18n 한국어 잔여 문자열 검수');
  out.push('');
  out.push(`Generated: ${new Date().toISOString()}`);
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
  out.push('> 스토리/콘텐츠 텍스트(CSV)는 별도 영어 파이프라인으로 측정한다.');

  const report = out.join('\n');
  const reportDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'latest.md'), report, 'utf8');
  process.stdout.write(report + '\n');
}

main();
