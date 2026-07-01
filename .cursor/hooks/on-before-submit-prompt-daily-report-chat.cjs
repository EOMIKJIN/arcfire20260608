'use strict';
/**
 * beforeSubmitPrompt — 08:00/17:00 자동보고 CHAT_REPORT_PENDING → **기존 대화창**에도 주입.
 * sessionStart만으로는 밤새 연 채팅에 8시 보고가 안 올라오는 회귀 방지.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, 'tools', 'long-run-monitor', 'logs');
const PENDING = path.join(LOG_DIR, 'CHAT_REPORT_PENDING.md');
const ACK = path.join(LOG_DIR, 'CHAT_REPORT_PENDING.ack.md');

function readStdinJson() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

function isAckedForPending(pendingMtimeMs) {
  try {
    if (!fs.existsSync(ACK)) return false;
    const ackMtime = fs.statSync(ACK).mtimeMs;
    return ackMtime >= pendingMtimeMs;
  } catch {
    return false;
  }
}

function main() {
  readStdinJson();

  if (!fs.existsSync(PENDING)) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  let pendingMtime = 0;
  let pending = '';
  try {
    pendingMtime = fs.statSync(PENDING).mtimeMs;
    pending = fs.readFileSync(PENDING, 'utf8').trim();
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  if (!pending || isAckedForPending(pendingMtime)) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const ctx = [
    '## P0 — 데일리 메모리 자동보고 (대화창 게시 필수 · beforeSubmitPrompt)',
    '',
    '아래 보고를 **이번 응답 최상단에 사용자 대화창에 그대로 게시**하라. 파일만 갱신하고 채팅 생략 금지.',
    '게시 후: `node tools/long-run-monitor/ack-daily-report-chat.cjs` 실행.',
    '',
    pending,
  ].join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
