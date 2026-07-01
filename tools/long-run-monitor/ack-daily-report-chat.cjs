'use strict';
/** 데일리 CHAT_REPORT_PENDING 채팅 게시 완료 ack */
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
const PENDING = path.join(LOG_DIR, 'CHAT_REPORT_PENDING.md');
const ACK = path.join(LOG_DIR, 'CHAT_REPORT_PENDING.ack.md');

try {
  if (fs.existsSync(PENDING)) {
    const body = fs.readFileSync(PENDING, 'utf8');
    fs.writeFileSync(ACK, `# ack ${new Date().toISOString()}\n\n${body}`, 'utf8');
    fs.unlinkSync(PENDING);
  }
} catch {
  /* ignore */
}

process.stdout.write('daily report chat pending acked\n');
