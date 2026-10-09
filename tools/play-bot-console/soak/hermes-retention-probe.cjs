// 누수원 좁히기 — dev 모듈 레지스트리(__r.getModules)로 zustand store·내보낸 Map/Set/Array 크기를 짧게 읽는다 · 김플레이 2026-10-09
// 인스펙터에 오래 붙는 방식(heap snapshot · sampling)은 이 환경에서 기기 연결이 끊긴다(CONNECTION_LOST).
// 단발 Runtime.evaluate 는 안정적이다. 시간을 두고 두 번 찍어 커지는 항목을 비교한다.
// 사용: node tools/play-bot-console/soak/hermes-retention-probe.cjs <out.json>
'use strict';

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const out = process.argv[2];
if (!out) { console.error('usage: hermes-retention-probe.cjs <out.json>'); process.exit(2); }

// 앱 안에서 실행되는 식. 크기 = 배열 길이 · Map/Set size · 객체 키 수 · JSON 길이(상한 2MB에서 자름).
const EXPR = `(function(){
  var out = { stores: [], containers: [] };
  var r = globalThis.__r;
  if (!r || !r.getModules) return JSON.stringify({ error: 'no __r.getModules' });
  function jsonLen(v){ try { var s = JSON.stringify(v, function(k,x){ if (x instanceof Map) return Array.from(x.entries()); if (x instanceof Set) return Array.from(x.values()); return x; }); return s ? s.length : 0; } catch(e){ return -1; } }
  function shape(v){ if (Array.isArray(v)) return 'arr:' + v.length; if (v instanceof Map) return 'map:' + v.size; if (v instanceof Set) return 'set:' + v.size; if (v && typeof v === 'object') return 'obj:' + Object.keys(v).length; return typeof v; }
  var mods = r.getModules();
  mods.forEach(function(m, id){
    if (!m || !m.isInitialized) return;
    var ex = m.publicModule && m.publicModule.exports;
    if (!ex || typeof ex !== 'object') return;
    var name = m.verboseName || String(id);
    Object.keys(ex).forEach(function(k){
      var v; try { v = ex[k]; } catch(e) { return; }
      if (typeof v === 'function' && typeof v.getState === 'function') {
        var st; try { st = v.getState(); } catch(e) { return; }
        if (!st || typeof st !== 'object') return;
        var keys = {};
        Object.keys(st).forEach(function(sk){ var sv = st[sk]; if (typeof sv === 'function') return; keys[sk] = { shape: shape(sv), json: jsonLen(sv) }; });
        out.stores.push({ module: name, exportName: k, keys: keys });
      } else if (v instanceof Map || v instanceof Set || Array.isArray(v)) {
        out.containers.push({ module: name, exportName: k, shape: shape(v), json: jsonLen(v) });
      }
    });
  });
  return JSON.stringify(out);
})()`;

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
  const ws = new WebSocket(target.webSocketDebuggerUrl, { maxPayload: 512 * 1024 * 1024 });
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  const result = await new Promise((resolve, reject) => {
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.id === 1) (msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result));
    });
    ws.on('close', (code, reason) => reject(new Error(`ws closed ${code} ${reason}`)));
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: EXPR, returnByValue: true } }));
  });
  ws.close();
  const value = result?.result?.value;
  fs.writeFileSync(out, value ?? JSON.stringify(result));
  const parsed = JSON.parse(value ?? '{}');
  console.log(JSON.stringify({ out, stores: parsed.stores?.length, containers: parsed.containers?.length, error: parsed.error }));
}

main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
