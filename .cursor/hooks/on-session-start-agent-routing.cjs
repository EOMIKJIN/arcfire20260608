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
  '※ #1 자동 시작·상시 주업무 — [김경제 메모리 테스트]:',
  '  - Cursor 세션이 켜지면 다른 작업보다 먼저, 별도 지시 없이 자동으로 1순위로 시작해 상시 수행한다(김경제 감시 역할).',
  '  - 절차(멱등): 1) tools/long-run-monitor/logs/watch-30m.pid 와 프로세스 생존 확인 → 죽었으면 start-watch-30m.ps1 재가동.',
  '    2) 신규 크래시 감시(adb logcat libc:F "Fatal signal") 가동. 3) 전투/전환 메모리 floor(native heap·GL·PSS) 주기 샘플 → leak vs high-water 판정.',
  '  - 정본: arcfire-economy-specialist-agent.mdc(메모리 감시) · tools/long-run-monitor/logs/WATCH_README.md.',
  '  - 보고: GL 계단식 누수·native heap creep·크래시 탐지 시 즉시 요약·인계(원인 코드 수정은 김팀장). 개발 작업과 독립으로 항시 병행.',
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
