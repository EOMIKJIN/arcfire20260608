'use strict';
/**
 * 자정(KST 00:00) 안정화 파이프라인 — audit:daily → commit → push
 * npm run daily:release
 *
 * run-daily-commit.cjs 는 require.main 가드가 있어 require만 하면 main()이 안 돈다.
 * 2026-09-25 00:00 스케줄러가 daily:release를 실행했으나 커밋·푸시 없이 exit 0 한 원인.
 */
if (process.env.DAILY_COMMIT_RUN_AUDIT !== '0') {
  process.env.DAILY_COMMIT_RUN_AUDIT = process.env.DAILY_COMMIT_RUN_AUDIT || '1';
}
if (process.env.DAILY_COMMIT_PUSH !== '0') {
  process.env.DAILY_COMMIT_PUSH = process.env.DAILY_COMMIT_PUSH || '1';
}
require('./run-daily-commit.cjs').main();
