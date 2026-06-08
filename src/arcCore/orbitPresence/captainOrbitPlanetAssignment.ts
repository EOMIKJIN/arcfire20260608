// ============================================================
// 아크코어 — CSV 함장 궤도 주둔 행성 단일 배정 (전역 중복 방지)
// - `arcOrbitPresenceFill` 수송선: AiNpcSubCore 궤도 교통만 (본 모듈 제외)
// - 그 외 비전투 함장: 후보 행성 풀에서 captainId 해시로 1행성만 배정
// ============================================================

import type { NpcCaptain } from '../../types';
import { STAR_SYSTEMS } from '../../data/systems';
import { npcDeterministicHash32 } from '../../npc/npcDeterministicHash';

function listCaptainOrbitPlanetCandidates(captain: NpcCaptain): string[] {
  const out: string[] = [];
  const add = (planetId: string | null | undefined) => {
    const pid = String(planetId ?? '').trim();
    if (!pid || out.includes(pid)) return;
    out.push(pid);
  };

  add(captain.basePlanetId);
  for (const pid of captain.activityPlanetIds) add(pid);

  const systemIds = new Set<string>();
  if (captain.baseSystemId) systemIds.add(captain.baseSystemId);
  for (const sid of captain.activitySystemIds) {
    if (sid) systemIds.add(sid);
  }
  for (const sid of systemIds) {
    const sys = STAR_SYSTEMS[sid];
    if (!sys) continue;
    for (const planet of sys.planets) add(planet.id);
  }

  return out.sort();
}

/** 테이블 순찰·주둔 함장이 궤도에 표시될 단일 행성 id. 수송 풀·전투 함장은 null. */
export function resolveCaptainTableOrbitPlanetId(captain: NpcCaptain): string | null {
  if (captain.arcOrbitPresenceFill) return null;
  if (captain.operationalState === 'combat') return null;

  const candidates = listCaptainOrbitPlanetCandidates(captain);
  if (candidates.length === 0) return null;

  const h = npcDeterministicHash32(`arcCoreOrbitAssign:v1:${captain.id}`);
  return candidates[h % candidates.length] ?? candidates[0] ?? null;
}

export function isCaptainTableOrbitAssignedToPlanet(captain: NpcCaptain, planetId: string): boolean {
  const assigned = resolveCaptainTableOrbitPlanetId(captain);
  return assigned != null && assigned === planetId;
}
