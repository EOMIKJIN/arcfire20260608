'use strict';
/**
 * beforeSubmitPrompt — 페르소나 자동 분류 · 배지 갱신 · 사용자 알림
 */
const {
  readStdinJson,
  resolveActivePersona,
  writeBadge,
  buildAgentContext,
  buildUserAlert,
} = require('./agentRoutingCore.cjs');
// 모델 게이트 문구는 on-before-submit-prompt-paid-model-gate.cjs 가 단독 출력.
// 여기서도 붙이면 매 프롬프트 문맥·사용자 메시지가 2회 중복(2026-10-04 PC 성능 점검).

function main() {
  const input = readStdinJson();
  const promptText = extractPrompt(input);
  const active = resolveActivePersona(promptText);
  writeBadge(active, promptText);
  const userAlert = buildUserAlert(active, promptText);

  process.stdout.write(
    JSON.stringify({
      additional_context: buildAgentContext(active),
      user_message: userAlert,
    }),
  );
}

function extractPrompt(input) {
  if (!input || typeof input !== 'object') return '';
  if (typeof input.prompt === 'string') return input.prompt;
  if (typeof input.text === 'string') return input.text;
  if (typeof input.message === 'string') return input.message;
  return '';
}

main();
