'use strict';
/**
 * Cursor 밖 알림 — incident handoff 시 webhook 1줄 (선택).
 * env: ARCFIRE_MONITOR_WEBHOOK_URL 또는 monitor-webhook.local.env
 * Slack/Discord generic webhook JSON 호환. 앱 무관 · PC host only.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const LOG_DIR = path.join(__dirname, 'logs');
const THROTTLE = path.join(LOG_DIR, '.external-notify-throttle.json');
const ENV_FILE = path.join(__dirname, 'monitor-webhook.local.env');

function loadWebhookUrl() {
  if (process.env.ARCFIRE_MONITOR_WEBHOOK_URL?.trim()) {
    return process.env.ARCFIRE_MONITOR_WEBHOOK_URL.trim();
  }
  if (!fs.existsSync(ENV_FILE)) return '';
  try {
    for (const line of fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const m = t.match(/^ARCFIRE_MONITOR_WEBHOOK_URL=(.+)$/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    /* ignore */
  }
  return '';
}

function isThrottled(key, minMin = 30) {
  let map = {};
  try {
    map = JSON.parse(fs.readFileSync(THROTTLE, 'utf8'));
  } catch {
    map = {};
  }
  const prev = map[key];
  if (prev) {
    const ageMin = (Date.now() - Date.parse(prev)) / 60000;
    if (ageMin < minMin) return true;
  }
  map[key] = new Date().toISOString();
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(THROTTLE, JSON.stringify(map, null, 0));
  return false;
}

function postWebhook(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const data = JSON.stringify(body);
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.statusCode));
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const reason = process.argv[2] || 'incident';
  const summary = process.argv.slice(3).join(' ').slice(0, 400) || reason;
  const url = loadWebhookUrl();
  if (!url) {
    process.stdout.write('external_notify=skip (no webhook)\n');
    return;
  }
  if (isThrottled(reason, 30)) {
    process.stdout.write(`external_notify=throttled reason=${reason}\n`);
    return;
  }

  const kst = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace('T', ' ');
  const text = [
    `🚨 Arcfire incident P0 · ${reason}`,
    `KST ${kst}`,
    summary,
    'handoff: tools/long-run-monitor/outbox/cursor-incident-handoff.md',
    '김팀장: Cursor에서 코드 조치',
  ].join('\n');

  const payload = { content: text, text };
  try {
    const code = await postWebhook(url, payload);
    process.stdout.write(`external_notify=sent status=${code}\n`);
  } catch (e) {
    process.stdout.write(`external_notify=fail ${e.message}\n`);
  }
}

main();
