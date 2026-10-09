'use strict';
/**
 * sessionStart — 장기 감시 incident 핸드오프가 미확인일 때만 P0 분석 주입 (2026-10-09~ 수정·ack = 김플레이).
 * ack ≥ handoff/trigger mtime 이면 침묵.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { shouldInjectIncidentP0, readHandoffExcerpt } = require('./incidentHandoffGate.cjs');

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

  if (!shouldInjectIncidentP0(ROOT)) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const ctx = [
    '[Arcfire 장기 감시 — incident P0 · 분석만 (코드 수정·ack = 메인리더 김플레이)]',
    '',
    'tools/long-run-monitor/outbox/cursor-incident-handoff.md 가 대기 중이다.',
    '2026-10-09 조직 개편: 이 Cursor 세션(김팀장 · UI 팀원)은 코드를 고치지 않는다. logcat·mem-timeline·exit-info 근거로 원인 후보만 정리해',
    'tools/kim-team-lead/reports/kim-team-lead-incident-<날짜>.md 에 남기고 김플레이에게 넘긴다. ack 는 김플레이가 한다.',
    '',
    '--- handoff excerpt ---',
    readHandoffExcerpt(ROOT, 3500),
  ].join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
