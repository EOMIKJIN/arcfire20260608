'use strict';
/**
 * sessionStart — 장기 감시 incident 핸드오프가 있으면 김팀장 자동 조사·수정 P0 주입.
 * 정본: tools/long-run-monitor/outbox/cursor-incident-handoff.md
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const HANDOFF = path.join(ROOT, 'tools/long-run-monitor/outbox/cursor-incident-handoff.md');
const REFIX = path.join(ROOT, 'tools/long-run-monitor/logs/gl-leak-refix-requested.flag');
const PACK = path.join(ROOT, 'tools/long-run-monitor/pack-incident-handoff.cjs');

function tryPackFromRefix() {
  if (!fs.existsSync(REFIX) || fs.existsSync(HANDOFF)) return;
  try {
    execSync(`node "${PACK}" session_start_refix_pending`, {
      cwd: ROOT,
      stdio: 'pipe',
      windowsHide: true,
    });
  } catch {
    /* fail-open */
  }
}

function main() {
  try {
    fs.readFileSync(0, 'utf8');
  } catch {
    /* ignore */
  }

  tryPackFromRefix();

  if (!fs.existsSync(HANDOFF)) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  let body = '';
  try {
    body = fs.readFileSync(HANDOFF, 'utf8');
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const ctx = [
    '[Arcfire 장기 감시 — incident P0 · 김팀장 자동 조사·수정]',
    '',
    'tools/long-run-monitor/outbox/cursor-incident-handoff.md 가 대기 중이다.',
    '사용자 별도 지시 없이 **즉시** logcat·mem-timeline·crash·remediation VERIFY 근거로 원인 분석 → 코드 수정 → tsc(+ Skia면 audit:skia-memory) → ack.',
    '완료: node tools/long-run-monitor/ack-incident-handoff.cjs',
    '',
    '--- handoff excerpt ---',
    body.slice(0, 3500),
  ].join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
