'use strict';
/**
 * stop — 김클로드 handoff 자동 검수 followup (Cursor 세션용).
 *
 * 2026-10-09 조직 개편(대표님 1순위 지시): 검수·커밋은 메인리더 김플레이(Claude Code)만 한다.
 * Cursor(김팀장 · UI 팀원) 세션은 김클로드 handoff 를 자동 검수하지 않는다 → followup 을 내지 않는다.
 * 이전 동작(2026-07-26 「김클로드 작업이 끝나면 자동 검수」)은 김플레이 세션이 맡는다.
 */
const fs = require('fs');

function main() {
  try {
    fs.readFileSync(0, 'utf8');
  } catch {
    /* ignore */
  }
  process.stdout.write(JSON.stringify({}));
}

main();
