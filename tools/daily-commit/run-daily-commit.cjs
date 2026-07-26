'use strict';
/**
 * 데일리 스냅샷 — KST 날짜 기준 1회 commit (변경 있을 때).
 *
 * npm run daily:commit          — commit만 (push·audit 없음)
 * npm run daily:release         — audit:daily → commit → push (자정 00:00 파이프라인)
 *
 * 환경 변수:
 *   DAILY_COMMIT_RUN_AUDIT=1  — commit 전 audit:daily (실패 시 중단)
 *   DAILY_COMMIT_PUSH=1       — commit 후 push (미 push 커밋만 있어도 push)
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

/**
 * 상시 모니터가 쓰는 중이라 `git add` short-read/index 실패를 유발하는 휘발 파일.
 * add 단계에서 pathspec 제외 + 이후 unstage 이중 방어.
 * (2026-07-27 자정: MONITOR_DASHBOARD_LATEST.html short read → commit/push 전부 실패)
 */
const VOLATILE_SKIP_STAGE = [
  'tools/long-run-monitor/logs/MONITOR_DASHBOARD_LATEST.html',
  'tools/long-run-monitor/logs/MONITOR_STATUS_LATEST.json',
  'tools/long-run-monitor/logs/heartbeat.log',
  'tools/long-run-monitor/logs/perpetual-watchdog.log',
  'tools/long-run-monitor/logs/remediation.log',
  'tools/long-run-monitor/logs/schedule-8am-report.log',
  'tools/long-run-monitor/logs/mem-alerts.log',
  'tools/long-run-monitor/logs/daily-balance-ops.log',
  'tools/long-run-monitor/logs/.last-adb-meminfo.utc',
  'tools/long-run-monitor/logs/.incident-poll-line-offset',
  'tools/long-run-monitor/logs/.daily-balance-ops-kst-day.txt',
  'tools/kim-team-lead/reports/.kim-claude-auto-review-followup.json',
];

const GIT_ADD_MAX_ATTEMPTS = 4;
const GIT_ADD_RETRY_MS = 2000;

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

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* busy-wait — 자정 1회 파이프라인용, 추가 의존성 없음 */
  }
}

function isTransientGitAddFailure(combined) {
  return /short read|failed to insert into database|unable to index file|index\.lock|unable to write new index/i.test(
    combined,
  );
}

/** volatile 제외 + 일시 실패 시 재시도 */
function gitAddAllWithRetry() {
  const excludes = VOLATILE_SKIP_STAGE.map((p) => `:!${p.replace(/\\/g, '/')}`);
  const args = ['add', '-A', '--', '.', ...excludes];
  let last = { status: 1, stdout: '', stderr: '' };
  for (let attempt = 1; attempt <= GIT_ADD_MAX_ATTEMPTS; attempt += 1) {
    last = run('git', args, { shell: false });
    if (last.status === 0) {
      if (attempt > 1) logLine(`git add succeeded on attempt ${attempt}`);
      return last;
    }
    const combined = `${last.stdout}\n${last.stderr}`;
    if (!isTransientGitAddFailure(combined) || attempt === GIT_ADD_MAX_ATTEMPTS) {
      return last;
    }
    logLine(
      `git add transient failure (attempt ${attempt}/${GIT_ADD_MAX_ATTEMPTS}) — retry in ${GIT_ADD_RETRY_MS}ms`,
    );
    sleepMs(GIT_ADD_RETRY_MS);
  }
  return last;
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
  const paths = [...NEVER_STAGE, ...VOLATILE_SKIP_STAGE];
  for (const rel of paths) {
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    run('git', ['reset', 'HEAD', '--', rel], { shell: false });
  }
}

function commitsAheadOfUpstream() {
  const r = run('git', ['rev-list', '--count', '@{u}..HEAD'], { shell: false });
  if (r.status !== 0) return 0;
  const n = Number.parseInt(String(r.stdout).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function pushIfEnabled(reason) {
  if (process.env.DAILY_COMMIT_PUSH !== '1') {
    logLine('push skipped (set DAILY_COMMIT_PUSH=1 to enable)');
    return true;
  }
  const ahead = commitsAheadOfUpstream();
  if (ahead <= 0) {
    logLine('push skipped — no commits ahead of upstream');
    return true;
  }
  logLine(`${reason} — pushing ${ahead} commit(s) to remote …`);
  const push = run('git', ['push'], { shell: false });
  if (push.status !== 0) {
    logLine(`git push failed: ${(push.stdout + push.stderr).trim()}`);
    return false;
  }
  logLine('pushed to remote');
  return true;
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
    if (!pushIfEnabled('no working tree changes')) process.exit(1);
    logLine('no working tree changes — skip commit');
    process.exit(0);
  }

  if (alreadySnapshottedToday(dateKey)) {
    if (!pushIfEnabled('daily snapshot already on HEAD')) process.exit(1);
    logLine(`daily snapshot for ${dateKey} already exists on HEAD — skip commit`);
    process.exit(0);
  }

  const add = gitAddAllWithRetry();
  if (add.status !== 0) {
    logLine(`git add failed: ${(add.stdout + add.stderr).trim()}`);
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

  if (!pushIfEnabled('after commit')) process.exit(1);

  process.exit(0);
}

main();
