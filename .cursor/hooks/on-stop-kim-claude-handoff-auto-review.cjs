'use strict';
/**
 * stop — 김클로드 handoff status=PENDING 이면 followup으로 검수를 자동 이어감.
 * 대표님 지시(2026-07-26): 「김클로드 작업이 끝나면 자동으로 알아서 검수」 *
 * 루프 방지:
 * - task_id+mtime 당 followup 최대 MAX_FOLLOWUPS회
 * - 상단 status가 REVIEWED/IDLE 이면 무동작
 * - hooks.json loop_limit 과 함께 사용
 */
const fs = require('fs');
const path = require('path');
const { readPendingHandoff } = require('./kimClaudeHandoffCore.cjs');

const ROOT = path.join(__dirname, '..', '..');
const STATE = path.join(
  ROOT,
  'tools',
  'kim-team-lead',
  'reports',
  '.kim-claude-auto-review-followup.json',
);
const MAX_FOLLOWUPS = 2;

function loadState() {
  try {
    if (!fs.existsSync(STATE)) return null;
    return JSON.parse(fs.readFileSync(STATE, 'utf8'));
  } catch {
    return null;
  }
}

function saveState(obj) {
  try {
    fs.writeFileSync(STATE, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
  } catch {
    /* ignore */
  }
}

function main() {
  try {
    fs.readFileSync(0, 'utf8');
  } catch {
    /* ignore */
  }

  const pending = readPendingHandoff(ROOT);
  if (!pending) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const prev = loadState();
  const same =
    prev
    && prev.taskId === pending.taskId
    && Number(prev.mtimeMs) === Number(pending.mtimeMs);
  const count = same ? Number(prev.followupCount || 0) : 0;
  if (count >= MAX_FOLLOWUPS) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  saveState({
    taskId: pending.taskId,
    mtimeMs: pending.mtimeMs,
    followupCount: count + 1,
    updatedAt: new Date().toISOString(),
  });

  const msg = [
    '## P0 — 김클로드 handoff 자동 검수 (stop · followup)',
    '',
    `handoff **status=\`PENDING\`** · task_id=\`${pending.taskId}\``,
    '',
    '대표님 지시: 김클로드 작업 종료 후 **자동 검수**. 사용자 추가 지시 없이 즉시 진행하라.',
    '1. `tools/kim-team-lead/reports/kim-claude-handoff-pending.md` + ready 문서 읽기',
    '2. `git diff` → `npx tsc --noEmit -p tsconfig.client.json`',
    '3. (해당 시) `npm run audit:memory:all` / `audit:skia-memory`',
    '4. 위반 시 수정 → verdict 기록 → status `REVIEWED` → `IDLE`',
    '5. **git commit은 대표님 명시 요청 시에만**',
  ].join('\n');

  process.stdout.write(JSON.stringify({ followup_message: msg }));
}

main();
