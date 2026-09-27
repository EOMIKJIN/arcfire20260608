#!/usr/bin/env node
/**
 * STAGE retention audit — closed-screen survivors.
 * 판정 코어: retentionAuditCore.cjs (pid · 신선도 · 콜드 베이스라인 · 측정쌍 중복 제거)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { readCsvRows, auditRetention, DEFAULT_THRESHOLDS } = require('./retentionAuditCore.cjs');

const ROOT = path.join(__dirname, '..', '..');
const PROF_DIR = path.join(__dirname);
const REPORT_DIR = path.join(PROF_DIR, 'reports');
const THRESHOLDS_PATH = path.join(PROF_DIR, 'retention-thresholds.json');
const PROFILE_CSV = path.join(REPORT_DIR, 'profile-timeline.csv');
const MEM_TIMELINE = path.join(ROOT, 'tools', 'long-run-monitor', 'logs', 'mem-timeline.csv');
const LOGCAT_PROFILE = path.join(REPORT_DIR, 'mem-profile-logcat.txt');
const OUT_MD = path.join(REPORT_DIR, 'latest-retention-audit.md');
const OUT_JSON = path.join(REPORT_DIR, 'latest-retention-audit.json');

function loadThresholds() {
  try {
    return { ...DEFAULT_THRESHOLDS, ...JSON.parse(fs.readFileSync(THRESHOLDS_PATH, 'utf8')) };
  } catch {
    return { ...DEFAULT_THRESHOLDS };
  }
}

function writeReport(audit, outMd) {
  const { results, verdict, thresholds, samples, logcatMarkers, fails } = audit;
  const skip = results.filter((r) => r.status === 'INSUFFICIENT_SAMPLES');
  const skipReasons = {};
  for (const r of skip) {
    const k = r.reason || 'unknown';
    skipReasons[k] = (skipReasons[k] || 0) + 1;
  }
  const profileN = samples.filter((s) => s.source === 'profile').length;
  const memN = samples.filter((s) => s.source === 'mem-timeline').length;

  const md = [
    '# Memory retention audit (STAGE close → recovery diff)',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Verdict: **${verdict}**`,
    '',
    `- profile samples: ${profileN}`,
    `- mem-timeline samples: ${memN}`,
    `- logcat [MEM_PROFILE] markers: ${logcatMarkers.length}`,
    `- close events audited: ${results.length}`,
    `- retention failures: ${fails.length}`,
    `- skip: ${skip.length} (${JSON.stringify(skipReasons)})`,
    `- contract: same-pid · baseline≤${thresholds.baselineStaleMaxMin}min · views≥${thresholds.coldViewsMax} · pair-dedupe`,
    '',
    '## Thresholds',
    '```json',
    JSON.stringify(thresholds, null, 2),
    '```',
    '',
    '## Results',
  ];

  for (const r of results) {
    const c = r.close;
    md.push(`### ${c.stage} / ${c.event} (${c.iso || c.raw || 'logcat'})`);
    md.push(`- status: **${r.status}**`);
    if (c.pid) md.push(`- pid: ${c.pid}`);
    if (r.reason) md.push(`- skip_reason: ${r.reason}`);
    if (r.flags?.length) md.push(`- flags: ${r.flags.join('; ')}`);
    if (r.baseline) {
      md.push(
        `- baseline: PSS=${r.baseline.pssMb} GL=${r.baseline.glMb} native=${r.baseline.nativeMb} views=${r.baseline.views}`,
      );
    }
    if (r.afterPssMin != null) {
      md.push(
        `- after window min: PSS=${r.afterPssMin} GL=${r.afterGlMin} native=${r.afterNatMin} views=${r.afterViewsMin}`,
      );
    }
    md.push('');
  }

  if (results.length === 0) {
    md.push(
      '_No route_blur snapshots yet. Run `npm run profile:mem:snapshot -- -Stage planet_hub -Event route_blur` during play._',
    );
  } else if (fails.length) {
    md.push('김팀장: FAIL은 같은 pid·신선한 워밍 베이스라인만. 시설 keep-hub views~575는 설계값일 수 있음 — pop 후 복귀만 실기 확인.');
  }

  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf8');
}

function main() {
  const thresholds = loadThresholds();
  const profileRows = fs.existsSync(PROFILE_CSV) ? readCsvRows(fs.readFileSync(PROFILE_CSV, 'utf8')) : [];
  const memRows = fs.existsSync(MEM_TIMELINE) ? readCsvRows(fs.readFileSync(MEM_TIMELINE, 'utf8')) : [];
  const logcatText = fs.existsSync(LOGCAT_PROFILE) ? fs.readFileSync(LOGCAT_PROFILE, 'utf8') : '';

  const audit = auditRetention({ profileRows, memRows, logcatText, thresholds });
  writeReport(audit, OUT_MD);
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        verdict: audit.verdict,
        thresholds: audit.thresholds,
        results: audit.results,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`retention-audit verdict=${audit.verdict} failures=${audit.fails.length} skip=${audit.results.length - audit.fails.length}`);
  console.log(`report=${OUT_MD}`);
  process.exit(audit.fails.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { main, loadThresholds };
