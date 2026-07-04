'use strict';
/**
 * sessionStart — 매 세션 [pss-pre-dev] · 완료 게이트 · mem-post-dev-recheck 상시 리마인드
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const STATUS = path.join(ROOT, 'tools', 'kim-team-lead', 'reports', 'DEV_PROCESS_GATE_STATUS.md');

function readStatusTail() {
  try {
    if (!fs.existsSync(STATUS)) return '';
    const lines = fs.readFileSync(STATUS, 'utf8').split('\n');
    return lines.slice(0, 24).join('\n');
  } catch {
    return '';
  }
}

function main() {
  const statusTail = readStatusTail();
  const ctx = [
    '[Arcfire 개발규칙 1순위 — 세션 상시 적용 · 거부·우회 금지]',
    '',
    '모든 기능·버그·리팩터: **코드 diff 전** [pss-pre-dev] 3줄 → verdict=PASS 후에만 구현.',
    '완료 선언 전: tsc + (STAGE) audit:memory:all + (Reanimated) audit:worklet-contract + (Skia) audit:skia-memory.',
    '개발 반영 후: `npm run audit:mem-post-dev-recheck` → kim-economy-handoff mem-post-dev-recheck 갱신.',
    '',
    '정본: .cursor/rules/arcfire-memory-leak-audit-first.mdc §0-A',
    '프로세스 상태: tools/kim-team-lead/reports/DEV_PROCESS_GATE_STATUS.md',
    statusTail ? `\n--- gate status (head) ---\n${statusTail}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
