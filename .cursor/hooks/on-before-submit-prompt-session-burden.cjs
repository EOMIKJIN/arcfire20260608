'use strict';
/**
 * beforeSubmitPrompt — 대화 기록이 커지면 한 버킷당 한 번만 고지.
 * 평소에는 빈 JSON. 매 프롬프트 문맥 주입 금지.
 */
const { readStdinJson, noteTranscript, noteResume } = require('./sessionBurdenCore.cjs');

function main() {
  const input = readStdinJson();
  try {
    const burden = noteTranscript(input);
    if (burden) {
      process.stdout.write(JSON.stringify(burden));
      return;
    }
    const resume = noteResume(input);
    process.stdout.write(JSON.stringify(resume || {}));
  } catch {
    process.stdout.write('{}');
  }
}

main();
