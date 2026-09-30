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
const PLAYBOT_PENDING = path.join(ROOT, 'tools', 'play-bot-console', 'logs', 'PLAYBOT_CHAT_REPORT_PENDING.md');
const PLAYBOT_ACK = path.join(ROOT, 'tools', 'play-bot-console', 'logs', 'PLAYBOT_CHAT_REPORT_PENDING.ack.md');

function readStdinJson() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return {};
  }
}

function isAckedForPending(ackPath, pendingMtimeMs) {
  try {
    if (!fs.existsSync(ackPath)) return false;
    const ackMtime = fs.statSync(ackPath).mtimeMs;
    return ackMtime >= pendingMtimeMs;
  } catch {
    return false;
  }
}

function readLivePending(file, ackPath) {
  if (!fs.existsSync(file)) return '';
  try {
    const pendingMtime = fs.statSync(file).mtimeMs;
    const pending = fs.readFileSync(file, 'utf8').trim();
    if (!pending || isAckedForPending(ackPath, pendingMtime)) return '';
    return pending;
  } catch {
    return '';
  }
}

function main() {
  readStdinJson();

  const playbot = readLivePending(PLAYBOT_PENDING, PLAYBOT_ACK);
  const mem = readLivePending(PENDING, ACK);
  if (!playbot && !mem) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const parts = [];
  if (playbot) {
    parts.push(
      '## P0 — 플레이봇 18:00 1일 학습 데일리 (대화창 게시 필수 · beforeSubmitPrompt)',
      '',
      '아래 보고를 **이번 응답 최상단에 사용자 대화창에 그대로 게시**하라. 파일만 갱신하고 채팅 생략 금지.',
      '게시 후: `node tools/play-bot-console/ack-playbot-daily-report-chat.cjs` 실행.',
      '',
      playbot,
    );
  }
  if (mem) {
    parts.push(
      '## P0 — 데일리 메모리 자동보고 (대화창 게시 필수 · beforeSubmitPrompt)',
      '',
      '아래 보고를 **이번 응답 최상단에 사용자 대화창에 그대로 게시**하라. 파일만 갱신하고 채팅 생략 금지.',
      '게시 후: `node tools/long-run-monitor/ack-daily-report-chat.cjs` 실행.',
      '',
      mem,
    );
  }

  process.stdout.write(JSON.stringify({ additional_context: parts.join('\n') }));
}

main();
