import { useWorldStore } from '../store/worldStore';
import { dispatchArcCoreCommand } from './ArcCoreCommandBus';
import { GAMEPLAY_SYSTEM_IDS, LEGACY_VISIBLE_TOTAL_SYSTEMS, parseSynthOrdinal } from '../data/galaxy100';

export type ArcCoreSystemUnlockKind = 'daily' | 'legacy_seed';

/**
 * 월드스토어에 성계가 해금된 직후 아크코어 명령(공지·수송 씨드)을 발행한다.
 */
export function dispatchArcCoreAfterSystemUnlock(
  candidateId: string,
  kind: ArcCoreSystemUnlockKind = 'daily',
): void {
  const world = useWorldStore.getState();
  const targetSystem = world.getSystem(candidateId);
  if (!targetSystem) return;
  const sourcePlanetId = targetSystem.planets[0]?.id;
  if (!sourcePlanetId) return;
  const factionId = targetSystem.planets[0]?.factionId ?? 'independent';
  const ord = parseSynthOrdinal(candidateId);
  const legacySynthCount = Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - GAMEPLAY_SYSTEM_IDS.size);
  const unlockTier =
    ord === null ? 'base' : ord <= legacySynthCount ? 'legacy_unexplored' : 'expansion_undiscovered';

  const source = kind === 'legacy_seed' ? 'arc_core_legacy_seed' : 'arc_core_daily';
  const reason =
    kind === 'legacy_seed' ? 'legacy_guaranteed_seed_unlock' : 'daily_system_unlock';
  const transportReason =
    kind === 'legacy_seed'
      ? 'legacy_guaranteed_seed_unlock_seed_transport'
      : 'daily_system_unlock_seed_transport';

  dispatchArcCoreCommand({
    type: 'world_system_unlocked',
    systemId: candidateId,
    systemName: targetSystem.name,
    source,
    meta: {
      origin: 'arc_core_policy',
      reason,
      unlockTier,
    },
  });
  dispatchArcCoreCommand({
    type: 'npc_seed_transport_for_system',
    systemId: candidateId,
    sourcePlanetId,
    factionId,
    meta: {
      origin: 'arc_core_policy',
      reason: transportReason,
    },
  });
}
