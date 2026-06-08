'use strict';
/**
 * 일일 점검 실행 후 Cursor 에이전트(Cloud/로컬)에 넘길 단일 핸드오프 문서 생성
 * 출력: tools/arc-core-self-optimize/outbox/cursor-handoff.md
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(__dirname, 'outbox');
const OUT = path.join(OUT_DIR, 'cursor-handoff.md');
const TEMPLATE = path.join(__dirname, 'PROMPT_TEMPLATE.md');
const AUDIT_REPORT = path.join(ROOT, 'tools', 'daily-perf-audit', 'reports', 'latest.md');

function runNpm(script) {
  return spawnSync('npm', ['run', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 12 * 1024 * 1024,
  });
}

function main() {
  const audit = runNpm('audit:daily');
  if (audit.status !== 0) {
    console.error(audit.stdout || audit.stderr || 'audit:daily failed');
    process.exit(audit.status || 1);
  }

  let template = '';
  try {
    template = fs.readFileSync(TEMPLATE, 'utf8');
  } catch (e) {
    console.error('Missing PROMPT_TEMPLATE.md', e);
    process.exit(1);
  }

  let report = '';
  try {
    report = fs.readFileSync(AUDIT_REPORT, 'utf8');
  } catch {
    report = '_(일일 보고서 없음 — `npm run audit:daily` 를 먼저 실행했는지 확인)_\n';
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const body = [
    '---',
    'handoff: arc-core-self-optimize',
    `generated: ${new Date().toISOString()}`,
    '---',
    '',
    '# 에이전트 지시문 (템플릿)',
    '',
    template.trim(),
    '',
    '---',
    '',
    '# 일일 점검 보고서 (자동 삽입)',
    '',
    report.trimEnd(),
    '',
  ].join('\n');

  fs.writeFileSync(OUT, body, 'utf8');
  console.log(`Handoff written: ${path.relative(ROOT, OUT)}`);
}

main();
