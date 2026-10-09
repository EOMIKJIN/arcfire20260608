// 단발 Runtime.evaluate (dev 진단 전용) · 김플레이 2026-10-09
// 사용: node tools/play-bot-console/soak/hermes-eval.cjs "<expression>"
// 예: arcCoreHub 월드 시계 일시정지 — 누수가 아크코어 틱 경로인지 가르는 실험용
'use strict';

const http = require('http');
const WebSocket = require('ws');

const expression = process.argv[2];
if (!expression) { console.error('usage: hermes-eval.cjs "<expression>"'); process.exit(2); }

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function main() {
  const targets = await getJson('http://localhost:8081/json/list');
  const target = targets.find((t) => /React Native Bridge/.test(t.description ?? ''));
  if (!target) throw new Error('no React Native Bridge CDP target');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  const result = await new Promise((resolve, reject) => {
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.id === 1) (msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result));
    });
    ws.on('close', (code, reason) => reject(new Error(`ws closed ${code} ${reason}`)));
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
  });
  ws.close();
  console.log(JSON.stringify(result?.result?.value ?? result));
}

main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
