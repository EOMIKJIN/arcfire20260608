'use strict';
/**
 * sessionStart — 김클로드 handoff가 PENDING이면 Cursor 세션에 「검수 대기 · 검수자=김플레이」만 알린다.
 * 2026-10-09 조직 개편: 검수·커밋은 메인리더 김플레이. Cursor(김팀장 · UI 팀원)는 검수·커밋하지 않는다.
 */
const path = require('path');
const { readPendingHandoff } = require('./kimClaudeHandoffCore.cjs');

const ROOT = path.join(__dirname, '..', '..');

function main() {
  const pending = readPendingHandoff(ROOT);
  if (!pending) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const ctx = [
    '[김클로드 handoff · PENDING · 검수자 = 메인리더 김플레이]',
    '',
    `task_id=${pending.taskId} 가 김플레이 검수 대기 중이다.`,
    '이 Cursor 세션(김팀장 · UI 팀원)은 이 handoff 를 검수·수정·커밋하지 않는다. 해당 파일을 동시에 고치지 않는다.',
    '정본: .cursor/rules/arcfire-main-lead-agent.mdc §팀원 산출물 → 김플레이 검수 게이트',
  ].join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
