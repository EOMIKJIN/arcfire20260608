'use strict';
/**
 * 데일리 커밋/푸시 실패 → 모니터 CHAT_REPORT_PENDING (스케줄러 result!=0 통보)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const MONITOR_LOG = path.join(ROOT, 'tools', 'long-run-monitor', 'logs');
const PENDING = path.join(MONITOR_LOG, 'CHAT_REPORT_PENDING.md');
const LOCAL_FAIL = path.join(__dirname, 'logs', 'FAILURE_PENDING.md');

function kstNow() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace('T', ' ');
}

function tailLog() {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  const logFile = path.join(__dirname, 'logs', `${day}.log`);
  try {
    return fs.readFileSync(logFile, 'utf8').trim().split(/\r?\n/).slice(-12).join('\n');
  } catch {
    return '(no daily-commit log)';
  }
}

function main() {
  const code = process.argv[2] || '?';
  const kst = kstNow();
  const tail = tailLog();
  const body = [
    '# [데일리 커밋 실패] Arcfire 자정 스냅샷 → 김팀장 P0',
    '',
    `**시각 (KST)**: ${kst}`,
    `**exit**: \`${code}\``,
    '',
    '자정 `ArcfireOnline_DailyCommit` 이 commit 또는 `git push` 에 실패했습니다.',
    '수동 push로 대체하지 말고 `npm run audit:daily-commit-process` 후 파이프라인을 고치십시오.',
    '',
    '| 항목 | 경로 |',
    '|------|------|',
    '| 스케줄러 | `ArcfireOnline_DailyCommit` |',
    '| 스크립트 | `tools/daily-commit/run-daily-commit.cjs` |',
    '| 로그 | `tools/daily-commit/logs/` |',
    '',
    '## 최근 로그',
    '```',
    tail,
    '```',
    '',
  ].join('\n');

  fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
  fs.writeFileSync(LOCAL_FAIL, body, 'utf8');
  fs.mkdirSync(MONITOR_LOG, { recursive: true });
  fs.writeFileSync(PENDING, body, 'utf8');
  process.stdout.write(`daily_commit_failure_pending=${PENDING}\n`);
}

main();
