'use strict';
/**
 * beforeSubmitPrompt — 김클로드 handoff status=PENDING 이면 Cursor 세션에 충돌 방지 알림만 주입.
 * 2026-10-09 조직 개편: 검수·커밋은 메인리더 김플레이(Claude Code). Cursor(김팀장 · UI 팀원)는 자동 검수하지 않는다.
 */
const fs = require('fs');
const { readPendingHandoff } = require('./kimClaudeHandoffCore.cjs');

const ROOT = process.cwd();

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

  const ctx = [
    `[김클로드 handoff PENDING · task_id=${pending.taskId} · 검수자 = 김플레이]`,
    '이 세션은 그 handoff 를 검수·커밋하지 않는다. handoff 가 건드린 파일을 동시에 수정하지 않는다.',
  ].join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
