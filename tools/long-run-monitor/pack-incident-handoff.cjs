'use strict';
/**
 * 장기 감시 incident → Cursor 김팀장 자동 조사·수정 핸드오프 패킹.
 * check-and-remediate / apply-auto-remediation 에서 호출.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const LOG_DIR = path.join(__dirname, 'logs');
const OUTBOX = path.join(__dirname, 'outbox');
const HANDOFF = path.join(OUTBOX, 'cursor-incident-handoff.md');
const REFIX_FLAG = path.join(LOG_DIR, 'gl-leak-refix-requested.flag');

function tailLines(filePath, n = 8) {
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
    return lines.slice(-n);
  } catch {
    return [];
  }
}

function readCrashSnippet() {
  try {
    const files = fs
      .readdirSync(LOG_DIR)
      .filter((f) => f.startsWith('crash-') && f.endsWith('.log'))
      .map((f) => ({ f, m: fs.statSync(path.join(LOG_DIR, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (!files.length) return '';
    const raw = fs.readFileSync(path.join(LOG_DIR, files[0].f), 'utf8');
    const hits = raw
      .split(/\r?\n/)
      .filter((l) =>
        /FATAL|SIGSEGV|signal \d+|librnskia|JsiSkImage|AndroidRuntime: FATAL/i.test(l),
      );
    return hits.slice(-25).join('\n') || raw.split(/\r?\n/).slice(-20).join('\n');
  } catch {
    return '';
  }
}

function readTimelineTail(n = 12) {
  const csv = path.join(LOG_DIR, 'mem-timeline.csv');
  try {
    const lines = fs.readFileSync(csv, 'utf8').split(/\r?\n/).filter(Boolean);
    const header = lines[0] || '';
    const body = lines.slice(-n);
    return [header, ...body].join('\n');
  } catch {
    return '';
  }
}

function main() {
  const reason = process.argv[2] || 'unspecified';
  let refix = null;
  try {
    refix = JSON.parse(fs.readFileSync(REFIX_FLAG, 'utf8'));
  } catch {
    /* no refix flag */
  }

  const remediation = tailLines(path.join(LOG_DIR, 'remediation.log'), 12);
  const incidents = tailLines(path.join(LOG_DIR, 'incidents.log'), 6);
  const crash = readCrashSnippet();
  const timeline = readTimelineTail();

  fs.mkdirSync(OUTBOX, { recursive: true });

  const stamp = new Date().toISOString();
  const md = [
    '# Arcfire long-run incident — Kim Team Lead auto-triage',
    '',
    `packedAt: ${stamp}`,
    `triggerReason: ${reason}`,
    refix ? `refixPayload: \`${JSON.stringify(refix)}\`` : 'refixPayload: (none)',
    '',
    '## Mandatory agent action (P0)',
    '',
    '1. `arcfire-bug-debug-workflow.mdc` — logcat/crash·remediation VERIFY FAIL 근거로 원인 특정.',
    '2. Skia·허브·STAGE 관련이면 `arcfire-skia-memory-lifecycle.mdc` + `npm run audit:skia-memory`.',
    '3. 코드 수정 후 `npx tsc --noEmit -p tsconfig.client.json`.',
    '4. 런타임 재확인: `manual-mem-snapshot.ps1` 또는 mem-timeline VERIFY PASS 추이.',
    '5. 완료 시 `node tools/long-run-monitor/ack-incident-handoff.cjs` 실행.',
    '',
    '## Recent remediation',
    '',
    '```',
    remediation.join('\n') || '(empty)',
    '```',
    '',
    '## Recent incidents',
    '',
    '```',
    incidents.join('\n') || '(empty)',
    '```',
    '',
    '## Crash signature (tail)',
    '',
    '```',
    crash || '(no crash snippet)',
    '```',
    '',
    '## mem-timeline (tail)',
    '',
    '```csv',
    timeline || '(empty)',
    '```',
    '',
  ].join('\n');

  fs.writeFileSync(HANDOFF, md, 'utf8');
  process.stdout.write(`packed ${HANDOFF}\n`);
}

main();
