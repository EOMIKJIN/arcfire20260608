'use strict';
/** 김팀장 incident 조사·수정 완료 후 핸드오프 제거 */
const fs = require('fs');
const path = require('path');

const OUTBOX = path.join(__dirname, 'outbox');
const HANDOFF = path.join(OUTBOX, 'cursor-incident-handoff.md');
const ACK = path.join(OUTBOX, 'incident-handoff-acked-at.txt');
const REFIX = path.join(__dirname, 'logs', 'gl-leak-refix-requested.flag');

try {
  if (fs.existsSync(HANDOFF)) fs.unlinkSync(HANDOFF);
} catch {
  /* ignore */
}
try {
  if (fs.existsSync(REFIX)) fs.unlinkSync(REFIX);
} catch {
  /* ignore */
}
const TRIGGER = path.join(__dirname, '../../.cursor/trigger-incident-auto-fix.json');
try {
  if (fs.existsSync(TRIGGER)) fs.unlinkSync(TRIGGER);
} catch {
  /* ignore */
}
fs.mkdirSync(OUTBOX, { recursive: true });
fs.writeFileSync(ACK, new Date().toISOString(), 'utf8');
process.stdout.write('incident handoff acked\n');
