/**
 * 개척선 허브 연출 — 아크 수송선단과 동일 entering/dwelling 포즈.
 * 스토어에 실함선을 넣지 않고 `computeArcNpcShipScreenPacked` 입력만 만든다.
 */

import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { WORLD_OBJECT_STELLIUM_COLONIZE_ORBIT_CYCLE_MS } from '../../worldObjects/planetWorldObjectOrbit';
import { STELLIUM_COLONIZE_AI_OPERATOR_ID } from './stelliumColonizeIdentity';
import {
  isStelliumColonizeMarkPhase,
  type StelliumColonizeRecord,
} from './stelliumColonizeTypes';

const DWELL_RAD_PER_SEC =
  (Math.PI * 2) / (WORLD_OBJECT_STELLIUM_COLONIZE_ORBIT_CYCLE_MS / 1000);

/** 접근 시작 방위 — 궤도 앵커와 어긋나게 외곽에서 들어옴 */
const EDGE_PHASE_BIAS_OFFSET = 0.37;

export function resolveStelliumColonizeDepartedAtMs(
  record: Pick<StelliumColonizeRecord, 'outpostDueAtMs'>,
  outpostArriveSec: number,
): number | null {
  const due = record.outpostDueAtMs;
  if (due == null || !Number.isFinite(due)) return null;
  const durMs = Math.max(30, Math.floor(outpostArriveSec)) * 1000;
  return due - durMs;
}

export function buildStelliumColonizeTrafficShip(input: {
  record: StelliumColonizeRecord;
  nowMs: number;
  orbitRadiusPx: number;
  outpostArriveSec: number;
  orbitAngleRad: number;
}): ArcNpcTrafficShip | null {
  const row = input.record;
  if (!isStelliumColonizeMarkPhase(row.phase)) return null;

  const arriveSec = Math.max(30, Math.floor(input.outpostArriveSec));
  const orbitR = Number.isFinite(input.orbitRadiusPx) ? Math.max(1, input.orbitRadiusPx) : 1;
  const orbitAng = Number.isFinite(input.orbitAngleRad) ? input.orbitAngleRad : 0;
  const edgeAng = orbitAng + EDGE_PHASE_BIAS_OFFSET * Math.PI * 2;
  const due = row.outpostDueAtMs;
  const departedAt = resolveStelliumColonizeDepartedAtMs(row, arriveSec);
  const nowMs = Number.isFinite(input.nowMs) ? input.nowMs : 0;
  const stillApproaching =
    row.phase === 'in_flight' && due != null && departedAt != null && nowMs < due;

  const phase: ArcNpcTrafficShip['phase'] = stillApproaching ? 'entering' : 'dwelling';
  const phaseElapsedSec = stillApproaching
    ? Math.max(0, (nowMs - departedAt) / 1000)
    : Math.max(0, (nowMs - (due ?? nowMs)) / 1000);

  return {
    id: `stellium_colonize:${row.planetId}`,
    captainId: STELLIUM_COLONIZE_AI_OPERATOR_ID,
    planetId: row.planetId,
    phase,
    phaseElapsedSec,
    phaseDurationSec: stillApproaching ? arriveSec : 600,
    orbitAngleRad: orbitAng,
    orbitRadiusPx: orbitR,
    edgeAngleRad: edgeAng,
    arcTrafficDwellRadPerSec: DWELL_RAD_PER_SEC,
    arcTrafficPhaseDurationMul: 1,
    arcTrafficPlanetDwellSecMin: 1,
    arcTrafficPlanetDwellSecMax: 1,
  };
}
