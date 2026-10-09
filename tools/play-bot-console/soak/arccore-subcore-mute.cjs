// 누수 이분 탐색 — 지정 서브코어의 틱만 잠시 멈춘다(dev 진단 전용) · 김플레이 2026-10-09
// 사용: node tools/play-bot-console/soak/arccore-subcore-mute.cjs mute id1,id2,...
//       node tools/play-bot-console/soak/arccore-subcore-mute.cjs restore
// 원래 _advanceWallClock 은 globalThis.__arcLeakBisectOrig 에 보관하고 restore 때 되돌린다.
'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const [mode, idsRaw] = process.argv.slice(2);
const ids = (idsRaw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
if (mode !== 'mute' && mode !== 'restore') {
  console.error('usage: arccore-subcore-mute.cjs mute <ids> | restore');
  process.exit(2);
}

const findHub = "var hub=null;globalThis.__r.getModules().forEach(function(m){var ex=m&&m.publicModule&&m.publicModule.exports;if(ex&&ex.arcCoreHub&&!hub)hub=ex.arcCoreHub;});if(!hub)return 'no hub';";
const body = mode === 'mute'
  ? `${findHub}var o=globalThis.__arcLeakBisectOrig||(globalThis.__arcLeakBisectOrig={});var ids=${JSON.stringify(ids)};var done=[];ids.forEach(function(id){var sc=hub.subCores.get(id);if(!sc)return;if(!o[id])o[id]=sc._advanceWallClock;sc._advanceWallClock=function(){};done.push(id);});return 'muted:'+done.join(',');`
  : `${findHub}var o=globalThis.__arcLeakBisectOrig||{};var done=[];Object.keys(o).forEach(function(id){var sc=hub.subCores.get(id);if(sc){sc._advanceWallClock=o[id];done.push(id);}});globalThis.__arcLeakBisectOrig={};return 'restored:'+done.join(',');`;

const out = execFileSync(process.execPath, [path.join(__dirname, 'hermes-eval.cjs'), `(function(){${body}})()`], { encoding: 'utf8' });
process.stdout.write(out);
