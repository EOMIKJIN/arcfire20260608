// ============================================================
// CSV occupation 시드 — hydrate · AI 동기화 · repair 단일 파이프라인
// ============================================================

import {
  seedPlanetOccupationHoldsFromBalance,
  ARC_CORE_SEED_BLUE_CLAN_ID,
  ARC_CORE_SEED_RED_CLAN_ID,
} from '../arcCore/balance/seedPlanetOccupationFromBalance';
import {
  isNationSeedClanId,
  migrateExistingPlayerDeedHoldsToIndependentAll,
  migratePlanetHoldsOwnershipSplit,
} from './planetOwnershipModel';
import { isPlanetContestedZone } from '../arcCore/balance/balanceTableRegistry';
import { isDynamicContestedZonePlanet } from '../arcCore/territorial/dynamicContestedZoneStore';
import type { ClanBasicsRecord, ClanWarOperation, PlanetClanHold } from '../types';

export type PlanetOccupationSeedPipelineResult = {
  holds: Record<string, PlanetClanHold>;
  clans: Record<string, ClanBasicsRecord>;
  mutated: boolean;
  /** occupierClanId 가 바뀐 행성 — 총사령관 재배정용 */
  occupierChangedPlanetIds: string[];
};

function collectOccupierChanges(
  before: Record<string, PlanetClanHold>,
  after: Record<string, PlanetClanHold>,
): string[] {
  const changed: string[] = [];
  for (const planetId of Object.keys(after)) {
    if (before[planetId]?.occupierClanId !== after[planetId]?.occupierClanId) {
      changed.push(planetId);
    }
  }
  return changed;
}

/** 런타임 중립화 작전 기록 — 시드 복구로 되돌려진 hold 소급 수리 대상 소스 */
const RUNTIME_NEUTRALIZE_OP_SOURCES: readonly string[] = [
  'player_wave_defense_win',
  'rebellion_overthrow',
];

/**
 * 소급 수리 — `neutralizedAt` 마커 도입(2026-07-20) 이전에 전투 승리·반란으로 중립화됐다가
 * 부트 시드 복구에 RED/BLUE로 되돌려진 hold를 작전 기록(operations)으로 복원한다.
 * 비접전 행성 + 국가 시드 occupier + 증서·거점 없음 + 해당 행성의 최신 중립화 작전 존재 시에만.
 * idempotent — 복원 후에는 마커가 있어 시드 복구·재수리 모두 skip.
 */
export function repairRuntimeNeutralizedHoldsFromOperations(
  holds: Record<string, PlanetClanHold>,
  operations: readonly ClanWarOperation[],
): { holds: Record<string, PlanetClanHold>; changed: boolean } {
  let changed = false;
  const next = { ...holds };

  const neutralizeOpAtByPlanetId = new Map<string, number>();
  for (const op of operations) {
    if (op.phase !== 'resolved') continue;
    const source = String((op.ext as Record<string, unknown> | undefined)?.source ?? '');
    if (!RUNTIME_NEUTRALIZE_OP_SOURCES.includes(source)) continue;
    const cur = neutralizeOpAtByPlanetId.get(op.targetPlanetId) ?? 0;
    if (op.startedAt > cur) neutralizeOpAtByPlanetId.set(op.targetPlanetId, op.startedAt);
  }
  if (neutralizeOpAtByPlanetId.size === 0) return { holds, changed: false };

  for (const [planetId, neutralizedOpAt] of neutralizeOpAtByPlanetId) {
    const cur = next[planetId];
    if (!cur) continue;
    if (cur.neutralizedAt) continue;
    if (isPlanetContestedZone(planetId) || isDynamicContestedZonePlanet(planetId)) continue;
    // 시드 복구가 만든 국가 디폴트 hold만 수리 — 증서·거점·AI클랜·플레이어 상태는 보존
    if (cur.kind !== 'clan_hold' || !isNationSeedClanId(cur.occupierClanId)) continue;
    if (cur.deedOwnerClanId?.trim() || cur.homePlayerUid?.trim()) continue;
    // 중립화 이후 새로 점유된 hold(capturedAt가 더 최신)는 수리 대상 아님
    if (cur.capturedAt > neutralizedOpAt) continue;

    next[planetId] = {
      ...cur,
      occupierClanId: 'neutral',
      kind: 'neutral',
      capturedAt: neutralizedOpAt,
      neutralizedAt: neutralizedOpAt,
    };
    changed = true;
  }
  return { holds: next, changed };
}

const PLAYER_ANNEX_OP_SOURCE = 'player_stellium_annex';

/**
 * 소급 수리 — `player_annex` 마커 도입(2026-10-10) 이전에 플레이어가 편입(블루)했다가
 * 부트 시드 복구로 원래 국가(레드 등)로 되돌려진 hold를 작전 기록으로 복원한다.
 * 조건: 행성의 **가장 최근 resolved 작전**이 플레이어 편입(newSide BLUE)이고, 현재 hold가 그와 다른
 * 국가 시드 clan_hold(증서·거점 없음)일 때만. 편입 뒤 실제 영토 작전으로 바뀐 경우(더 최신 작전 존재)는 보존.
 * idempotent — 복원 후에는 마커가 있어 시드 복구·재수리 모두 skip.
 */
export function repairPlayerAnnexHoldsFromOperations(
  holds: Record<string, PlanetClanHold>,
  operations: readonly ClanWarOperation[],
): { holds: Record<string, PlanetClanHold>; changed: boolean; repairedPlanetIds: string[] } {
  const latestOpByPlanetId = new Map<string, ClanWarOperation>();
  for (const op of operations) {
    if (op.phase !== 'resolved' || !op.targetPlanetId) continue;
    const prev = latestOpByPlanetId.get(op.targetPlanetId);
    if (!prev || op.startedAt > prev.startedAt) latestOpByPlanetId.set(op.targetPlanetId, op);
  }
  const next = { ...holds };
  const repairedPlanetIds: string[] = [];
  for (const [planetId, op] of latestOpByPlanetId) {
    const ext = (op.ext ?? {}) as Record<string, unknown>;
    if (String(ext.source ?? '') !== PLAYER_ANNEX_OP_SOURCE) continue;
    if (String(ext.newSide ?? '').toUpperCase() !== 'BLUE') continue;
    const cur = next[planetId];
    if (!cur) continue;
    if (cur.occupierClanId === ARC_CORE_SEED_BLUE_CLAN_ID && cur.occupationOrigin === 'player_annex') continue;
    if (cur.kind !== 'clan_hold' || !isNationSeedClanId(cur.occupierClanId)) continue;
    if (cur.deedOwnerClanId?.trim() || cur.homePlayerUid?.trim()) continue;
    next[planetId] = {
      ...cur,
      occupierClanId: ARC_CORE_SEED_BLUE_CLAN_ID,
      kind: 'clan_hold',
      capturedAt: op.startedAt,
      neutralizedAt: null,
      occupationOrigin: 'player_annex',
    };
    repairedPlanetIds.push(planetId);
  }
  return { holds: repairedPlanetIds.length > 0 ? next : holds, changed: repairedPlanetIds.length > 0, repairedPlanetIds };
}

/** loadLocalClanWarFoundation · syncNpcAiClanTerritory 후처리 공용 — idempotent */
export function applyPlanetOccupationSeedPipeline(
  existingHolds: Record<string, PlanetClanHold>,
  existingClans: Record<string, ClanBasicsRecord>,
): PlanetOccupationSeedPipelineResult {
  const seeded = seedPlanetOccupationHoldsFromBalance(existingHolds);
  const migrated = migratePlanetHoldsOwnershipSplit(seeded.holds);
  // M2-E(선택) — occupier=국가 시드·중립 + deedOwner=플레이어 legacy hold → 독립국(녹색) 전환
  const independentMigrated = migrateExistingPlayerDeedHoldsToIndependentAll(migrated.holds);
  const clans = { ...existingClans, ...seeded.clans };
  const clansChanged =
    clans[ARC_CORE_SEED_BLUE_CLAN_ID]?.displayName !==
      existingClans[ARC_CORE_SEED_BLUE_CLAN_ID]?.displayName
    || clans[ARC_CORE_SEED_RED_CLAN_ID]?.displayName !==
      existingClans[ARC_CORE_SEED_RED_CLAN_ID]?.displayName;
  const occupierChangedPlanetIds = collectOccupierChanges(existingHolds, independentMigrated.holds);

  return {
    holds: independentMigrated.holds,
    clans,
    mutated: seeded.holdsMutated || migrated.changed || independentMigrated.changed || clansChanged,
    occupierChangedPlanetIds,
  };
}
