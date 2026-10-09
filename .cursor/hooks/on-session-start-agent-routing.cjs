'use strict';
/**
 * sessionStart — 메인리더 김플레이 체제(2026-10-09~) · 김팀장(UI 팀원) · 김경제(감시 전용) · Auto 페르소나 라우팅
 * 정본: arcfire-main-lead-agent.mdc · gemini-code-agent-routing.mdc · arcfire-economy-specialist-agent.mdc
 */
const fs = require('fs');
const { resolveActivePersona, writeBadge, buildAgentContext } = require('./agentRoutingCore.cjs');

const { buildPaidModelGateContext } = require('./paidModelGateCore.cjs');

const ROUTING_CONTEXT = [
  '[Arcfire Agent Team — 2026-10-09 조직 개편 (대표님 1순위 지시)]',
  buildPaidModelGateContext(),
  '★ **사용자 호칭(2026-07-05~ 전체 팀 공지)**: 사용자 = **「대표님」** — 한국어 응답·handoff·리포트 전원 동일. 정본: arcfire-user-addressing.mdc',
  '★ **김플레이 = 메인리더**(Claude Code · 전 영역 개발·최종 검수·유일 커밋) · **김클로드 = 서브리더** · **김팀장·김경제·Fable = 팀원**.',
  '김팀장 (@김팀장 · 이 Cursor 세션): **UI `.tsx`·간단한 서브작업만** — 김플레이 배정분. Skia 루프·STAGE·arcCore·일일배치·메모리 구조·크래시 근본 수정은 **하지 않고** kim-team-lead-*.md 로 김플레이에게 넘긴다. **커밋 금지.**',
  'Fable (@Fable · @페이블): **Table-First 구현** — tables/·시드·점유·카탈로그·registry (김플레이 배정 · 커밋은 김플레이).',
  '김경제 (@김경제): **김플레이 배정** — 감시·audit:balance-ops 점검·리포트. **코드 수정 금지.**',
  '  **개발 업데이트 시 무조건**: mem-timeline·crash·retention **즉각 재검수** → handoff `mem-post-dev-recheck` 보고(같은 턴).',
  '  **코드 diff 전 무조건**: [pss-pre-dev] 3줄 — arcfire-memory-leak-audit-first.mdc §0-A (beforeSubmitPrompt hook 주입).',
  '페르소나: 김팀장→UI·서브작업 | Fable→Table-First 구현 | 김경제→감시만 | Sonnet→logcat 분석 | 런타임 대형 수정→김플레이.',
  '',
  '※ 김경제 주업무 — [영구 실시간 탐지 → 김플레이 handoff P0]:',
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
