'use strict';
/**
 * 데일리 스냅샷 커밋 — 변경이 있을 때만 KST 날짜 기준으로 1회 commit.
 * push는 DAILY_COMMIT_PUSH=1 일 때만 (로컬 자격 증명 필요).
 *
 * npm run daily:commit
 * DAILY_COMMIT_RUN_AUDIT=1 npm run daily:commit  — commit 전 audit:daily
 * DAILY_COMMIT_PUSH=1 npm run daily:commit       — commit 후 push
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const LOG_DIR = path.join(__dirname, 'logs');

/** 실수로 stage 되면 안 되는 경로(상대 경로, 슬래시 통일) */
const NEVER_STAGE = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'google-services.json',
  'GoogleService-Info.plist',
];

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 8 * 1024 * 1024,
    ...opts,
  });
  return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function logLine(msg) {
  const stamp = new Date().toISOString();
  const line = `[${stamp}] ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const kstDay = kstDateKey();
    fs.appendFileSync(path.join(LOG_DIR, `${kstDay}.log`), line + '\n', 'utf8');
  } catch {
    /* 로그 실패는 commit 자체를 막지 않음 */
  }
}

function kstDateKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

function ensureGitRepo() {
  const r = run('git', ['rev-parse', '--git-dir']);
  if (r.status !== 0) {
    logLine('ERROR: git repository not found');
    process.exit(1);
  }
}

function hasWorkingTreeChanges() {
  const r = run('git', ['status', '--porcelain']);
  return Boolean(r.stdout.trim());
}

function alreadySnapshottedToday(dateKey) {
  const r = run('git', ['log', '-1', '--format=%s']);
  if (r.status !== 0) return false;
  const subject = r.stdout.trim();
  return subject.includes(`snapshot ${dateKey}`);
}

function unstageSensitivePaths() {
  for (const rel of NEVER_STAGE) {
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    run('git', ['reset', 'HEAD', '--', rel]);
  }
}

function main() {
  ensureGitRepo();
  const dateKey = kstDateKey();

  if (process.env.DAILY_COMMIT_RUN_AUDIT === '1') {
    logLine('running npm run audit:daily …');
    const audit = run('npm', ['run', 'audit:daily']);
    if (audit.status !== 0) {
      logLine('audit:daily failed — skip commit');
      process.exit(audit.status);
    }
  }

  if (!hasWorkingTreeChanges()) {
    logLine('no working tree changes — skip');
    process.exit(0);
  }

  if (alreadySnapshottedToday(dateKey)) {
    logLine(`daily snapshot for ${dateKey} already exists on HEAD — skip`);
    process.exit(0);
  }

  const add = run('git', ['add', '-A']);
  if (add.status !== 0) {
    logLine(`git add failed: ${add.stderr.trim()}`);
    process.exit(add.status);
  }

  unstageSensitivePaths();

  const staged = run('git', ['diff', '--cached', '--name-only']);
  if (!staged.stdout.trim()) {
    logLine('nothing staged after exclusions — skip');
    process.exit(0);
  }

  const msg = `chore(daily): snapshot ${dateKey} (KST)`;
  // Windows shell:true 시 -m 인자가 공백·괄호로 분리되어 pathspec 오류 — shell:false
  const commit = run('git', ['commit', '-m', msg], { shell: false });
  if (commit.status !== 0) {
    logLine(`git commit failed: ${(commit.stdout + commit.stderr).trim()}`);
    process.exit(commit.status);
  }

  logLine(`committed: ${msg}`);

  if (process.env.DAILY_COMMIT_PUSH === '1') {
    const push = run('git', ['push']);
    if (push.status !== 0) {
      logLine(`git push failed: ${push.stderr.trim()}`);
      process.exit(push.status);
    }
    logLine('pushed to remote');
  } else {
    logLine('push skipped (set DAILY_COMMIT_PUSH=1 to enable)');
  }

  process.exit(0);
}

main();
