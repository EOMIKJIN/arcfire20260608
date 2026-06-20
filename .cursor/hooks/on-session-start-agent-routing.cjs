'use strict';
/**
 * sessionStart — 김팀장(단일 지휘) · 김경제(감시 전용) · Auto 페르소나 라우팅
 * 정본: arcfire-main-lead-agent.mdc · gemini-code-agent-routing.mdc · arcfire-economy-specialist-agent.mdc
 */
const fs = require('fs');
const { resolveActivePersona, writeBadge, buildAgentContext } = require('./agentRoutingCore.cjs');

const ROUTING_CONTEXT = [
  '[Arcfire Agent Team — 2026-06-19 단일 지휘]',
  '★ 사용자 작업 지시: **김팀장 세션(본 대화)만**. 김경제 대화창에 코드·기능 지시 금지(충돌 방지).',
  '김팀장 (@김팀장): 개발·경제·UI·Skia·버그 **전 코드** + 김경제 관측 검토·조치.',
  '김경제 (@김경제): **김팀장이 별도 세션/Task로만 배정** — 감시·audit:balance-ops 점검·리포트. **코드 수정 금지.**',
  '페르소나: 김팀장→Opus(경제 코드 포함) | 김경제→감시만 | Fable→tables | Sonnet→logcat/tsc.',
  '',
  '※ 김경제 주업무 — [기본 장기앱 실행 테스트]:',
  '  - start-watch-30m.ps1 멱등 가동(30분 meminfo + crash logcat).',
  '  - 이상 탐지 → incident handoff → **김팀장 인계**(김경제는 자동조치·코드 수정 안 함).',
  '  - 정본: tools/long-run-monitor/logs/WATCH_README.md',
  '',
  '※ 페르소나 확인: tools/kim-team-lead/reports/ACTIVE_AGENT_BADGE.md',
  '※ 세션 잠금: .cursor/session-persona-lock.json',
].join('\n');

function main() {
  let stdin = '';
  try {
    stdin = fs.readFileSync(0, 'utf8');
  } catch {
    stdin = '';
  }
  void stdin;

  const active = resolveActivePersona('');
  writeBadge(active, '');
  const personaLine = buildAgentContext(active);

  process.stdout.write(
    JSON.stringify({
      additional_context: `${ROUTING_CONTEXT}\n\n${personaLine}`,
    }),
  );
}

main();
