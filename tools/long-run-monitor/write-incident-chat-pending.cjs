'use strict';
/** incident handoff → Cursor 채팅 P0 게시용 CHAT_REPORT_PENDING.md */
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
const HANDOFF = path.join(__dirname, 'outbox', 'cursor-incident-handoff.md');
const PENDING = path.join(LOG_DIR, 'CHAT_REPORT_PENDING.md');

function tail(file, n = 5) {
  try {
    return fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-n)
      .join('\n');
  } catch {
    return '';
  }
}

function main() {
  const reason = process.argv[2] || 'incident_detected';
  const kst = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace('T', ' ');

  let handoffExcerpt = '';
  if (fs.existsSync(HANDOFF)) {
    handoffExcerpt = fs.readFileSync(HANDOFF, 'utf8').slice(0, 2500);
  }

  const incidents = tail(path.join(LOG_DIR, 'incidents.log'), 6);
  const remediation = tail(path.join(LOG_DIR, 'remediation.log'), 4);

  const body = [
    '# [실시간 이상] Arcfire 자동탐지 → 김팀장 P0',
    '',
    `**시각 (KST)**: ${kst}`,
    `**사유**: \`${reason}\``,
    '',
    '| 항목 | 경로 |',
    '|------|------|',
    '| incident handoff | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` |',
    '| Cursor 트리거 | `.cursor/trigger-incident-auto-fix.json` |',
    '',
    '## 최근 incidents',
    '```',
    incidents || '(empty)',
    '```',
    '',
    '## 최근 remediation',
    '```',
    remediation || '(empty)',
    '```',
    '',
    '## 권장 (김팀장 즉시)',
    '1. logcat·mem-timeline 근거 원인 특정 → 코드 수정 → tsc',
    '2. 완료: `node tools/long-run-monitor/ack-incident-handoff.cjs`',
    '',
    '---',
    '**P0**: 김팀장 — **사용자 Cursor 대화창에 즉시 게시** + handoff 기반 코드 조치. 파일만 남기고 채팅 생략 **금지**.',
    '',
    '--- handoff excerpt ---',
    handoffExcerpt || '(handoff not packed yet)',
    '',
  ].join('\n');

  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(PENDING, body, 'utf8');
  process.stdout.write(`chat_pending=${PENDING}\n`);
}

main();
