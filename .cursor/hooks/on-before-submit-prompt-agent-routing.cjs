]'use strict';
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
