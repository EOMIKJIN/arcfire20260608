'use strict';
/**
 * sessionStart — 08:00 / 17:00 자동보고가 파일만 남고 채팅에 안 올라오는 회귀 방지.
 * CHAT_REPORT_PENDING.md 가 있으면 에이전트에 **대화창 게시 P0** 주입.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, 'tools', 'long-run-monitor', 'logs');

function readPendingBrief() {
  const pending = path.join(LOG_DIR, 'CHAT_REPORT_PENDING.md');
  if (!fs.existsSync(pending)) return null;
  try {
    return fs.readFileSync(pending, 'utf8').trim();
  } catch {
    return null;
  }
}

function readLatest(pathRel) {
  const p = path.join(LOG_DIR, pathRel);
  if (!fs.existsSync(p)) return '';
  try {
    return fs.readFileSync(p, 'utf8').trim();
  } catch {
    return '';
  }
}

function main() {
  try {
    fs.readFileSync(0, 'utf8');
  } catch {
    /* ignore */
  }

  const parts = [];
  const pending = readPendingBrief();
  if (pending) {
    parts.push(
      '## P0 — 데일리 메모리 보고 (대화창 게시 필수)\n\n' +
        '아래 자동보고를 **이번 세션 첫 응답에서 사용자 대화창에 그대로 게시**하라. 파일만 갱신하고 채팅 생략 금지.\n\n' +
        pending,
    );
  } else {
    const eight = readLatest('DAILY_8AM_REPORT_LATEST.md');
    const five = readLatest('DAILY_5PM_REPORT_LATEST.md');
    if (eight || five) {
      parts.push(
        '## 메모리 감시 최신 요약 (참고)\n\n' +
          (eight ? `### 08:00\n${eight}\n\n` : '') +
          (five ? `### 17:00\n${five}\n` : ''),
      );
    }
  }

  process.stdout.write(JSON.stringify(parts.length ? { additional_context: parts.join('\n\n') } : {}));
}

main();
