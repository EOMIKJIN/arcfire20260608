/**
 * 퀘스트 담당자 조회 — 수락 스냅샷·인스턴스 stamp·허브 대화 주입이 같은 룩업을 쓴다.
 * 틱/렌더 경로에서 호출하지 않는다.
 */
import { resolveBarHostCaptainAtPlanet } from '../arcCore/captainPresence/resolveBarHostCaptainAtPlanet';
import { GALAXY_SYSTEMS } from '../data/galaxy100';
import { getNpcCaptain } from '../npc/npcFleetRegistry';

/** 성계 → 담당자 행성. 바 주인이 있는 행성을 우선하고, 없으면 첫 행성. */
export function resolveMissionContactPlanetIdForSystem(systemId: string): string | null {
  const planets = GALAXY_SYSTEMS[systemId]?.planets;
  if (!planets || planets.length === 0) return null;
  for (let i = 0; i < planets.length; i += 1) {
    const planetId = planets[i]!.id;
    if (resolveBarHostCaptainAtPlanet(planetId)) return planetId;
  }
  return planets[0]!.id;
}

export function resolveBarHostCaptainIdAtPlanet(planetId: string): string | null {
  return resolveBarHostCaptainAtPlanet(planetId)?.id ?? null;
}

export function resolveCaptainContactLabel(
  captainId: string,
): { name: string; nameEn?: string } | null {
  const captain = getNpcCaptain(captainId);
  if (!captain) return null;
  return { name: captain.displayName, nameEn: captain.displayNameEn };
}
