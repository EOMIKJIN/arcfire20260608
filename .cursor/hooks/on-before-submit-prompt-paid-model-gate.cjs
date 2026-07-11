'use strict';
/**
 * beforeSubmitPrompt — 유료 Claude 전용 · Composer/Cursor 폴백 개발 배제
 */
const { readStdinJson } = require('./agentRoutingCore.cjs');
const {
  buildPaidModelGateContext,
  buildPaidModelUserAlert,
} = require('./paidModelGateCore.cjs');

function main() {
  readStdinJson();

  process.stdout.write(
    JSON.stringify({
      additional_context: buildPaidModelGateContext(),
      user_message: buildPaidModelUserAlert(),
    }),
  );
}

main();
