'use strict';
/**
 * 일일 성능·위생 점검 (아크코어 완성 전 단계 — 분석 위주, 자동 대량 수정 없음)
 * - TypeScript 검사
 * - 콘텐츠 테이블 빌드(정본 동기)
 * - src/app 대용량 TS/TSX 파일·setInterval 사용처 등 후보 목록
 * 보고서: tools/daily-perf-audit/reports/latest.md
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_MD = path.join(REPORT_DIR, 'latest.md');
const REPORT_TXT = path.join(REPORT_DIR, 'latest.txt');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 10 * 1024 * 1024,
    ...opts,
  });
  return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function walkCollectFiles(dir, exts, out, depth = 0) {
  if (depth > 40) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === '.expo') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkCollectFiles(p, exts, out, depth + 1);
    } else if (e.isFile()) {
      const ok = exts.some((ext) => e.name.endsWith(ext));
      if (ok) out.push(p);
    }
  }
}

function largestSourceFiles(max = 18) {
  const files = [];
  walkCollectFiles(path.join(ROOT, 'src'), ['.ts', '.tsx'], files);
  walkCollectFiles(path.join(ROOT, 'app'), ['.ts', '.tsx'], files);
  const withSize = files.map((f) => {
    try {
      return { f, bytes: fs.statSync(f).size };
    } catch {
      return { f, bytes: 0 };
    }
  });
  withSize.sort((a, b) => b.bytes - a.bytes);
  return withSize.slice(0, max);
}

function grepPatternInProject(pattern, maxHits = 40) {
  const files = [];
  walkCollectFiles(path.join(ROOT, 'src'), ['.ts', '.tsx'], files);
  walkCollectFiles(path.join(ROOT, 'app'), ['.ts', '.tsx'], files);
  const hits = [];
  for (const f of files) {
    let s;
    try {
      s = fs.readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    if (s.length > 1_500_000) continue;
    if (!s.includes(pattern)) continue;
    hits.push(path.relative(ROOT, f).replace(/\\/g, '/'));
    if (hits.length >= maxHits) break;
  }
  return hits;
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const lines = [];
  const stamp = new Date().toISOString();
  lines.push(`# Daily audit — ${stamp}`, '');
  lines.push('## TypeScript (`npx tsc --noEmit`)', '');
  const tsc = run('npx', ['tsc', '--noEmit']);
  lines.push('```');
  lines.push((tsc.stdout + tsc.stderr).trim() || '(no output)');
  lines.push('```', '');
  lines.push(`**exit:** ${tsc.status}`, '');

  lines.push('## Content tables (`npm run build:content-tables`)', '');
  const content = run('npm', ['run', 'build:content-tables']);
  lines.push('```');
  lines.push((content.stdout + content.stderr).trim() || '(no output)');
  lines.push('```', '');
  lines.push(`**exit:** ${content.status}`, '');

  lines.push('## Largest TS/TSX under `src/` + `app/` (bytes)', '');
  for (const { f, bytes } of largestSourceFiles()) {
    lines.push(`- ${bytes.toLocaleString()} — \`${path.relative(ROOT, f).replace(/\\/g, '/')}\``);
  }
  lines.push('');

  lines.push('## `setInterval(` occurrences (manual leak review)', '');
  const intervals = grepPatternInProject('setInterval(', 60);
  lines.push(intervals.length ? intervals.map((h) => `- \`${h}\``).join('\n') : '_none_');
  lines.push('');

  lines.push('## `subscribe(` / `addEventListener(` hints (manual cleanup review)', '');
  const subs = grepPatternInProject('.subscribe(', 35);
  const ev = grepPatternInProject('addEventListener(', 35);
  lines.push('**subscribe**');
  lines.push(subs.length ? subs.map((h) => `- \`${h}\``).join('\n') : '_none_');
  lines.push('');
  lines.push('**addEventListener**');
  lines.push(ev.length ? ev.map((h) => `- \`${h}\``).join('\n') : '_none_');
  lines.push('');

  lines.push('## Optional dependency scan', '');
  if (process.env.AUDIT_RUN_DEPCHECK === '1') {
    lines.push('`AUDIT_RUN_DEPCHECK=1` — running `npx depcheck --json` …', '');
    const dep = run('npx', ['--yes', 'depcheck', '--json']);
    if (dep.stdout && dep.stdout.trim().startsWith('{')) {
      try {
        const j = JSON.parse(dep.stdout);
        lines.push('```json');
        lines.push(JSON.stringify({ dependencies: j.dependencies, devDependencies: j.devDependencies }, null, 2));
        lines.push('```');
      } catch {
        lines.push('```', (dep.stdout + dep.stderr).slice(0, 8000), '```');
      }
    } else {
      lines.push('```', (dep.stdout + dep.stderr).trim().slice(0, 8000) || '(no output)', '```');
    }
    lines.push(`**exit:** ${dep.status} _(informational only)_`, '');
  } else {
    lines.push(
      '_Skipped (slow / RN·Expo false positives). To include: `AUDIT_RUN_DEPCHECK=1 npm run audit:daily`_',
      '',
    );
  }

  const md = lines.join('\n');
  fs.writeFileSync(REPORT_MD, md, 'utf8');
  fs.writeFileSync(REPORT_TXT, md.replace(/^#+ /gm, '').replace(/```/g, ''), 'utf8');

  const fail = tsc.status !== 0 || content.status !== 0;
  if (fail) {
    console.error(md);
    process.exit(1);
  }
  console.log(`OK — report: ${path.relative(ROOT, REPORT_MD)}`);
}

main();
