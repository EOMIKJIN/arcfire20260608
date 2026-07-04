'use strict';
/**
 * sessionStart — src/app/tables 변경 감지 시 mem-post-dev-recheck P0 컨텍스트 주입
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const FLAG = path.join(ROOT, 'tools', 'kim-team-lead', 'reports', '.mem-post-dev-recheck-pending.flag');

function listDirtyDevPaths() {
  try {
    const out = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8', timeout: 8000 });
    const hits = [];
    for (const line of out.split('\n')) {
      if (!line.trim()) continue;
      const file = line.slice(3).trim().replace(/^"(.+)"$/, '$1');
      if (/^(src\/|app\/|tables\/)/.test(file)) hits.push(file);
    }
    return hits;
  } catch {
    return [];
  }
}

function main() {
  const dirty = listDirtyDevPaths();
  if (dirty.length === 0) {
    try {
      if (fs.existsSync(FLAG)) fs.unlinkSync(FLAG);
    } catch {
      /* ignore */
    }
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const sample = dirty.slice(0, 12).join(', ');
  const more = dirty.length > 12 ? ` (+${dirty.length - 12})` : '';
  fs.mkdirSync(path.dirname(FLAG), { recursive: true });
  fs.writeFileSync(
    FLAG,
    `${new Date().toISOString()}\ncount=${dirty.length}\n${dirty.join('\n')}\n`,
    'utf8',
  );

  const ctx = [
    '[Arcfire mem-post-dev-recheck P0 — 미커밋 개발 변경 감지]',
    '',
    `dirty: ${sample}${more}`,
    '',
    '**김팀장 세션 의무 (완료 선언 전):**',
    '1. `npm run audit:mem-post-dev-recheck` 실행',
    '2. kim-economy-handoff `mem-post-dev-recheck: OK|WARN|CRITICAL` 갱신',
    '3. 정적 FAIL 시 코드 수정 후 재실행',
    '',
    'flag: tools/kim-team-lead/reports/.mem-post-dev-recheck-pending.flag',
  ].join('\n');

  process.stdout.write(JSON.stringify({ additional_context: ctx }));
}

main();
