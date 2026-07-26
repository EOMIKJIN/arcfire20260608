'use strict';
/**
 * beforeSubmitPrompt — 김클로드 handoff status=PENDING 시 **기존 대화창**에도 검수 P0 주입.
 * sessionStart만으로는 밤새 연 채팅·김클로드 완료 직후 검수 누락 회귀 방지.
 */
const path = require('path');
const { readPendingHandoff } = require('./kimClaudeHandoffCore.cjs');

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

  const pending = readPendingHandoff(ROOT);
  if (!pending) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const ctx = [
    '## P0 — 김클로드 handoff 검수 대기 (beforeSubmitPrompt · 자동 감지)',
    '',
    `handoff **status=\`PENDING\`** · task_id=\`${pending.taskId}\``,
    '',
    '**이번 턴 최우선**: 사용자 프롬프트와 무관하게 김클로드 handoff **검수를 즉시 시작**하라.',
    '1. `tools/kim-team-lead/reports/kim-claude-handoff-pending.md` 전문 읽기',
    '2. `git diff` → `npx tsc --noEmit -p tsconfig.client.json`',
    '3. (해당 시) `npm run audit:skia-memory` / `npm run audit:memory:all`',
    '4. verdict 기록 → status `REVIEWED` → `IDLE` · **커밋은 대표님 명시 요청 시만**',
    '',
    '정본: `docs/KIM_TEAM_LEAD_AGENT.md` §김클로드 검수 게이트',
    '',
    '--- handoff (head) ---',
    pending.head,
  ].join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
