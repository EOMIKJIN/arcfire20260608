/**
 * npx tsx src/missions/unidentifiedAnomaly/unidentifiedAnomalyMainline.test.ts
 */
import assert from 'node:assert/strict';
import {
  buildUnidentifiedAnomalyMissionId,
  isUnidentifiedAnomalyMissionId,
  isUnidentifiedAnomalyTemplateMissionId,
  parseUnidentifiedAnomalyMissionId,
} from './unidentifiedAnomalyIds';
import { isBarInstanceTemplateMissionId } from '../missionTrack';
import { pickAnomalyPlanetInSystem } from './pickAnomalyPlanetInSystem';
import { rollAnomalyPayloadKind } from './unidentifiedAnomalyPolicy';
import { shouldRevealAnomalyPayload } from './shouldRevealAnomalyPayload';
import { materializeUnidentifiedAnomalyMission } from './unidentifiedAnomalyResolver';
import { collectMissionCargoRemovals } from '../missionTimeLimit';
import type { MissionObjective } from '../../types';
import type { StarSystem } from '../../types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('tq_anom_ 템플릿은 바 보드 tq 가 아니다', () => {
  assert.equal(isUnidentifiedAnomalyTemplateMissionId('tq_anom_01'), true);
  assert.equal(isBarInstanceTemplateMissionId('tq_anom_01'), false);
  assert.equal(isBarInstanceTemplateMissionId('tq_cbt_01'), true);
});

test('arc_anom_ 접두와 planetId 파싱', () => {
  const id = buildUnidentifiedAnomalyMissionId('synth_078_p', 1727000000);
  assert.equal(id, 'arc_anom_synth_078_p_1727000000');
  assert.equal(isUnidentifiedAnomalyMissionId(id), true);
  assert.equal(isUnidentifiedAnomalyMissionId('sandbox_001'), false);
  assert.deepEqual(parseUnidentifiedAnomalyMissionId(id), {
    planetId: 'synth_078_p',
    seq: '1727000000',
  });
});

test('성계에서 바 행성을 우선한다', () => {
  const system = {
    planets: [
      { id: 'a', hasBar: false },
      { id: 'b', hasBar: true },
    ],
  } as unknown as StarSystem;
  assert.equal(pickAnomalyPlanetInSystem(system), 'b');
  assert.equal(pickAnomalyPlanetInSystem(undefined), null);
});

test('payloadKind 시드는 인스턴스당 결정적이다', () => {
  const a = rollAnomalyPayloadKind('arc_anom_x_1', 50);
  const b = rollAnomalyPayloadKind('arc_anom_x_1', 50);
  assert.equal(a, b);
  assert.equal(rollAnomalyPayloadKind('arc_anom_x_1', 100), 'relic');
  assert.equal(rollAnomalyPayloadKind('arc_anom_x_1', 0), 'threat');
});

test('수색 공개는 수락·미공개일 때만', () => {
  const base = {
    planetId: 'p',
    wreckId: 'w',
    attemptIndex: 1,
    dayKey: '2026-09-24',
    instanceId: 'arc_anom_p_1',
    chancePct: 100,
  };
  assert.equal(shouldRevealAnomalyPayload({ ...base, accepted: false, alreadyRevealed: false }), false);
  assert.equal(shouldRevealAnomalyPayload({ ...base, accepted: true, alreadyRevealed: true }), false);
  assert.equal(shouldRevealAnomalyPayload({ ...base, accepted: true, alreadyRevealed: false }), true);
});

test('threat 목표 문구는 템플릿 CSV를 쓴다', () => {
  const mission = materializeUnidentifiedAnomalyMission({
    instanceId: 'arc_anom_p_9',
    planetId: 'p',
    payloadKind: 'threat',
  });
  assert.ok(mission);
  assert.equal(mission?.objectives[0]?.type, 'defeat_enemy');
  assert.equal(mission?.objectives[0]?.description, '미확인 물체를 격파하라');
  assert.equal(mission?.objectives[0]?.descriptionEn, 'Destroy the unidentified object');
});

test('collect_item 은 만료 화물 회수 대상', () => {
  const rows = collectMissionCargoRemovals({
    objectives: [
      {
        id: 'o',
        type: 'collect_item',
        targetId: 'relic_quest_anomaly_01',
        quantity: 1,
        description: '',
        complete: false,
      } as MissionObjective,
    ],
  });
  assert.deepEqual(rows, [{ goodId: 'relic_quest_anomaly_01', quantity: 1 }]);
});

console.log('[unidentifiedAnomalyMainline] all tests passed');
