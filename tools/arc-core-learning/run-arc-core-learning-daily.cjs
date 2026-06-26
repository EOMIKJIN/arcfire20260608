#!/usr/bin/env node
/**
 * ArcCore 학습 일일 파이프라인 (RN 부트 없음)
 *
 * pull RTDB KPIs → balance-ops learning merge → device KPI seed → sim:economy → RTDB publish
 *
 * Usage:
 *   npm run arc-core:learning:daily
 *   npm run arc-core:learning:daily -- --dry-run
 *   npm run arc-core:learning:daily -- --skip-pull --skip-publish
 */
'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const dryRun = process.argv.includes('--dry-run');
const skipPull = process.argv.includes('--skip-pull');
const skipSim = process.argv.includes('--skip-sim');
const skipPublish = process.argv.includes('--skip-publish');
const allowPullFail = process.argv.includes('--allow-pull-fail');

function run(label, cmd, args, opts = {}) {
  console.log(`\n[arc-core-learning-daily] ▶ ${label}`);
  if (dryRun && opts.skipOnDryRun) {
    console.log(`[arc-core-learning-daily] (dry-run skip) ${cmd} ${args.join(' ')}`);
    return;
  }
  const finalArgs = dryRun && opts.dryRunFlag ? [...args, opts.dryRunFlag] : args;
  execFileSync(cmd, finalArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts.exec,
  });
}

function main() {
  console.log('[arc-core-learning-daily] start', {
    dryRun,
    skipPull,
    skipSim,
    skipPublish,
  });

  if (!skipPull) {
    try {
      run('pull RTDB device KPIs', 'node', [
        'tools/arc-core-learning/pull-rtdb-device-kpis.cjs',
        ...(dryRun ? ['--dry-run'] : []),
      ]);
    } catch (e) {
      if (allowPullFail || dryRun) {
        console.warn('[arc-core-learning-daily] pull skipped/failed — continuing');
      } else {
        throw e;
      }
    }
  }

  run('merge balance-ops learning-state', 'node', [
    'tools/arc-core-learning/merge-learning-state.cjs',
  ]);

  run('merge RTDB device KPIs into seed', 'node', [
    'tools/arc-core-learning/merge-rtdb-device-kpis-into-seed.cjs',
  ]);

  if (!skipSim) {
    run('macro economy sim', 'npm', ['run', 'sim:economy'], { skipOnDryRun: true });
  } else if (dryRun) {
    console.log('[arc-core-learning-daily] (dry-run skip) sim:economy');
  }

  if (!skipPublish) {
    run(
      'publish policy pack to RTDB',
      'node',
      ['tools/arc-core-learning/publish-to-rtdb.cjs', ...(dryRun ? ['--dry-run'] : [])],
      { dryRunFlag: '--dry-run' },
    );
  } else if (dryRun) {
    console.log('[arc-core-learning-daily] (dry-run skip) publish');
  }

  console.log('\n[arc-core-learning-daily] done');
}

main();
