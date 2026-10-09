// Hermes 힙 스냅샷 — Metro CDP(HeapProfiler 도메인만) · 김플레이 2026-10-09
//
// 규칙(김클로드 검수 조건):
// - Runtime.enable 은 보내지 않는다(인스펙터가 console 메시지를 쌓아 힙을 부풀린다).
// - 스냅샷 직전에 연결하고 직후 끊는다. Hermes 는 HeapProfiler.enable/disable 을 지원하지 않는다(-32601) → 보내지 않는다.
// - collectGarbage 후 스냅샷 → 살아 있는 보유분만 비교.
// - 모니터 force-stop 을 피하려면 호출 전 tools/long-run-monitor/logs/monitor-paused.flag 를 만든다.
//
// 사용: node tools/play-bot-console/soak/hermes-heap-snapshot.cjs <out.heapsnapshot>
'use strict';

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const out = process.argv[2];
if (!out) {
  console.error('usage: hermes-heap-snapshot.cjs <out.heapsnapshot>');
  process.exit(2);
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const targets = await getJson('http://localhost:8081/json/list');
  const target = targets.find((t) => /React Native Bridge/.test(t.description ?? '')) ?? targets[0];
  if (!target) throw new Error('no CDP target (Metro 8081)');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });

  let nextId = 1;
  const pending = new Map();
  const file = fs.createWriteStream(out);
  let chunkBytes = 0;

  let chunkCount = 0;
  let closed = null;
  ws.on('close', (code, reason) => {
    closed = { code, reason: String(reason ?? ''), atBytes: chunkBytes, chunks: chunkCount };
    console.error(`[snapshot] ws closed code=${code} reason=${closed.reason} bytes=${chunkBytes} chunks=${chunkCount}`);
    for (const { reject } of pending.values()) reject(new Error(`ws closed ${code}`));
    pending.clear();
  });
  ws.on('error', (e) => console.error(`[snapshot] ws error ${e?.message ?? e}`));

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.method === 'HeapProfiler.addHeapSnapshotChunk') {
      file.write(msg.params.chunk);
      chunkBytes += msg.params.chunk.length;
      chunkCount += 1;
      return;
    }
    if (msg.method) return;
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

  const t0 = Date.now();
  await send('HeapProfiler.collectGarbage');
  await send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  // Hermes 는 응답을 마지막 조각보다 먼저 보낼 수 있다(2026-10-09 파일 끝 잘림) → 조각이 3초 끊길 때까지 기다린다.
  let lastBytes = -1;
  while (lastBytes !== chunkBytes) {
    lastBytes = chunkBytes;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  ws.close();
  await new Promise((resolve) => file.end(resolve));
  console.log(JSON.stringify({ out, bytes: chunkBytes, ms: Date.now() - t0, target: target.description }));
}

main().catch((e) => {
  console.error(String(e?.stack ?? e));
  process.exit(1);
});
