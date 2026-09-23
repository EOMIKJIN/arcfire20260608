// ============================================================
// 궤도 통신요청 — 레지스트리 함장 조회 후 판정
// ============================================================

import type { NpcCaptain } from '../types';
import {
  resolveIngameDialogFallbackSceneId,
} from '../game/ingameDialog/resolveNpcCaptainDialogSceneId';
import { getIngameDialogSceneById } from '../game/ingameDialog/ingameDialogSceneIndex';
import { getNpcCaptain, getNpcCaptainByAssignedShipId } from './npcFleetRegistry';
import {
  decideOrbitCommForCaptain,
  type OrbitCommDecision,
  type OrbitCommRowRef,
} from './orbitCommPolicy';

export {
  ORBIT_COMM_REFUSE_HOSTILE_SCENE_ID,
  ORBIT_COMM_REFUSE_UNIDENTIFIED_SCENE_ID,
  decideOrbitCommForCaptain,
  isOrbitCommHostile,
} from './orbitCommPolicy';
export type {
  OrbitCommCaptainRef,
  OrbitCommDecision,
  OrbitCommRowRef,
} from './orbitCommPolicy';

export function resolveNearbyOrbitCaptain(row: OrbitCommRowRef): NpcCaptain | undefined {
  const captainId = String(row.captainId ?? '').trim();
  if (captainId) {
    const byId = getNpcCaptain(captainId);
    if (byId) return byId;
  }
  const shipId = String(row.shipId ?? '').trim();
  if (shipId) return getNpcCaptainByAssignedShipId(shipId);
  return undefined;
}

function ensureDialogSceneId(sceneId: string): string {
  if (getIngameDialogSceneById(sceneId)) return sceneId;
  return resolveIngameDialogFallbackSceneId();
}

export function resolveOrbitCommDecision(row: OrbitCommRowRef): OrbitCommDecision {
  const decision = decideOrbitCommForCaptain(row, resolveNearbyOrbitCaptain(row));
  if (decision.outcome === 'none') return decision;
  return { ...decision, sceneId: ensureDialogSceneId(decision.sceneId) };
}
