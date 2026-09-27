'use strict';

/**
 * STAGE 닫힘 후 PSS/native/Views/GL 회수 판정 코어.
 * D-1 같은 pid · D-2 콜드 views 베이스라인 제외 · D-3 신선도 · D-4 측정쌍 중복 제거.
 * 임계 키는 retention-thresholds.json 기존 이름 유지.
 */

const LOGCAT_PID_RE = /^(\d{2})-(\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+\d+/;
const LOGCAT_TS_RE = /^(\d{2})-(\d{2})\s+(\d{2}:\d{2}:\d{2}\.\d{3})/;
const CLOSE_INFER_PID_MS = 2000;

const DEFAULT_THRESHOLDS = {
  recoveryWindowMin: 15,
  minSamplesAfterClose: 2,
  glRecoverMinDeltaMb: 12,
  pssRetainedWarnMb: 35,
  nativeRetainedWarnMb: 25,
  viewsClosedHubMax: 380,
  viewsDuplicateTreeMin: 450,
  hermesRetainedWarnMb: 8,
  baselineStaleMaxMin: 3,
  coldViewsMax: 50,
};

function parseNum(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseTime(iso) {
  const t = Date.parse(String(iso).replace(' ', 'T'));
  return Number.isFinite(t) ? t : NaN;
}

function parseLogcatClock(line, year) {
  const m = String(line).match(LOGCAT_TS_RE);
  if (!m) return NaN;
  return Date.parse(`${year}-${m[1]}-${m[2]}T${m[3]}`);
}

function parseLogcatPid(line) {
  const m = String(line).match(LOGCAT_PID_RE);
  return m ? String(m[4]) : '';
}

function inferYearFromSamples(samples) {
  let max = 0;
  for (const s of samples || []) {
    if (Number.isFinite(s.timeMs) && s.timeMs > max) max = s.timeMs;
  }
  if (!max) return String(new Date().getFullYear());
  return String(new Date(max).getFullYear());
}

function normalizeThresholds(raw) {
  return { ...DEFAULT_THRESHOLDS, ...(raw || {}) };
}

function readCsvRows(text) {
  const lines = String(text).trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const rec = {};
    headers.forEach((h, i) => {
      rec[h] = cols[i] != null ? cols[i].trim() : '';
    });
    return rec;
  });
}

function mergeSamples(profileRows, memRows) {
  const samples = [];

  for (const r of profileRows || []) {
    const t = parseTime(r.iso_time);
    if (!Number.isFinite(t)) continue;
    samples.push({
      source: 'profile',
      timeMs: t,
      iso: r.iso_time,
      pid: r.pid != null && r.pid !== '' ? String(r.pid) : '',
      stage: r.stage || '',
      event: r.event || '',
      pssMb: parseNum(r.pss_mb),
      glMb: parseNum(r.gl_mb),
      nativeMb: parseNum(r.native_mb),
      javaMb: parseNum(r.java_mb),
      views: parseNum(r.views),
      hermesMb: null,
      detail: r.detail || '',
    });
  }

  for (const r of memRows || []) {
    const t = parseTime(r.iso_time);
    if (!Number.isFinite(t) || r.pss_mb === '' || r.pss_mb == null) continue;
    samples.push({
      source: 'mem-timeline',
      timeMs: t,
      iso: r.iso_time,
      pid: r.pid != null && r.pid !== '' ? String(r.pid) : '',
      stage: 'unknown',
      event: 'periodic',
      pssMb: parseNum(r.pss_mb),
      glMb: parseNum(r.gl_mb),
      nativeMb: parseNum(r.native_heap_mb),
      javaMb: parseNum(r.java_heap_mb),
      views: parseNum(r.views),
      hermesMb: null,
      detail: r.note || '',
    });
  }

  samples.sort((a, b) => a.timeMs - b.timeMs);
  return samples;
}

function parseMemProfileLogcat(text, year) {
  const y = year || String(new Date().getFullYear());
  const out = [];
  const re = /\[MEM_PROFILE\]\s+stage=(\S+)\s+event=(\S+)(?:\s+hermes_mb=([\d.]+))?(?:\s+detail=(\S*))?/;
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.match(re);
    if (!m) continue;
    out.push({
      kind: 'logcat',
      stage: m[1],
      event: m[2],
      hermesMb: m[3] ? parseFloat(m[3]) : null,
      detail: m[4] || '',
      raw: line,
      pid: parseLogcatPid(line),
      timeMs: parseLogcatClock(line, y),
    });
  }
  return out;
}

function resolveClosePid(close, samples) {
  if (close.pid != null && String(close.pid) !== '') return String(close.pid);
  const t = close.timeMs;
  if (!Number.isFinite(t)) return '';
  let best = '';
  let bestDt = CLOSE_INFER_PID_MS;
  for (const s of samples) {
    if (!s.pid) continue;
    const dt = Math.abs(s.timeMs - t);
    if (dt <= bestDt) {
      bestDt = dt;
      best = String(s.pid);
    }
  }
  return best;
}

function findCloseEvents(samples, logcatMarkers) {
  const closes = [];
  for (const s of samples) {
    if (s.event === 'route_blur' || String(s.detail).includes('route_blur')) {
      closes.push({ ...s, kind: s.kind || 'snapshot' });
    }
  }
  for (const m of logcatMarkers || []) {
    if (m.event === 'route_blur') {
      closes.push({
        kind: 'logcat',
        stage: m.stage,
        event: m.event,
        hermesMb: m.hermesMb,
        detail: m.detail,
        raw: m.raw,
        timeMs: m.timeMs,
        pid: m.pid || '',
      });
    }
  }
  return closes.sort((a, b) => (a.timeMs || 0) - (b.timeMs || 0));
}

function dedupeCloseEvents(closes) {
  const seen = new Set();
  const out = [];
  for (const c of closes) {
    const bucket = Math.round(Number(c.timeMs || 0) / 1000);
    const key = `${c.pid || ''}|${c.event || ''}|${c.stage || ''}|${bucket}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function samePid(sample, pid) {
  return String(sample.pid) === String(pid);
}

function auditCloseEvent(close, samples, thresholds) {
  const th = normalizeThresholds(thresholds);
  const closeTime = close.timeMs || 0;
  if (!closeTime) return null;

  const closePid = resolveClosePid(close, samples);
  const tagged = { ...close, pid: closePid };

  if (!closePid) {
    return {
      close: tagged,
      status: 'INSUFFICIENT_SAMPLES',
      reason: 'no_pid',
      before: 0,
      after: 0,
      flags: [],
      verdict: 'SKIP',
    };
  }

  const windowMs = th.recoveryWindowMin * 60 * 1000;
  const before = samples.filter(
    (s) =>
      samePid(s, closePid) &&
      s.timeMs <= closeTime &&
      s.timeMs >= closeTime - windowMs &&
      s.pssMb != null,
  );
  const after = samples.filter(
    (s) =>
      samePid(s, closePid) &&
      s.timeMs > closeTime &&
      s.timeMs <= closeTime + windowMs &&
      s.pssMb != null,
  );

  if (before.length === 0 || after.length < th.minSamplesAfterClose) {
    return {
      close: tagged,
      status: 'INSUFFICIENT_SAMPLES',
      reason: 'window',
      before: before.length,
      after: after.length,
      flags: [],
      verdict: 'SKIP',
    };
  }

  const staleMs = th.baselineStaleMaxMin * 60 * 1000;
  const fresh = before.filter((s) => closeTime - s.timeMs <= staleMs);
  if (fresh.length === 0) {
    return {
      close: tagged,
      status: 'INSUFFICIENT_SAMPLES',
      reason: 'stale_baseline',
      before: before.length,
      after: after.length,
      flags: [],
      verdict: 'SKIP',
    };
  }

  let baseline = null;
  for (let i = fresh.length - 1; i >= 0; i -= 1) {
    const s = fresh[i];
    if (s.views != null && s.views < th.coldViewsMax) continue;
    baseline = s;
    break;
  }
  if (!baseline) {
    return {
      close: tagged,
      status: 'INSUFFICIENT_SAMPLES',
      reason: 'cold_baseline',
      before: before.length,
      after: after.length,
      flags: [],
      verdict: 'SKIP',
    };
  }

  const afterGlVals = after.map((s) => s.glMb).filter((v) => v != null);
  const afterPssVals = after.map((s) => s.pssMb).filter((v) => v != null);
  const afterNatVals = after.map((s) => s.nativeMb).filter((v) => v != null);
  const afterViewsVals = after.map((s) => s.views).filter((v) => v != null);
  const afterGlMin = afterGlVals.length ? Math.min(...afterGlVals) : null;
  const afterPssMin = afterPssVals.length ? Math.min(...afterPssVals) : null;
  const afterNatMin = afterNatVals.length ? Math.min(...afterNatVals) : null;
  const afterViewsMin = afterViewsVals.length ? Math.min(...afterViewsVals) : null;

  const glDelta =
    baseline.glMb != null && afterGlMin != null ? baseline.glMb - afterGlMin : null;
  const pssDelta =
    baseline.pssMb != null && afterPssMin != null ? afterPssMin - baseline.pssMb : null;
  const natDelta =
    baseline.nativeMb != null && afterNatMin != null ? afterNatMin - baseline.nativeMb : null;

  const flags = [];
  if (
    tagged.stage === 'planet_hub' &&
    afterViewsMin != null &&
    afterViewsMin >= th.viewsDuplicateTreeMin
  ) {
    flags.push(`VIEWS_RETAINED closed=planet_hub views_min=${afterViewsMin}`);
  }
  if (glDelta != null && glDelta < th.glRecoverMinDeltaMb && (baseline.glMb || 0) > 40) {
    flags.push(`GL_NOT_RECOVERED delta=${glDelta.toFixed(1)}MB need>=${th.glRecoverMinDeltaMb}`);
  }
  if (pssDelta != null && pssDelta >= th.pssRetainedWarnMb) {
    flags.push(`PSS_FLOOR_UP +${pssDelta.toFixed(1)}MB after close`);
  }
  if (natDelta != null && natDelta >= th.nativeRetainedWarnMb) {
    flags.push(`NATIVE_FLOOR_UP +${natDelta.toFixed(1)}MB after close`);
  }

  const fail = flags.length > 0;
  return {
    close: tagged,
    status: fail ? 'RETENTION_FAIL' : 'PASS',
    verdict: fail ? 'FAIL' : 'PASS',
    reason: '',
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

function measurementPairKey(result) {
  const pid = result.close?.pid || '';
  const base = result.baseline?.pssMb;
  const afterPss = result.afterPssMin;
  const afterNat = result.afterNatMin;
  return [
    pid,
    base != null ? Number(base).toFixed(1) : '',
    afterPss != null ? Number(afterPss).toFixed(1) : '',
    afterNat != null ? Number(afterNat).toFixed(1) : '',
  ].join('|');
}

function dedupeRetentionResults(results) {
  const seen = new Set();
  const out = [];
  for (const r of results) {
    if (!r) continue;
    if (r.status === 'INSUFFICIENT_SAMPLES') {
      out.push(r);
      continue;
    }
    const key = measurementPairKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function auditRetention({ profileRows, memRows, logcatText, thresholds }) {
  const th = normalizeThresholds(thresholds);
  const samples = mergeSamples(profileRows, memRows);
  const year = inferYearFromSamples(samples);
  const logcatMarkers = parseMemProfileLogcat(logcatText || '', year);
  const closes = dedupeCloseEvents(
    findCloseEvents(samples, logcatMarkers).map((c) => ({
      ...c,
      pid: resolveClosePid(c, samples),
    })),
  );
  const results = dedupeRetentionResults(
    closes.map((c) => auditCloseEvent(c, samples, th)).filter(Boolean),
  );
  const fails = results.filter((r) => r.status === 'RETENTION_FAIL');
  const verdict = fails.length > 0 ? 'FAIL' : results.some((r) => r.status === 'PASS') ? 'PASS' : 'NO_DATA';
  return { samples, logcatMarkers, closes, results, fails, verdict, year, thresholds: th };
}

module.exports = {
  DEFAULT_THRESHOLDS,
  parseNum,
  parseTime,
  parseLogcatClock,
  parseLogcatPid,
  inferYearFromSamples,
  normalizeThresholds,
  readCsvRows,
  mergeSamples,
  parseMemProfileLogcat,
  resolveClosePid,
  findCloseEvents,
  dedupeCloseEvents,
  auditCloseEvent,
  measurementPairKey,
  dedupeRetentionResults,
  auditRetention,
};
