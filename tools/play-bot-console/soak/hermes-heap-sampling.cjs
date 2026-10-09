// Hermes 샘플링 힙 프로파일 — 살아 있는 할당을 호출 경로별로 · 김플레이 2026-10-09
// 전체 heap snapshot 은 수십~수백 MB 를 보내다 기기 쪽 인스펙터 연결이 끊긴다(CONNECTION_LOST, 약 91MB 지점).
// 샘플링 프로파일은 결과가 작다: startSampling → N분 대기 → collectGarbage → stopSampling.
// stop 시점에 아직 살아 있는 표본만 남으므로, 시간이 지나도 회수되지 않는 할당 지점(누수원)이 위로 올라온다.
// Runtime.enable 은 보내지 않는다.
// 사용: node tools/play-bot-console/soak/hermes-heap-sampling.cjs <minutes> <out.json> [samplingIntervalBytes]
'use strict';

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const minutes = Number(process.argv[2]);
const out = process.argv[3];
const interval = Number(process.argv[4]) || 16384;
if (!(minutes > 0) || !out) {
  console.error('usage: hermes-heap-sampling.cjs <minutes> <out.json> [samplingIntervalBytes]');
  process.exit(2);
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function connect() {
  const targets = await getJson('http://localhost:8081/json/list');
  const target = targets.find((t) => /React Native Bridge/.test(t.description ?? ''));
  if (!target) throw new Error('no React Native Bridge CDP target');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  let nextId = 1;
  const pending = new Map();
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.code} ${msg.error.message}`));
      else resolve(msg.result);
    }
  });
  ws.on('close', (code, reason) => {
    for (const { reject } of pending.values()) reject(new Error(`ws closed ${code} ${reason}`));
    pending.clear();
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  return { ws, send };
}

async function main() {
  // 샘플링은 CDP 세션에 묶인다(연결을 끊으면 -32600 Heap sampling not active) → 대기 동안 연결을 유지한다.
  const c = await connect();
  await c.send('HeapProfiler.startSampling', { samplingInterval: interval });
  console.log(`[sampling] started interval=${interval}B, waiting ${minutes} min`);
  await new Promise((resolve) => setTimeout(resolve, minutes * 60_000));
  await c.send('HeapProfiler.collectGarbage');
  const res = await c.send('HeapProfiler.stopSampling');
  c.ws.close();
  fs.writeFileSync(out, JSON.stringify(res.profile));
  console.log(`[sampling] saved ${out} (${fs.statSync(out).size} bytes)`);
}

main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
