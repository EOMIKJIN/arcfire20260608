'use strict';
/**
 * sessionStart — 김클로드 handoff가 PENDING이면 김팀장 세션에 검수 의무 주입
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const HANDOFF = path.join(
  ROOT,
  'tools',
  'kim-team-lead',
  'reports',
  'kim-claude-handoff-pending.md',
);

function readPendingSummary() {
  try {
    if (!fs.existsSync(HANDOFF)) return null;
    const text = fs.readFileSync(HANDOFF, 'utf8');
    const statusMatch = text.match(/\*\*status\*\*\s*\|\s*`([^`]+)`/);
    const status = statusMatch ? statusMatch[1].trim() : '';
    if (status !== 'PENDING') return null;
    const lines = text.split('\n').slice(0, 40).join('\n');
    return lines;
  } catch {
    return null;
  }
}

function main() {
  const summary = readPendingSummary();
  if (!summary) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const ctx = [
    '[김클로드 → 김팀장 검수 게이트 · PENDING]',
    '',
    '김클로드(Claude Code) handoff가 **검수 대기** 상태입니다. **커밋·완료 선언 전** 아래 파일을 읽고 diff·audit·계약 위반을 재검수하세요.',
    '정본: tools/kim-team-lead/reports/kim-claude-handoff-pending.md',
    '',
    '필수: git diff → tsc → (해당 시) audit:skia-memory / audit:memory:all → 필요 시 수정 → handoff verdict 기록 → status REVIEWED 후 IDLE.',
    '**git commit은 김팀장(본 세션)만** — 사용자 명시 요청 시에만.',
    '',
    '--- handoff (head) ---',
    summary,
  ].join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
