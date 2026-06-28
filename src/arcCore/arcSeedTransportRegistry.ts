// ============================================================
// Arc seed 수송 — Table-First CSV 조회 (npc_cpt_arc_seed_{systemId})
// ============================================================

import type { NpcCaptain } from '../types';
import { getNpcCaptain, getNpcCapitalShip, listNpcCaptains } from '../npc/npcFleetRegistry';
import { npcDeterministicHash32 } from '../npc/npcDeterministicHash';

const ARC_SEED_CAPTAIN_ID_PREFIX = 'npc_cpt_arc_seed_';

let cachedTemplateCaptainIds: string[] | null = null;

function listArcSeedTemplateCaptainIds(): readonly string[] {
  if (cachedTemplateCaptainIds) return cachedTemplateCaptainIds;
  const ids: string[] = [];
  for (const captain of listNpcCaptains()) {
    if (captain.id.startsWith(ARC_SEED_CAPTAIN_ID_PREFIX)) ids.push(captain.id);
  }
  ids.sort();
  cachedTemplateCaptainIds = ids;
  return ids;
}

export function arcSeedTransportCaptainIdForSystem(systemId: string): string {
  return `${ARC_SEED_CAPTAIN_ID_PREFIX}${systemId}`;
}

export function arcSeedTransportShipIdForSystem(systemId: string): string {
  return `npc_arc_seed_ship_${systemId}`;
}

/**
 * 성계 unlock 시드 — CSV 정본 우선, synth 등 미등록 성계는 템플릿 풀 해시 폴백.
 */
export function resolveArcSeedTransportCaptainForSystem(systemId: string): NpcCaptain | undefined {
  const directId = arcSeedTransportCaptainIdForSystem(systemId);
  const direct = getNpcCaptain(directId);
  if (direct) return direct;

  const templates = listArcSeedTemplateCaptainIds();
  if (templates.length === 0) return undefined;
  const h = npcDeterministicHash32(`arcSeedTransportTpl:v1:${systemId}`);
  const templateId = templates[h % templates.length]!;
  return getNpcCaptain(templateId);
}

export function resolveArcSeedTransportShipForSystem(systemId: string): {
  shipId: string;
  hullFromRegistry: boolean;
} {
  const directShipId = arcSeedTransportShipIdForSystem(systemId);
  if (getNpcCapitalShip(directShipId)) {
    return { shipId: directShipId, hullFromRegistry: true };
  }
  const captain = resolveArcSeedTransportCaptainForSystem(systemId);
  const assigned = captain?.assignedShipId?.trim() ?? '';
  if (assigned && getNpcCapitalShip(assigned)) {
    return { shipId: assigned, hullFromRegistry: true };
  }
  return { shipId: directShipId, hullFromRegistry: false };
}

/** 모듈 테스트·핫리로드 후 템플릿 캐시 무효화 */
export function invalidateArcSeedTransportTemplateCache(): void {
  cachedTemplateCaptainIds = null;
}
