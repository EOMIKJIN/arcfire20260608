'use strict';
/**
 * 자정(KST 00:00) 안정화 파이프라인 — audit:daily → commit → push
 * npm run daily:release
 */
if (process.env.DAILY_COMMIT_RUN_AUDIT !== '0') {
  process.env.DAILY_COMMIT_RUN_AUDIT = process.env.DAILY_COMMIT_RUN_AUDIT || '1';
}
if (process.env.DAILY_COMMIT_PUSH !== '0') {
  process.env.DAILY_COMMIT_PUSH = process.env.DAILY_COMMIT_PUSH || '1';
}
require('./run-daily-commit.cjs');
