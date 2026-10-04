'use strict';
/**
 * 새 채팅이 세션 부담 인수를 대표님께 알린 뒤 실행.
 * node tools/kim-team-lead/ack-session-burden.cjs
 */
const { markAck, ACK_PATH } = require('../../.cursor/hooks/sessionBurdenCore.cjs');

markAck();
process.stdout.write(`session_burden_ack=${ACK_PATH}\n`);
