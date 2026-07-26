'use strict';
/** 실시간 운영 대시보드 — PC 로컬 HTML (앱 무관) */
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
const OUT_HTML = path.join(LOG_DIR, 'MONITOR_DASHBOARD_LATEST.html');
const STATUS_JSON = path.join(LOG_DIR, 'MONITOR_STATUS_LATEST.json');
const HANDOFF = path.join(__dirname, 'outbox', 'cursor-incident-handoff.md');

function tail(file, n = 8) {
  try {
    return fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-n);
  } catch {
    return [];
  }
}

function readStatus() {
  try {
    return JSON.parse(fs.readFileSync(STATUS_JSON, 'utf8'));
  } catch {
    return null;
  }
}

function lastTimelineRow() {
  const csv = path.join(LOG_DIR, 'mem-timeline.csv');
  try {
    const rows = fs.readFileSync(csv, 'utf8').split(/\r?\n/).filter(Boolean);
    if (rows.length < 2) return null;
    const h = rows[0].split(',');
    const v = rows[rows.length - 1].split(',');
    const o = {};
    h.forEach((k, i) => {
      o[k] = v[i] ?? '';
    });
    return o;
  } catch {
    return null;
  }
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function main() {
  const status = readStatus();
  const tl = lastTimelineRow();
  const incidents = tail(path.join(LOG_DIR, 'incidents.log'), 12);
  const heartbeat = tail(path.join(LOG_DIR, 'heartbeat.log'), 6);
  const handoffPending = fs.existsSync(HANDOFF);
  const chatPending = fs.existsSync(path.join(LOG_DIR, 'CHAT_REPORT_PENDING.md'));
  const kst = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace('T', ' ');

  const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"/><title>Arcfire Monitor</title>
<style>
body{font-family:system-ui,sans-serif;background:#0f1419;color:#e6edf3;margin:16px;max-width:960px}
h1{font-size:1.25rem} .ok{color:#3fb950}.warn{color:#d29922}.bad{color:#f85149}
table{border-collapse:collapse;width:100%;margin:12px 0} td,th{border:1px solid #30363d;padding:6px 8px;text-align:left}
pre{background:#161b22;padding:10px;overflow:auto;font-size:12px;border-radius:6px}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;margin-right:6px}
.b-on{background:#238636}.b-off{background:#6e7681}
</style></head><body>
<h1>Arcfire 실시간 감시 · ${esc(kst)} KST</h1>
<p>
<span class="badge ${status?.watchdog?.alive ? 'b-on' : 'b-off'}">watchdog</span>
<span class="badge ${status?.watch30m?.alive ? 'b-on' : 'b-off'}">mem-watch</span>
<span class="badge ${status?.reportWatch?.alive ? 'b-on' : 'b-off'}">report-watch</span>
<span class="badge ${handoffPending ? 'bad' : 'b-on'}">handoff ${handoffPending ? 'PENDING' : 'clear'}</span>
<span class="badge ${chatPending ? 'warn' : 'b-on'}">chat ${chatPending ? 'PENDING' : 'clear'}</span>
</p>
<h2>Latest mem-timeline</h2>
<table><tr><th>time</th><th>pid</th><th>pss_mb</th><th>gl_mb</th><th>views</th><th>note</th></tr>
${tl ? `<tr><td>${esc(tl.iso_time)}</td><td>${esc(tl.pid)}</td><td>${esc(tl.pss_mb)}</td><td>${esc(tl.gl_mb)}</td><td>${esc(tl.views)}</td><td>${esc(tl.note)}</td></tr>` : '<tr><td colspan="6">(no data)</td></tr>'}
</table>
<h2>Processes</h2>
<pre>${esc(JSON.stringify(status?.processes ?? {}, null, 2))}</pre>
<h2>Recent incidents</h2>
<pre>${esc(incidents.join('\n') || '(none)')}</pre>
<h2>Heartbeat</h2>
<pre>${esc(heartbeat.join('\n') || '(none)')}</pre>
<p style="color:#8b949e;font-size:12px">Auto-refresh: watchdog 5m · file://${esc(OUT_HTML)}</p>
</body></html>`;

  fs.mkdirSync(LOG_DIR, { recursive: true });
  // 원자적 교체 — 자정 daily-commit이 읽는 중 short read 방지 (tmp → rename)
  const tmp = `${OUT_HTML}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, html, 'utf8');
  try {
    fs.renameSync(tmp, OUT_HTML);
  } catch {
    try {
      fs.unlinkSync(OUT_HTML);
    } catch {
      /* ignore */
    }
    try {
      fs.renameSync(tmp, OUT_HTML);
    } catch (err) {
      try {
        fs.copyFileSync(tmp, OUT_HTML);
        fs.unlinkSync(tmp);
      } catch {
        try {
          fs.unlinkSync(tmp);
        } catch {
          /* ignore */
        }
        throw err;
      }
    }
  }
  process.stdout.write(`dashboard=${OUT_HTML}\n`);
}

main();
