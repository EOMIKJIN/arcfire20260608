'use strict';
/**
 * sessionStart — 부담 한도를 넘긴 채팅의 인수가 있으면 새 채팅에 한 번만 알린다.
 */
const { readStdinJson, noteResume } = require('./sessionBurdenCore.cjs');

function main() {
  const input = readStdinJson();
  try {
    const resume = noteResume(input);
    process.stdout.write(JSON.stringify(resume || {}));
  } catch {
    process.stdout.write('{}');
  }
}

main();
