'use strict';
/**
 * beforeSubmitPrompt — incident handoff 대기 시 P0 분석 컨텍스트 주입 (2026-10-09~ 코드 수정 = 김플레이 · Cursor 는 분석만)
 */
const path = require('path');
const {
  resolveIncidentPaths,
  readTriggerMeta,
  shouldInjectIncidentP0,
  readHandoffExcerpt,
} = require('./incidentHandoffGate.cjs');

const ROOT = process.cwd();

function readStdinJson() {
  try {
    const fs = require('fs');
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

function main() {
  readStdinJson();

  if (!shouldInjectIncidentP0(ROOT)) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const p = resolveIncidentPaths(ROOT);
  const triggerMeta = readTriggerMeta(p.trigger);
  const reason = triggerMeta?.reason || 'incident_handoff_pending';
  const ctx = [
    '[Arcfire 장기 감시 — 이상 감지 P0 · 원인 분석·리포트만 (코드 수정 = 메인리더 김플레이)]',
    '',
    `triggerReason: ${reason}`,
    triggerMeta?.alertLine ? `alert: ${String(triggerMeta.alertLine).slice(0, 400)}` : '',
    '',
    '2026-10-09 조직 개편: Skia·STAGE·메모리·크래시 코드 수정은 김플레이(Claude Code)만 한다.',
    '이 Cursor 세션(김팀장 · UI 팀원)은 **코드를 고치지 않는다.**',
    '1. `arcfire-bug-debug-workflow.mdc` — incident-logcat / crash / mem-timeline / `adb shell dumpsys activity exit-info` 근거로 원인 후보 정리',
    '2. 결과를 `tools/kim-team-lead/reports/kim-team-lead-incident-<날짜>.md` 로 남기고 대표님께 「김플레이 전달」 안내',
    '3. ack 는 김플레이가 수정·실기 재측 후 실행한다(이 세션에서 ack 금지)',
    '',
    'handoff: tools/long-run-monitor/outbox/cursor-incident-handoff.md',
    '',
    '--- handoff excerpt ---',
    readHandoffExcerpt(ROOT, 4000),
  ]
    .filter(Boolean)
    .join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
