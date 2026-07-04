'use strict';
/**
 * beforeSubmitPrompt — 기능·버그·코드 수정 요청 시 [pss-pre-dev] 1차 검수 의무 컨텍스트 주입
 * 정본: .cursor/rules/arcfire-memory-leak-audit-first.mdc §0-A
 */
const { readStdinJson } = require('./agentRoutingCore.cjs');

function extractPrompt(input) {
  if (!input || typeof input !== 'object') return '';
  if (typeof input.prompt === 'string') return input.prompt;
  if (typeof input.text === 'string') return input.text;
  if (typeof input.message === 'string') return input.message;
  return '';
}

/** 감시·리포트·규칙 확인만 — 코드 diff 불필요 */
function isNonCodeOpsRequest(text) {
  const t = String(text || '');
  return (
    /^(npm run audit|audit:)/i.test(t.trim())
    || /감시\s*만|점검\s*만|리포트\s*만|handoff\s*만|코드\s*수정\s*금지/i.test(t)
    || /데일리\s*08:00|overnight-final-report/i.test(t)
  );
}

/** src/app/tables·STAGE·Skia·arcCore·버그 수정 맥락 */
function isDevCodeChangeRequest(text) {
  const t = String(text || '');
  if (!t.trim()) return false;
  if (isNonCodeOpsRequest(t)) return false;
  return (
    /구현|개발|수정|추가|제거|리팩|refactor|fix|bug|버그|패치|연동|마이그/i.test(t)
    || /worldmap|planet\.tsx|combat|skia|reanimated|worklet|arcCore|overlay|STAGE/i.test(t)
    || /tables\/|\.tsx|\.ts|store|tick|persist|memo|dispose|Navigation\.replace/i.test(t)
    || /메모리|누수|pss|retention|크래시|sigsegv|검은\s*화면|로딩\s*고착/i.test(t)
    || /행성개발|planet\s*dev|economy|daily\s*ops/i.test(t)
    || /프로세스|대응\s*작업|완벽|개발규칙|메모리\s*누수/i.test(t)
  );
}

function buildPssPreDevGateContext() {
  return [
    '[Arcfire 개발규칙 1순위 — PSS·메모리 1차 검수 · 코드 diff 전 의무]',
    '',
    '**첫 code diff 전** 턴에 아래 3줄을 반드시 출력한 뒤 구현 착수:',
    '  [pss-pre-dev] hot_path=<빈도> alloc=<틱·루프 신규 객체> cache=<키·invalidate>',
    '  [pss-pre-dev] stage=<STAGE dispose·replace> risk=<P1~P7 해당 번호>',
    '  [pss-pre-dev] verdict=PASS|REDESIGN',
    '',
    'verdict=REDESIGN → 설계 수정·범위 축소 후에만 구현. hot path 선구현 금지.',
    '',
    '**완료 선언 전 게이트**(변경 종류에 맞게):',
    '  · 공통: npx tsc --noEmit -p tsconfig.client.json',
    '  · STAGE·허브·worldmap·store: npm run audit:memory:all',
    '  · Reanimated·worldmap·planet: npm run audit:worklet-contract',
    '  · Skia·Canvas: npm run audit:skia-memory + GL mtrack Δ ±15MB 안내',
    '  · arcCore·경제: audit:balance-ops · onBoot 동기 전행성 패스 금지',
    '',
    '**개발 반영 후**: `npm run audit:mem-post-dev-recheck` → handoff `mem-post-dev-recheck` 갱신.',
    '정본: .cursor/rules/arcfire-memory-leak-audit-first.mdc §0-A',
  ].join('\n');
}

function main() {
  const input = readStdinJson();
  const prompt = extractPrompt(input);
  if (!isDevCodeChangeRequest(prompt)) {
    process.stdout.write(JSON.stringify({}));
    return;
  }
  process.stdout.write(JSON.stringify({ additional_context: buildPssPreDevGateContext() }));
}

main();
