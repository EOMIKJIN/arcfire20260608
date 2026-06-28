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
  '김팀장 (@김팀장): 개발·경제·UI·Skia·버그 **전 코드** + 김경제 관측·**retention 프로파일** 검토→조치.',
  '김경제 (@김경제): **김팀장이 별도 세션/Task로만 배정** — 감시·audit:balance-ops 점검·리포트. **코드 수정 금지.**',
  '  **개발 업데이트 시 무조건**: mem-timeline·crash·retention **즉각 재검수** → handoff `mem-post-dev-recheck` 보고(같은 턴).',
  '페르소나: 김팀장→Opus(경제 코드 포함) | 김경제→감시만 | Fable→tables | Sonnet→logcat/tsc.',
  '',
  '※ 김경제 주업무 — [영구 실시간 탐지 → 김팀장 handoff P0]:',
  '  - perpetual watchdog (5m): PC/게임/Cursor 재시작 후에도 ensure-perpetual-watchdog 자동 재가동.',
  '  - npm run monitor:register-perpetual — Windows 로그온·5m 백업 (1회 등록).',
  '  - 15m mem · report-watch=timeline(no dumpsys) · 5m incident poll(log only).',
  '  - **앱 무영향**: adb dumpsys≥15m · logcat 1개 · release MEM_PROFILE=off · MONITOR_APP_ZERO_IMPACT.md',
  '  - 정본: WATCH_README.md §영구 실시간 탐지',
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
