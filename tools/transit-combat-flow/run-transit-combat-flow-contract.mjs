/**
 * 이동중 전투 post-flow 계약 정적 검증
 * npm run audit:transit-combat-flow
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

const failures = [];

const combat = read('app/(game)/combat.tsx');
const postFlow = read('src/game/transitCombat/transitCombatPostFlow.ts');
const worldmap = read('app/(game)/worldmap.tsx');
const galaxySession = read('src/game/galaxyMapStageSession.ts');
const coreRuntime = read('src/store/planetCoreRuntimeStore.ts');
const genesisPolicy = read('src/arcCore/planetResource/planetResourceEcosystemPolicy.ts');

if (!combat.includes('await runTransitCombatPostFlow')) {
  failures.push('combat.tsx: runTransitCombatPostFlow await 누락');
}
if (!combat.includes('await finishTransitCombatAndNavigate')) {
  failures.push('combat.tsx: finishTransitCombatAndNavigate 경유 누락');
}
if (combat.includes('queueTransitCombatPostFlow') || combat.includes('consumeTransitCombatPostFlow')) {
  failures.push('combat.tsx: worldmap queue 잔재');
}
if (!combat.includes('if (completed)')) {
  failures.push('combat.tsx: post-flow 완료 후에만 worldmap replace 게이트 누락');
}
if (!postFlow.includes('showArcOverlayReward') || !postFlow.includes('presentVictoryResultOverlay')) {
  failures.push('transitCombatPostFlow.ts: 전투결과(reward) 단계 누락');
}
if (!postFlow.includes('presentAdHocTransitDialog')) {
  failures.push('transitCombatPostFlow.ts: 인게임 대화 단계 누락');
}
if (!postFlow.includes('presentLevelUpIfPending')) {
  failures.push('transitCombatPostFlow.ts: 레vel업 단계 누락');
}
if (!postFlow.includes('presentMissionClearWhenReady')) {
  failures.push('transitCombatPostFlow.ts: 미션 완료 단계 누락');
}
if (!postFlow.includes('return true')) {
  failures.push('transitCombatPostFlow.ts: 완료 boolean 반환 누락');
}
if (
  worldmap.includes('runTransitCombatPostFlow')
  || worldmap.includes('queueTransitCombatPostFlow')
  || worldmap.includes('consumeTransitCombatPostFlow')
) {
  failures.push('worldmap.tsx: post-flow는 worldmap에서 실행 금지');
}
if (!worldmap.includes('consumeWorldmapArrivalUi')) {
  failures.push('worldmap.tsx: 도착 UI consume 누락');
}
if (!combat.includes('markPostHubCombatWorldmapIngressReclaim')) {
  failures.push('combat.tsx: worldmap 복귀 ingress reclaim 마커 누락');
}
if (combat.includes('markGalaxyMapIngressFromPlanetHub')) {
  failures.push('combat.tsx: transit 복귀에 허브 ingress 마커 사용 금지');
}
if (!worldmap.includes("reason: 'transit_combat_nav'")) {
  failures.push('worldmap.tsx: 전투 진입 teardown transit_combat_nav 누락');
}
if (!worldmap.includes('worldmapInternalNavRef')) {
  failures.push('worldmap.tsx: internalNav guard 누락');
}
if (!worldmap.includes('worldmapSession.retry')) {
  failures.push('worldmap.tsx: transit 복귀 세션 retry 누락');
}
if (!worldmap.includes('armGalaxyMapScrollGestures')) {
  failures.push('worldmap.tsx: transit 복귀 scroll re-arm 누락');
}
if (!galaxySession.includes("'transit_combat_nav'")) {
  failures.push('galaxyMapStageSession.ts: transit_combat_nav release reason 누락');
}
if (!galaxySession.includes('abortHeavyUiSessions') || !galaxySession.match(/transit_combat_nav[\s\S]*?return;/)) {
  failures.push('galaxyMapStageSession.ts: transit_combat_nav early-return(heavyUi abort 생략) 누락');
}
if (coreRuntime.includes('SCENARIO_GENESIS_PLANET_IDS')) {
  failures.push('planetCoreRuntimeStore.ts: genesis planet ID 하드코드 Set 잔존');
}
if (!coreRuntime.includes('hasPlanetResourceGenesisCsvRow')) {
  failures.push('planetCoreRuntimeStore.ts: genesis realign Table-First(hasPlanetResourceGenesisCsvRow) 누락');
}
if (!genesisPolicy.includes('hasPlanetResourceGenesisCsvRow')) {
  failures.push('planetResourceEcosystemPolicy.ts: hasPlanetResourceGenesisCsvRow 누락');
}

if (failures.length > 0) {
  console.error('FAIL audit:transit-combat-flow');
  for (const f of failures) {
    console.error(`  - ${f}`);
  }
  process.exit(1);
}

console.log('PASS audit:transit-combat-flow — combat 전용 순차 연출 · worldmap queue 없음');
