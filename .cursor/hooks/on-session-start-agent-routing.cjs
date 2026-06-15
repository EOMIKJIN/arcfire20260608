'use strict';
/**
 * sessionStart — 김팀장(메인) · 김경제(팀원) · Auto 페르소나 라우팅 리마인더
 * 정본: arcfire-main-lead-agent.mdc · gemini-code-agent-routing.mdc (alwaysApply)
 */
const fs = require('fs');

const ROUTING_CONTEXT = [
  '[Arcfire Agent Team]',
  '메인·총괄: 김팀장 (@김팀장) — 개발 총괄 + 김경제 산출물 1일 1회 검수·최종 연동 (npm run audit:team-lead:daily · docs/KIM_TEAM_ECONOMY_WORKFLOW.md).',
  '팀원: 김경제 (@김경제) — 경제·밸런스 구축·테스트 → tools/kim-team-lead/reports/kim-economy-handoff.md 제출.',
  '페르소나·model: 김경제→claude-fable-5-thinking-high | Fable→tables/무기곡선 | Opus→arcCore 비경제 | Sonnet→logcat/tsc | Composer→UI·기본.',
  'Skia P0: arcfire-skia-memory-lifecycle.mdc. 크래시: arcfire-bug-debug-workflow.',
  '장기 감시(상시): tools/long-run-monitor start-watch-30m.ps1 — mem-timeline·GL 계단식·자동 remediation. 개발 작업과 독립 유지.',
].join('\n');

function main() {
  let stdin = '';
  try {
    stdin = fs.readFileSync(0, 'utf8');
  } catch {
    stdin = '';
  }
  void stdin;

  process.stdout.write(JSON.stringify({ additional_context: ROUTING_CONTEXT }));
}

main();
