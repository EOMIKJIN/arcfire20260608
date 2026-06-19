'use strict';
/**
 * sessionStart — 김팀장(메인) · 김경제(팀원) · Auto 페르소나 라우팅 리마인더
 *   + [김경제 메모리 테스트] 자동 1순위·상시 주업무 선언
 * 정본: arcfire-main-lead-agent.mdc · gemini-code-agent-routing.mdc (alwaysApply)
 *        arcfire-economy-specialist-agent.mdc (메모리 감시) · AGENTS.md
 */
const fs = require('fs');

const ROUTING_CONTEXT = [
  '[Arcfire Agent Team]',
  '메인·총괄: 김팀장 (@김팀장) — 개발 총괄 + 김경제 산출물 1일 1회 검수·최종 연동 (npm run audit:team-lead:daily · docs/KIM_TEAM_ECONOMY_WORKFLOW.md).',
  '팀원: 김경제 (@김경제) — 경제·밸런스 구축·테스트 → tools/kim-team-lead/reports/kim-economy-handoff.md 제출.',
  '페르소나·model: 김경제→claude-fable-5-thinking-high | Fable→tables/무기곡선 | Opus→arcCore·UI·Skia·기본 | Sonnet→logcat/tsc.',
  'Skia P0: arcfire-skia-memory-lifecycle.mdc. 크래시: arcfire-bug-debug-workflow.',
  '',
  '※ #1 자동 시작·상시 — [기본 장기앱 실행 테스트]:',
  '  - Cursor 세션이 켜지면 별도 지시 없이 start-watch-30m.ps1 만 멱등 가동(30분 meminfo + crash logcat).',
  '  - 전투 soak·floor 전용 샘플러 등 부가 테스트는 실행하지 않는다.',
  '  - 비정상종료·비정상 재시작·메모리 이상 시 apply-auto-remediation → audit:skia-memory + 앱 재기동 + 사후 VERIFY.',
  '  - VERIFY 실패·반복 크래시는 outbox/cursor-incident-handoff.md → 김팀장 P0 코드 수정·tsc·ack.',
  '  - 정본: tools/long-run-monitor/logs/WATCH_README.md · arcfire-economy-specialist-agent.mdc.',
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
