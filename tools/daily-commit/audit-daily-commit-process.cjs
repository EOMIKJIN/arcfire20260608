'use strict';
/**
 * 데일리 커밋 자동 프로세스 무결성
 * npm run audit:daily-commit-process
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  buildGitAddArgs,
  buildGitAddExcludes,
  formatGitFailure,
  gitCheckIgnore,
  VOLATILE_SKIP_STAGE,
} = require('./run-daily-commit.cjs');

const ROOT = path.join(__dirname, '..', '..');
const failures = [];

function run(cmd, args) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
    maxBuffer: 8 * 1024 * 1024,
  });
}

function checkGitAddDryRun() {
  const args = buildGitAddArgs();
  const excludes = buildGitAddExcludes();
  for (const ex of excludes) {
    const rel = ex.replace(/^:!/, '');
    if (gitCheckIgnore(rel)) {
      failures.push(`pathspec exclude is gitignored (git 2.47+ fail): ${rel}`);
    }
  }
  for (const rel of VOLATILE_SKIP_STAGE) {
    if (gitCheckIgnore(rel) && excludes.includes(`:!${rel}`)) {
      failures.push(`ignored volatile still in add exclude: ${rel}`);
    }
  }
  const dryArgs = ['add', '-n', ...args.slice(1)];
  const dry = run('git', dryArgs);
  if ((dry.status ?? 1) !== 0) {
    failures.push(`git add -n failed: ${formatGitFailure(dry.stdout || '', dry.stderr || '')}`);
  }
}

function checkSettingsPush() {
  const settings = fs.readFileSync(path.join(__dirname, 'settings.ps1'), 'utf8');
  if (!/\$DailyCommitPush\s*=\s*\$true/.test(settings)) {
    failures.push('settings.ps1 DailyCommitPush is not $true');
  }
}

function checkWrapperExitCode() {
  const ps1 = fs.readFileSync(path.join(__dirname, 'daily-commit.ps1'), 'utf8');
  if (!/cmd \/c/.test(ps1) && !/\$exitCode/.test(ps1)) {
    failures.push('daily-commit.ps1 must capture npm exit (not Tee-Object LASTEXITCODE)');
  }
  if (!/write-daily-commit-failure-pending/.test(ps1)) {
    failures.push('daily-commit.ps1 must notify on failure');
  }
}

function checkScheduledTask() {
  if (process.platform !== 'win32') {
    process.stdout.write('scheduled task: skip (not windows)\n');
    return;
  }
  const q = spawnSync('schtasks', ['/Query', '/TN', 'ArcfireOnline_DailyCommit', '/FO', 'LIST', '/V'], {
    encoding: 'utf8',
    shell: false,
  });
  if ((q.status ?? 1) !== 0) {
    failures.push('scheduled task ArcfireOnline_DailyCommit missing');
    return;
  }
  const text = `${q.stdout}\n${q.stderr}`;
  if (!/-Push/.test(text)) {
    failures.push('scheduled task TR missing -Push (git push must be automatic)');
  }
}

function main() {
  checkGitAddDryRun();
  checkSettingsPush();
  checkWrapperExitCode();
  checkScheduledTask();

  if (failures.length > 0) {
    process.stdout.write(`FAIL audit:daily-commit-process (${failures.length})\n`);
    for (const f of failures) process.stdout.write(`- ${f}\n`);
    process.exit(1);
  }
  process.stdout.write('PASS audit:daily-commit-process\n');
  process.stdout.write(`git add args: ${buildGitAddArgs().join(' ')}\n`);
  process.exit(0);
}

main();
