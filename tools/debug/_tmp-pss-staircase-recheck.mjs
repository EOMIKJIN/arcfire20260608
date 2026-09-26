/**
 * 김팀장 재계산 — 김클로드 §2와 같은 정의로 mem-timeline 계단을 재현.
 * 세션 = pid 변경 OR 20분 공백. 45분+만. post-warm = 앞 25% 제외.
 * floor = 10분 롤링 윈도 국소 최소. STAIRCASE = last >= 0.7 * max && (max-min) >= 40.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const csvPath = path.join(root, 'tools/long-run-monitor/logs/mem-timeline.csv');
const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter(Boolean);
const header = lines[0].split(',');
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

function parseRow(line) {
  const c = line.split(',');
  const iso = c[idx.iso_time];
  const t = Date.parse(iso.replace(' ', 'T'));
  const pid = String(c[idx.pid] ?? '').trim();
  const pss = Number(c[idx.pss_mb]);
  const native = Number(c[idx.native_heap_mb]);
  const gl = Number(c[idx.gl_mb]);
  const views = Number(c[idx.views]);
  if (!Number.isFinite(t) || !pid || !Number.isFinite(pss)) return null;
  return { t, iso, pid, pss, native, gl, views };
}

const rows = [];
for (let i = 1; i < lines.length; i += 1) {
  const r = parseRow(lines[i]);
  if (r) rows.push(r);
}
rows.sort((a, b) => a.t - b.t);

const GAP_MS = 20 * 60 * 1000;
const sessions = [];
let cur = [];
for (const r of rows) {
  if (cur.length === 0) {
    cur.push(r);
    continue;
  }
  const prev = cur[cur.length - 1];
  if (r.pid !== prev.pid || r.t - prev.t > GAP_MS) {
    sessions.push(cur);
    cur = [r];
  } else {
    cur.push(r);
  }
}
if (cur.length) sessions.push(cur);

const MIN_MS = 45 * 60 * 1000;
const long = sessions.filter((s) => s[s.length - 1].t - s[0].t >= MIN_MS);

function rollingFloor(vals, times, winMs) {
  const out = new Array(vals.length);
  let lo = 0;
  const dq = [];
  for (let i = 0; i < vals.length; i += 1) {
    while (dq.length && vals[dq[dq.length - 1]] >= vals[i]) dq.pop();
    dq.push(i);
    while (times[i] - times[dq[0]] > winMs) {
      if (dq[0] === lo) {
        /* skip */
      }
      if (times[i] - times[dq[0]] > winMs) dq.shift();
      else break;
    }
    while (times[i] - times[lo] > winMs) lo += 1;
    let min = Infinity;
    for (let j = lo; j <= i; j += 1) min = Math.min(min, vals[j]);
    out[i] = min;
  }
  return out;
}

const WIN = 10 * 60 * 1000;
const kinds = { STAIRCASE: 0, SAWTOOTH: 0, FLAT: 0 };
const stair = [];
const viewBuckets = { shell: 0, one: 0, mid: 0, two: 0, other: 0 };
let viewsHigh = 0;
let viewsTotal = 0;

for (const s of long) {
  const start = Math.floor(s.length * 0.25);
  const slice = s.slice(start);
  if (slice.length < 4) {
    kinds.FLAT += 1;
    continue;
  }
  const times = slice.map((r) => r.t);
  const pss = slice.map((r) => r.pss);
  const floors = rollingFloor(pss, times, WIN);
  const floorMin = Math.min(...floors);
  const floorMax = Math.max(...floors);
  const floorLast = floors[floors.length - 1];
  const span = floorMax - floorMin;
  const retain = span <= 0 ? 1 : (floorLast - floorMin) / span;
  let kind = 'FLAT';
  if (span < 40) kind = 'FLAT';
  else if (retain >= 0.7) kind = 'STAIRCASE';
  else kind = 'SAWTOOTH';
  kinds[kind] += 1;
  if (kind === 'STAIRCASE') {
    const nat = slice.map((r) => (Number.isFinite(r.native) ? r.native : 0));
    const gl = slice.map((r) => (Number.isFinite(r.gl) ? r.gl : 0));
    const nf = rollingFloor(nat, times, WIN);
    const gf = rollingFloor(gl, times, WIN);
    stair.push({
      pid: s[0].pid,
      iso: s[0].iso,
      min: s.length,
      durMin: Math.round((s[s.length - 1].t - s[0].t) / 60000),
      floorMin: +floorMin.toFixed(1),
      floorMax: +floorMax.toFixed(1),
      floorLast: +floorLast.toFixed(1),
      retain: +retain.toFixed(2),
      dPss: +(floorMax - floorMin).toFixed(1),
      dNat: +(Math.max(...nf) - Math.min(...nf)).toFixed(1),
      dGl: +(Math.max(...gf) - Math.min(...gf)).toFixed(1),
    });
  }
}

for (const r of rows) {
  if (!Number.isFinite(r.views)) continue;
  viewsTotal += 1;
  const v = r.views;
  if (v >= 90 && v <= 120) viewBuckets.shell += 1;
  else if (v >= 250 && v <= 330) viewBuckets.one += 1;
  else if (v >= 350 && v <= 400) viewBuckets.mid += 1;
  else if (v >= 540 && v <= 600) viewBuckets.two += 1;
  else viewBuckets.other += 1;
  if (v >= 450) viewsHigh += 1;
}

stair.sort((a, b) => b.dPss - a.dPss);
const dPss = stair.map((x) => x.dPss).sort((a, b) => a - b);
const median = (a) => (a.length ? a[Math.floor(a.length / 2)] : 0);

function med(arr) {
  const a = arr.filter((n) => Number.isFinite(n)).sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length / 2)] : null;
}

const viewVsPss = [];
for (const s of long) {
  const start = Math.floor(s.length * 0.25);
  const slice = s.slice(start);
  if (slice.length < 8) continue;
  const times = slice.map((r) => r.t);
  const floor