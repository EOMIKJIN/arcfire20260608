'use strict';

const fs = require('fs');
const path = require('path');

const pending = path.join(__dirname, 'logs', 'PLAYBOT_CHAT_REPORT_PENDING.md');
const ack = path.join(__dirname, 'logs', 'PLAYBOT_CHAT_REPORT_PENDING.ack.md');

try {
  if (!fs.existsSync(pending)) {
    console.log('playbot_chat_ack=none');
    process.exit(0);
  }
  fs.renameSync(pending, ack);
  console.log('playbot_chat_ack=ok');
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
