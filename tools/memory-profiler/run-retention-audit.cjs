#!/usr/bin/env node
/**
 * STAGE retention audit — closed-screen survivors (Instruments / Memory Profiler 유사 diff).
 * 입력: profile-timeline.csv · mem-timeline.csv · (optional) mem-profile-logcat.txt
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PROF_DIR = path.join(__dirname);
const REPORT_DIR = path.join(PROF_DIR, 'reports');
const THRESHOLDS_PATH = path.join(PROF_DIR, 'retention-thresholds.json');
const PROFILE_CSV = path.join(REPORT_DIR, 'profile-timeline.csv');
const MEM_TIMELINE = path.join(ROOT, 'tools', 'long-run-monitor', 'logs', 'mem-timeline.csv');
const LOGCAT_PROFILE = path.join(REPORT_DIR, 'mem-profile-logcat.txt');
const OUT_MD = path.join(REPORT_DIR, 'latest-retention-audit.md');
const OUT_JSON = path.join(REPORT_DIR, 'latest-retention-audit.json');

const DEFAULT_THRESHOLDS = {
  recoveryWindowMin: 15,
  minSamplesAfterClose: 2,
  glRecoverMinDeltaMb: 12,
  pssRetainedWarnMb: 35,
  nativeRetainedWarnMb: 25,
  viewsClosedHubMax: 380,
  viewsDuplicateTreeMin: 450,
  hermesRetainedWarnMb: 8,
};

function loadThresholds() {
  try {
    return { ...DEFAULT_THRESHOLDS, ...JSON.parse(fs.readFileSync(THRESHOLDS_PATH, 'utf8')) };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const row = {};
    header.forEach((h, i) => {
      row[h.trim()] = cols[i] ?? '';
    });
    return row;
  });
}

function parseTime(iso) {
  const t = Date.parse(String(iso).replace(' ', 'T'));
  return Number.isFinite(t) ? t : NaN;
}

function num(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function parseMemProfileLogcat(text) {
  const out = [];
  const re = /\[MEM_PROFILE\]\s+stage=(\S+)\s+event=(\S+)(?:\s+hermes_mb=([\d.]+))?(?:\s+detail=(\S*))?/;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(re);
    if (!m) continue;
    const tsMatch = line.match(/^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})/);
    out.push({
      stage: m[1],
      event: m[2],
      hermesMb: m[3] ? parseFloat(m[3]) : null,
      detail: m[4] || '',
      raw: line,
      timeMs: tsMatch ? parseTime(`2026-${tsMatch[1].replace('-', '-').slice(0, 11)}`) : NaN,
    });
  }
  return out;
}

function mergeSamples(profileRows, memRows) {
  const samples = [];

  for (const r of profileRows) {
    const t = parseTime(r.iso_time);
    if (!Number.isFinite(t)) continue;
    samples.push({
      source: 'profile',
      timeMs: t,
      iso: r.iso_time,
      pid: r.pid,
      stage: r.stage,
      event: r.event,
      pssMb: num(r.pss_mb),
      glMb: num(r.gl_mb),
      nativeMb: num(r.native_mb),
      javaMb: num(r.java_mb),
      views: num(r.views),
      hermesMb: null,
      detail: r.detail || '',
    });
  }

  for (const r of memRows) {
    const t = parseTime(r.iso_time);
    if (!Number.isFinite(t) || !r.pss_mb) continue;
    samples.push({
      source: 'mem-timeline',
      timeMs: t,
      iso: r.iso_time,
      pid: r.pid,
      stage: 'unknown',
      event: 'periodic',
      pssMb: num(r.pss_mb),
      glMb: num(r.gl_mb),
      nativeMb: num(r.native_heap_mb),
      javaMb: num(r.java_heap_mb),
      views: num(r.views),
      hermesMb: null,
      detail: r.note || '',
    });
  }

  samples.sort((a, b) => a.timeMs - b.timeMs);
  return samples;
}

function findCloseEvents(samples, logcatMarkers) {
  const closes = [];
  for (const s of samples) {
    if (s.event === 'route_blur' || String(s.detail).includes('route_blur')) {
      closes.push({ ...s, kind: 'snapshot' });
    }
  }
  for (const m of logcatMarkers) {
    if (m.event === 'route_blur') {
      closes.push({
        kind: 'logcat',
        stage: m.stage,
        event: m.event,
        hermesMb: m.hermesMb,
        detail: m.detail,
        raw: m.raw,
        timeMs: m.timeMs,
      });
    }
  }
  return closes.sort((a, b) => (a.timeMs || 0) - (b.timeMs || 0));
}

function auditCloseEvent(close, samples, thresholds) {
  const windowMs = thresholds.recoveryWindowMin * 60 * 1000;
  const closeTime = close.timeMs || 0;
  if (!closeTime) return null;

  const before = samples.filter(
    (s) => s.timeMs <= closeTime && s.timeMs >= closeTime - windowMs && s.pssMb != null,
  );
  const after = samples.filter(
    (s) => s.timeMs > closeTime && s.timeMs <= closeTime + windowMs && s.pssMb != null,
  );

  if (before.length === 0 || after.length < thresholds.minSamplesAfterClose) {
    return {
      close,
      status: 'INSUFFICIENT_SAMPLES',
      before: before.length,
      after: after.length,
    };
  }

  const baseline = before[before.length - 1];
  const afterGlMin = Math.min(...after.map((s) => s.glMb).filter((v) => v != null));
  const afterPssMin = Math.min(...after.map((s) => s.pssMb).filter((v) => v != null));
  const afterNatMin = Math.min(...after.map((s) => s.nativeMb).filter((v) => v != null));
  const afterViewsMin = Math.min(...after.map((s) => s.views).filter((v) => v != null));

  const glDelta = baseline.glMb != null && afterGlMin != null ? baseline.glMb - afterGlMin : null;
  const pssDelta = baseline.pssMb != null && afterPssMin != null ? afterPssMin - baseline.pssMb : null;
  const natDelta = baseline.nativeMb != null && afterNatMin != null ? afterNatMin - baseline.nativeMb : null;

  const flags = [];
  if (close.stage === 'planet_hub' && afterViewsMin != null && afterViewsMin >= thresholds.viewsDuplicateTreeMin) {
    flags.push(`VIEWS_RETAINED closed=planet_hub views_min=${afterViewsMin}`);
  }
  if (glDelta != null && glDelta < thresholds.glRecoverMinDeltaMb && (baseline.glMb || 0) > 40) {
    flags.push(`GL_NOT_RECOVERED delta=${glDelta.toFixed(1)}MB need>=${thresholds.glRecoverMinDeltaMb}`);
  }
  if (pssDelta != null && pssDelta >= thresholds.pssRetainedWarnMb) {
    flags.push(`PSS_FLOOR_UP +${pssDelta.toFixed(1)}MB after close`);
  }
  if (natDelta != null && natDelta >= thresholds.nativeRetainedWarnMb) {
    flags.push(`NATIVE_FLOOR_UP +${natDelta.toFixed(1)}MB after close`);
  }

  return {
    close,
    status: flags.length ? 'RETENTION_FAIL' : 'PASS',
    baseline,
    afterGlMin,
    afterPssMin,
    afterNatMin,
    afterViewsMin,
    glDelta,
    pssDelta,
    natDelta,
    flags,
  };
}

function main() {
  const thresholds = loadThresholds();
  const profileRows = fs.existsSync(PROFILE_CSV) ? parseCsv(fs.readFileSync(PROFILE_CSV, 'utf8')) : [];
  const memRows = fs.existsSync(MEM_TIMELINE) ? parseCsv(fs.readFileSync(MEM_TIMELINE, 'utf8')) : [];
  const logcatText = fs.existsSync(LOGCAT_PROFILE) ? fs.readFileSync(LOGCAT_PROFILE, 'utf8') : '';
  const logcatMarkers = parseMemProfileLogcat(logcatText);

  const samples = mergeSamples(profileRows, memRows);
  const closes = findCloseEvents(samples, logcatMarkers);
  const results = closes.map((c) => auditCloseEvent(c, samples, thresholds)).filter(Boolean);

  const fails = results.filter((r) => r.status === 'RETENTION_FAIL');
  const verdict = fails.length > 0 ? 'FAIL' : results.length > 0 ? 'PASS' : 'NO_DATA';

  const md = [
    '# Memory retention audit (STAGE close → recovery diff)',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Verdict: **${verdict}**`,
    '',
    `- profile samples: ${profileRows.length}`,
    `- mem-timeline samples: ${memRows.length}`,
    `- logcat [MEM_PROFILE] markers: ${logcatMarkers.length}`,
    `- close events audited: ${results.length}`,
    `- retention failures: ${fails.length}`,
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
    md.push('_No route_blur snapshots yet. Run `npm run profile:mem:snapshot -- -Stage planet_hub -Event route_blur` during play._');
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(OUT_MD, md.join('\n'), 'utf8');
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify({ verdict, thresholds, results, generatedAt: new Date().toISOString() }, null, 2),
    'utf8',
  );

  console.log(`retention-audit verdict=${verdict} failures=${fails.length}`);
  console.log(`report=${OUT_MD}`);
  process.exit(fails.length > 0 ? 1 : 0);
}

main();
