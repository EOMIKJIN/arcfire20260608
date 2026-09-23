/**
 * 접전 팝업 — 시작화면·부트·계정 초기화 스킵
 * npx tsx --test src/arcCore/territorial/showTerritorialOccupationChangeAlert.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setAccountResetInProgress } from '../../account/accountResetPresence';
import { setTitleStartScreenActive } from '../../navigation/titleStartScreenPresence';
import {
  beginPreHubWorldOpsAlertSuppress,
  endPreHubWorldOpsAlertSuppress,
  lockWorldOpsNotifyUntilPlanetHub,
  markPlanetHubWorldOpsNotifyUnlocked,
  resetWorldOpsNotifyPresenceForTest,
} from '../../navigation/worldOpsNotifyPresence';
import { useAppBootStore } from '../../store/appBootStore';
import {
  formatTerritorialBattleAlertCopy,
  koJosa,
} from './territorialBattleAlertCopy';
import { shouldSkipTerritorialOccupationAlert } from './territorialAlertGate';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  } finally {
    setTitleStartScreenActive(false);
    setAccountResetInProgress(false);
    useAppBootStore.getState().setBootReady(true);
    resetWorldOpsNotifyPresenceForTest();
  }
}

test('1) 인게임(부트 완료·허브 도착) → 스킵 안 함', () => {
  useAppBootStore.getState().setBootReady(true);
  setTitleStartScreenActive(false);
  setAccountResetInProgress(false);
  markPlanetHubWorldOpsNotifyUnlocked();
  assert.equal(shouldSkipTerritorialOccupationAlert(), false);
});

test('1b) 허브 미도착 → 접전·운영 팝업 스킵', () => {
  useAppBootStore.getState().setBootReady(true);
  setTitleStartScreenActive(false);
  setAccountResetInProgress(false);
  lockWorldOpsNotifyUntilPlanetHub();
  assert.equal(shouldSkipTerritorialOccupationAlert(), true);
});

test('1c) 스토리·파일럿 등록 화면 → 스킵', () => {
  useAppBootStore.getState().setBootReady(true);
  setTitleStartScreenActive(false);
  setAccountResetInProgress(false);
  markPlanetHubWorldOpsNotifyUnlocked();
  beginPreHubWorldOpsAlertSuppress();
  assert.equal(shouldSkipTerritorialOccupationAlert(), true);
  endPreHubWorldOpsAlertSuppress();
  assert.equal(shouldSkipTerritorialOccupationAlert(), false);
});

test('2) 시작화면 → 전투결과 포함 접전 팝업 스킵', () => {
  useAppBootStore.getState().setBootReady(true);
  setTitleStartScreenActive(true);
  assert.equal(shouldSkipTerritorialOccupationAlert(), true);
});

test('3) 부트 미완료(초기화) → 스킵', () => {
  setTitleStartScreenActive(false);
  useAppBootStore.getState().setBootReady(false);
  assert.equal(shouldSkipTerritorialOccupationAlert(), true);
});

test('4) 계정 초기화 중 → 스킵', () => {
  useAppBootStore.getState().setBootReady(true);
  setTitleStartScreenActive(false);
  setAccountResetInProgress(true);
  assert.equal(shouldSkipTerritorialOccupationAlert(), true);
});

test('5) 전투결과 문맥 — 침공국·방어국·점령 결과', () => {
  assert.equal(koJosa('베가 전초기지', '을', '를'), '를');
  assert.equal(koJosa('크림슨 레기온', '이', '가'), '이');
  assert.equal(koJosa('스텔리움 연합', '이', '가'), '이');
  const captured = formatTerritorialBattleAlertCopy({
    planet: '베가 전초기지',
    previousSide: 'blue',
    newSide: 'red',
    attackerSide: 'red',
    defenderSide: 'blue',
    occupationChanged: true,
  });
  assert.match(captured.context, /베가 전초기지를 크림슨 레기온이 공격하였습니다/);
  assert.match(captured.context, /방어측은 스텔리움 연합입니다/);
  assert.doesNotMatch(captured.context, /전투 결과/);
  assert.match(captured.outcome, /크림슨 레기온이 승리하여 점령이 스텔리움 연합에서 크림슨 레기온으로 바뀌었습니다/);
  const held = formatTerritorialBattleAlertCopy({
    planet: '베가 전초기지',
    previousSide: 'blue',
    newSide: 'blue',
    holdSide: 'blue',
    attackerSide: 'red',
    defenderSide: 'blue',
    occupationChanged: false,
  });
  assert.match(held.context, /베가 전초기지를 크림슨 레기온이 공격하였습니다/);
  assert.match(held.context, /방어측은 스텔리움 연합입니다/);
  assert.match(held.outcome, /스텔리움 연합이 막아 스텔리움 연합 점령이 유지되었습니다/);
});

test('6) 배선 — 전투결과(maintained)·변경 팝업이 공통 게이트를 탄다', () => {
  const src = readFileSync(resolve(__dirname, 'showTerritorialOccupationChangeAlert.ts'), 'utf8');
  assert.match(src, /shouldSkipTerritorialOccupationAlert/);
  assert.match(src, /function presentTerritorialAlertNow/);
  assert.match(src, /messageSection/);
  assert.match(src, /territorial\.alert\.resultLabel/);
  const maintainedIdx = src.indexOf('export function showTerritorialOccupationMaintainedAlert');
  assert.ok(maintainedIdx > 0);
  assert.match(src.slice(maintainedIdx), /presentTerritorialAlertNow/);
  assert.match(src.slice(maintainedIdx), /messageSection/);
});

console.log('[territorialOccupationAlert] all tests passed');
