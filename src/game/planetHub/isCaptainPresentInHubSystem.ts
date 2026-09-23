/**
 * 허브 INFO — 해당 성계에 실제로 있는 함장만.
 * 틱 없음. 퀘스트 핀 필터 래퍼.
 *
 * [pss-pre-dev] hot_path=planet useMemo(진입·미션rev) alloc=조회만 cache=presence 기존
 * [pss-pre-dev] stage=허브 INFO · dispose=없음 risk=P3(기존 index)
 * [pss-pre-dev] verdict=PASS
 */

import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { getCaptainPrimaryPresence } from '../../arcCore/captainPresence/buildCaptainPresenceWorldIndex';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import { resolveSystemIdForPlanetId } from '../../world/resolvePlanetSystemId';
import { isCaptainHintPresentInHubSystem } from './hubInfoSystemPresence';

export {
  isCaptainHintPresentInHubSystem,
} from './hubInfoSystemPresence';
export type { HubInfoPresenceHint } from './hubInfoSystemPresence';

/** 총사령관 핀은 호출측에서 제외 — 체류전함 없어도 해당 행성 주둔 */
export function isCaptainPresentInHubSystemForInfo(
  captainId: string,
  hubPlanetId: string,
  hubSystemId?: string | null,
  arcShips: readonly ArcNpcTrafficShip[] = [],
): boolean {
  const id = String(captainId ?? '').trim();
  if (!id) return false;
  const presence = getCaptainPrimaryPresence(id, arcShips);
  const captain = getNpcCaptain(id);
  return isCaptainHintPresentInHubSystem(
    hubPlanetId,
    hubSystemId ?? null,
    {
      presenceActivity: presence?.activity ?? 'off_world',
      presencePlanetId: presence?.planetId ?? null,
      presenceSystemId: presence?.systemId ?? null,
      basePlanetId: captain?.basePlanetId ?? null,
      activityPlanetIds: captain?.activityPlanetIds ?? [],
      barPlanetIds: captain?.barPlanetIds ?? [],
    },
    resolveSystemIdForPlanetId,
  );
}
