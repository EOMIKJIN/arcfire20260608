'use strict';
/**
 * preCompact — 컨텍스트 압축 직전. 사용자에게 고지(user_message). 압축은 막지 않는다.
 */
const { readStdinJson, noteCompact } = require('./sessionBurdenCore.cjs');

function main() {
  const input = readStdinJson();
  try {
    const notice = noteCompact(input);
    process.stdout.write(JSON.stringify(notice || {}));
  } catch {
    process.stdout.write('{}');
  }
}

main();
