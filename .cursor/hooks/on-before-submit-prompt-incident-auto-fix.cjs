'use strict';
/**
 * beforeSubmitPrompt — incident handoff 대기 시 김팀장 P0 자동수정 컨텍스트 주입
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const HANDOFF = path.join(ROOT, 'tools/long-run-monitor/outbox/cursor-incident-handoff.md');
const TRIGGER = path.join(ROOT, '.cursor/trigger-incident-auto-fix.json');
const ACK = path.join(ROOT, 'tools/long-run-monitor/outbox/incident-handoff-acked-at.txt');

function readStdinJson() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

function isAckedAfter(fileMtimeMs) {
  try {
    const ack = fs.readFileSync(ACK, 'utf8').trim();
    const ackMs = Date.parse(ack);
    return Number.isFinite(ackMs) && ackMs >= fileMtimeMs;
  } catch {
    return false;
  }
}

function main() {
  readStdinJson();

  let triggerMeta = null;
  try {
    if (fs.existsSync(TRIGGER)) {
      triggerMeta = JSON.parse(fs.readFileSync(TRIGGER, 'utf8'));
    }
  } catch {
    /* ignore */
  }

  const handoffExists = fs.existsSync(HANDOFF);
  if (!handoffExists && !triggerMeta) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  let handoffMtime = 0;
  if (handoffExists) {
    handoffMtime = fs.statSync(HANDOFF).mtimeMs;
    if (isAckedAfter(handoffMtime)) {
      process.stdout.write(JSON.stringify({}));
      return;
    }
  }

  let body = '';
  if (handoffExists) {
    try {
      body = fs.readFileSync(HANDOFF, 'utf8');
    } catch {
      body = '';
    }
  }

  const reason = triggerMeta?.reason || 'incident_handoff_pending';
  const ctx = [
    '[Arcfire 장기 감시 — 이상 감지 P0 · 즉시 정밀 원인 추적 + 코드 자동 수정]',
    '',
    `triggerReason: ${reason}`,
    triggerMeta?.alertLine ? `alert: ${String(triggerMeta.alertLine).slice(0, 400)}` : '',
    '',
    '**사용자 별도 지시 없이 즉시 수행:**',
    '0. 코드 diff 전 [pss-pre-dev] 3줄 — arcfire-memory-leak-audit-first.mdc §0-A',
    '1. `arcfire-bug-debug-workflow.mdc` — incident-logcat / crash / mem-timeline 근거로 원인 1개 특정',
    '2. 코드 최소 diff 수정 · `npx tsc --noEmit -p tsconfig.client.json`',
    '3. STAGE·worldmap·planet·store: `npm run audit:memory:all` · Reanimated: `audit:worklet-contract`',
    '4. Skia·worldmap·transit-combat 관련이면 `npm run audit:skia-memory`',
    '5. 완료: handoff `mem-post-dev-recheck` 배정 + `node tools/long-run-monitor/ack-incident-handoff.cjs`',
    '',
    'handoff: tools/long-run-monitor/outbox/cursor-incident-handoff.md',
    '',
    '--- handoff excerpt ---',
    body.slice(0, 4000),
  ]
    .filter(Boolean)
    .join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
