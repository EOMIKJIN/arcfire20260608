'use strict';
/**
 * sessionStart — Auto 모드 AI 페르소나·모델 자동 라우팅 리마인더
 * 정본: .cursor/rules/gemini-code-agent-routing.mdc (alwaysApply)
 */
const fs = require('fs');

const ROUTING_CONTEXT = [
  '[Arcfire Auto Agent Routing]',
  '매 턴 사용자 @태그 없이 페르소나·model 자동 선별.',
  'Fable→claude-fable-5-thinking-high (tables/밸런스) | Opus→claude-opus-4-8-thinking-high (arcCore/아키텍처) | Sonnet→claude-4.6-sonnet-medium-thinking (logcat/크래시/tsc) | Composer→composer-2.5-fast (UI·기본 구현).',
  'Skia/Reanimated 고프레임: arcfire-skia-memory-lifecycle.mdc P0 필수(audit:skia-memory+GL mtrack). 크래시/OOM: arcfire-bug-debug-workflow. Task 위임 시 model 열 적용.',
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
