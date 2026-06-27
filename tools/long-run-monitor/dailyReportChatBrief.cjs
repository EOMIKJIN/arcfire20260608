'use strict';

const fs = require('fs');
const path = require('path');

const CHAT_PENDING = 'CHAT_REPORT_PENDING.md';

function writeChatReportPending(logDir, payload) {
  const {
    slot,
    kstLabel,
    verdict,
    memLine,
    reportFile,
    highlights = [],
    rec,
    adbOk,
    watchPid,
  } = payload;

  const hl = highlights.length ? highlights.map((h) => `- ${h}`).join('\n') : '- (특이사항 없음)';

  const body = [
    `# [${slot}] Arcfire 메모리 감시 자동보고`,
    '',
    `**시각 (KST)**: ${kstLabel}`,
    `**판정**: **${verdict}**`,
    '',
    '| 항목 | 값 |',
    '|------|-----|',
    `| adb | ${adbOk ? '연결됨' : '**미연결**'} |`,
    `| watch-30m | PID ${watchPid ?? '?'} |`,
    `| 런타임 | ${memLine} |`,
    `| 상세 파일 | \`${reportFile}\` |`,
    '',
    '## 요약',
    hl,
    '',
    '## 권장 (김팀장 1안)',
    rec,
    '',
    '---',
    '**P0**: 김경제·김팀장 — 이 보고를 **사용자 Cursor 대화창에 즉시 게시**할 것. handoff/파일만 쓰고 채팅 생략 **금지**.',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(logDir, CHAT_PENDING), body, 'utf8');
  return path.join(logDir, CHAT_PENDING);
}

function readChatReportPending(logDir) {
  const p = path.join(logDir, CHAT_PENDING);
  if (!fs.existsSync(p)) return null;
  try {
    return fs.readFileSync(p, 'utf8').trim();
  } catch {
    return null;
  }
}

function ackChatReportPending(logDir) {
  const p = path.join(logDir, CHAT_PENDING);
  if (!fs.existsSync(p)) return;
  try {
    const ack = p.replace('.md', '.ack.md');
    fs.renameSync(p, ack);
  } catch {
    try {
      fs.unlinkSync(p);
    } catch {
      /* ignore */
    }
  }
}

module.exports = {
  CHAT_PENDING,
  writeChatReportPending,
  readChatReportPending,
  ackChatReportPending,
};
