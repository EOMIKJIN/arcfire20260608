// Hermes GC 전후 힙 — 「누수 vs 수거 지연」 판정 · 김플레이 2026-10-09
// stats 읽기 → HeapProfiler.collectGarbage → stats 읽기. Runtime.enable 은 보내지 않는다(console 버퍼링 방지).
// GC 직후 js_allocatedBytes = 살아 있는 양. 시점별로 이 값이 계속 크면 누수, 비슷하면 수거 지연.
// 사용: node tools/play-bot-console/soak/hermes-gc-probe.cjs [label]
'use strict';

const http = require('http');
const WebSocket = require('ws');

const label = process.argv[2] ?? '';
const EXPR = `(function(){var s=(globalThis.HermesInternal&&HermesInternal.getInstrumentedStats)?HermesInternal.getInstrumentedStats():{};return JSON.stringify({heap:s.js_heapSize,alloc:s.js_allocatedBytes,ext:s.js_externalBytes,gc:s.js_numGCs});})()`;

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

const mb = (b) => (typeof b === 'number' ? Math.round((b / 1048576) * 10) / 10 : null);

async function main() {
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
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const read = async () => {
    const r = await send('Runtime.evaluate', { expression: EXPR, returnByValue: true });
    const s = JSON.parse(r.result.value);
    return { heapMb: mb(s.heap), allocMb: mb(s.alloc), extMb: mb(s.ext), gc: s.gc };
  };
  const before = await read();
  await send('HeapProfiler.collectGarbage');
  const after = await read();
  ws.close();
  console.log(JSON.stringify({ t: new Date().toISOString(), label, before, after }));
}

main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
