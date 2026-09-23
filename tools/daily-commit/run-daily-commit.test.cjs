'use strict';
const assert = require('node:assert/strict');
const { formatGitFailure, buildGitAddExcludes, gitCheckIgnore } = require('./run-daily-commit.cjs');

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('formatGitFailure는 ignored 줄을 CRLF warning보다 앞에 둔다', () => {
  const out = formatGitFailure(
    '',
    "warning: LF will be replaced by CRLF\nThe following paths are ignored by one of your .gitignore files:\ntools/long-run-monitor/logs\nhint: Use -f if you really want to add them.",
  );
  assert.match(out, /paths are ignored/);
  assert.ok(out.indexOf('paths are ignored') < out.indexOf('warning:'));
});

test('gitignore된 모니터 로그는 add pathspec 제외에 넣지 않는다', () => {
  assert.equal(gitCheckIgnore('tools/long-run-monitor/logs/MONITOR_DASHBOARD_LATEST.html'), true);
  const excludes = buildGitAddExcludes();
  assert.ok(!excludes.some((e) => e.includes('long-run-monitor/logs')));
});

console.log('[daily-commit] unit tests passed');
