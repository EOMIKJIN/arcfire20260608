'use strict';
/**
 * sessionStart — 유료 Claude 전용 · Composer/Cursor 폴백 개발 배제
 */
const fs = require('fs');
const { buildPaidModelGateContext } = require('./paidModelGateCore.cjs');

function main() {
  try {
    fs.readFileSync(0, 'utf8');
  } catch {
    /* ignore stdin */
  }

  process.stdout.write(
    JSON.stringify({
      additional_context: buildPaidModelGateContext(),
    }),
  );
}

main();
