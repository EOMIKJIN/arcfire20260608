import { useWorldStore } from '../store/worldStore';
import { dispatchArcCoreCommand } from './ArcCoreCommandBus';
import { GAMEPLAY_SYSTEM_IDS, LEGACY_VISIBLE_TOTAL_SYSTEMS, parseSynthOrdinal } from '../data/galaxy100';

export type ArcCoreSystemUnlockKind = 'daily' | 'legacy_seed' | 'fresh_start_seed' | 'global_schedule';

function resolveUnlockTierForSystem(candidateId: string): 'base' | 'legacy_unexplored' | 'expansion_undiscovered' {
  const ord = parseSynthOrdinal(candidateId);
  const legacySynthCount = Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - GAMEPLAY_SYSTEM_IDS.size);
  if (ord === null) return 'base';
  return ord <= legacySynthCount ? 'legacy_unexplored' : 'expansion_undiscovered';
}

/** 성계 개방 공지만 발행 (프론티어 개척 — 수송 없음) */
export function dispatchArcCoreSystemUnlockNotice(
  candidateId: string,
  kind: ArcCoreSystemUnlockKind = 'daily',
): void {
  const world = useWorldStore.getState();
  const targetSystem = world.getSystem(candidateId);
  if (!targetSystem) return;

  const source =
    kind === 'legacy_seed'
      ? 'arc_core_legacy_seed'
      : kind === 'fresh_start_seed'
        ? 'arc_core_fresh_start_seed'
        : kind === 'global_schedule'
          ? 'arc_core_global_schedule'
          : 'arc_core_daily';
  const reason =
    kind === 'legacy_seed'
      ? 'legacy_guaranteed_seed_unlock'
      : kind === 'fresh_start_seed'
        ? 'account_fresh_start_seed_unlock'
        : kind === 'global_schedule'
          ? 'global_schedule_unlock'
          : 'daily_system_unlock';

  dispatchArcCoreCommand({
    type: 'world_system_unlocked',
    systemId: candidateId,
    systemName: targetSystem.name,
    source,
    meta: {
      origin: 'arc_core_policy',
      reason,
      unlockTier: resolveUnlockTierForSystem(candidateId),
    },
  });
}

/** 정착 단계(phase 3) 도달 시 NPC 수송 시드 */
export function dispatchArcCoreSeedTransportForSystem(
  candidateId: string,
  transportReason: string,
): void {
  const world = useWorldStore.getState();
  const targetSystem = world.getSystem(candidateId);
  if (!targetSystem) return;
  const sourcePlanetId = targetSystem.planets[0]?.id;
  if (!sourcePlanetId) return;
  const factionId = targetSystem.planets[0]?.factionId ?? 'independent';

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

/**
 * @deprecated 프론티어 개척 경로는 `dispatchArcCoreSystemUnlockNotice` + 단계 진행 후 수송.
 * 레거시 호환용 — 공지 + 즉시 수송.
 */
export function dispatchArcCoreAfterSystemUnlock(
  candidateId: string,
  kind: ArcCoreSystemUnlockKind = 'daily',
): void {
  dispatchArcCoreSystemUnlockNotice(candidateId, kind);
  const transportReason =
    kind === 'legacy_seed'
      ? 'legacy_guaranteed_seed_unlock_seed_transport'
      : kind === 'fresh_start_seed'
        ? 'account_fresh_start_seed_transport'
        : 'daily_system_unlock_seed_transport';
  dispatchArcCoreSeedTransportForSystem(candidateId, transportReason);
}
