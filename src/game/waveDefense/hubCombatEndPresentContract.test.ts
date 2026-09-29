/**
 * 허브 웨이브/미션클리어 종료 UI — 이동중 전투와 같은 셸 큐 고착 방지
 * npx tsx --test src/game/waveDefense/hubCombatEndPresentContract.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const planetSrc = readFileSync(resolve(__dirname, '../../../app/(game)/planet.tsx'), 'utf8');
const hubSimSrc = readFileSync(
  resolve(__dirname, '../../components/planet/PlanetEdenRaidTestLayer.tsx'),
  'utf8',
);
const clearSrc = readFileSync(
  resolve(__dirname, '../../missions/presentPendingMissionClearDialog.ts'),
  'utf8',
);

test('wave end dialog bypasses planet_hub screen shell', () => {
  assert.match(planetSrc, /ingame_dialog_wave_defense_end/);
  assert.match(planetSrc, /bypassScreenShell:\s*true/);
  assert.match(planetSrc, /presentWaveEndResult/);
});

test('wave end still shows result if operator dialog did not open', () => {
  assert.match(planetSrc, /runAfterIngameDialogIdle\(presentWaveEndResult\)/);
  assert.match(planetSrc, /presentWaveEndResult\(\)/);
});

test('wave result totalWaves is per-planet policy', () => {
  assert.match(planetSrc, /resolvePlanetWaveDefenseMaxWaves\(endedPlanetId\)/);
  assert.match(planetSrc, /waveDefenseMaxWaves/);
});

test('wave result uses the single combat-end pipeline without feature-link delay', () => {
  assert.match(planetSrc, /runCombatEndOutcomeFlow/);
  assert.match(planetSrc, /venue:\s*'wave'/);
  assert.doesNotMatch(planetSrc, /runAfterIngameDialogFeatureLinkDelay/);
  // 파이프라인이 순서를 소유한다 — 호출부가 레벨업·미션대사를 직접 잇지 않는다
  assert.doesNotMatch(planetSrc, /presentPendingCombatLevelUpThen/);
  assert.match(planetSrc, /shouldSkipMissionClear/);
});

test('hub orbit regular combat goes through the same pipeline', () => {
  assert.match(hubSimSrc, /runCombatEndOutcomeFlow/);
  assert.match(hubSimSrc, /venue:\s*'hub_orbit'/);
  assert.doesNotMatch(hubSimSrc, /presentPendingCombatLevelUpThen/);
  assert.match(hubSimSrc, /isHubOrbitCombatResultVenue/);
  assert.match(hubSimSrc, /CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID/);
  assert.match(hubSimSrc, /hubOrbitCombatResultSession/);
  assert.match(hubSimSrc, /presentCombatEndLeaderDialog/);
  assert.match(hubSimSrc, /waitCombatEndHold/);
  assert.match(hubSimSrc, /resolveHubOrbitLeaderCaptainId/);
  assert.match(hubSimSrc, /questOrbit/);
  assert.match(hubSimSrc, /퀘스트 일반전투는 점유 웨이브 30분 쿨다운을 남기지 않는다/);
});

test('player sink does not present destroy alert before combat result', () => {
  assert.match(hubSimSrc, /markCombatPlayerShipSinkPending/);
  assert.match(hubSimSrc, /applyCapitalShipDestruction:\s*pendingDestroy/);
  assert.match(hubSimSrc, /pendingDestroy \|\| winnerTeam !== 'blue'/);
  assert.doesNotMatch(hubSimSrc, /combat\.shipDestroyedTitle/);
  assert.match(planetSrc, /consumeCombatPlayerShipSinkPending/);
  assert.match(planetSrc, /applyCapitalShipDestruction:\s*sunk/);
  assert.match(planetSrc, /if \(sunk \|\| endedOutcome !== 'win'\) return false/);
});

test('wave win uses shared leader defeat dialog before result', () => {
  assert.match(planetSrc, /presentCombatEndLeaderDialog/);
  assert.match(planetSrc, /ended\.leaderCaptainId/);
});

test('pending mission clear bypasses screen shell', () => {
  assert.match(clearSrc, /bypassScreenShell:\s*true/);
  assert.match(clearSrc, /!presented \|\| !useIngameDialogStore\.getState\(\)\.isActive\(\)/);
});
