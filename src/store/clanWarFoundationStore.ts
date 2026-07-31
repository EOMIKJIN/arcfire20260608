/**
 * 클랜전 기반 데이터(로컬) — 거점 행성 · 행성별 전함 배치 · 공방 작전 기록
 * 글로벌 서버 연동 시 이 스키마를 동기화 페이로드로 그대로 확장 가능.
 */
import { create } from 'zustand';
import { scheduleUserCloudSync } from '../firebase/userCloudSyncSchedule';
import type {
  ClanBasicsRecord,
  ClanWarOperation,
  PlanetCapitalDeployment,
  PlanetClanHold,
  StarSystem,
} from '../types';
import {
  canClaimAsHomePlanet,
  canDeployCapitalAtPlanet,
  soloClanIdForUid,
} from '../clanWar/clanWarRules';
import {
  canPurchasePlanetOwnershipDeed,
  resolveNationSeedClanIdForMegaFaction,
  resolvePlanetHoldForOwnershipCheck,
  resolveTerritorialNationClanIdForPlanet,
} from '../clanWar/planetOwnershipModel';
import { releasePlayerPlanetHolds } from '../clanWar/planetHoldReleasePolicy';
import { resolveGameplayZoneHubPlanet } from '../clanWar/resolveZoneHubPlanet';
import { npcCaptainLeaderUid, normalizeAiClanId } from '../clanWar/aiNpcClanIds';
import { listAiClanTerritoryHubClans } from '../clanWar/aiClanRegistry';
import {
  applyPlanetOccupationSeedPipeline,
  repairRuntimeNeutralizedHoldsFromOperations,
} from '../clanWar/planetOccupationSeedPipeline';
import {
  ARC_CORE_SEED_BLUE_CLAN_ID,
  ARC_CORE_SEED_RED_CLAN_ID,
} from '../arcCore/balance/seedPlanetOccupationFromBalance';
import { NPC_CAPTAINS_FROM_CSV } from '../data/generated';
import { usePlayerStore } from './playerStore';
import {
  loadClanWarFoundationDb,
  resetClanWarFoundationDb,
  saveClanWarFoundationDb,
} from '../world/clanWarFoundationDb';
import {
  resolveMapFactionSideFromClanIdPure,
  type MapFactionSide,
} from '../galaxyMap/mapFactionSideCore';
import {
  hydrateDynamicContestedZones,
  promoteDynamicContestedZone,
  promoteDynamicContestedZonesFromOperations,
} from '../arcCore/territorial/dynamicContestedZoneStore';
import { hasAdjacentHostileFactionSystem, listAdjacentSystemIds } from '../arcCore/territorial/territorialSupplyLine';
import { invalidateFrontPressure } from '../arcCore/territorial/frontPressureIndex';
import { markContestedPoolDirty } from '../arcCore/territorial/dynamicContestedZoneStore';
import { reassignPlanetGovernorForOccupationSync } from '../game/planetGovernor/reassignPlanetGovernorForOccupation';
import { hydratePlanetGovernorAssignmentStore } from '../game/planetGovernor/planetGovernorAssignmentStore';

interface ClanWarFoundationState {
  hydrated: boolean;
  clans: Record<string, ClanBasicsRecord>;
  planetHolds: Record<string, PlanetClanHold>;
  deployments: PlanetCapitalDeployment[];
  operations: ClanWarOperation[];
  loadLocalClanWarFoundation: () => Promise<void>;
  persistClanWarFoundation: () => Promise<void>;
  resetLocalClanWarFoundation: () => Promise<void>;
  /** 신규 파일럿용 솔로 클랜 보장 — id 반환 */
  ensureSoloClan: (uid: string, nickname: string, megaFactionId: string) => string;
  /** 1) 거점 행성 점유 + 플레이어 homePlanetId / political.clanId 반영 */
  claimHomePlanet: (params: { uid: string; planetId: string; systemId: string; nickname: string; megaFactionId: string }) => { ok: boolean; reason?: string };
  /** 무역소 소유권 증서 구매 — deedOwner + 구매자 국가 occupier(국경선) 갱신 */
  claimPlanetOwnershipByPurchase: (params: {
    uid: string;
    planetId: string;
    systemId: string;
    nickname: string;
    megaFactionId: string;
  }) => { ok: boolean; reason?: string; clanId?: string };
  /** 클랜 해산 아이템 구매 시: 플레이어 클랜 해산 + 점유 행성 neutral(디폴트) 복귀 */
  dissolvePlayerClanByPurchase: (params: {
    uid: string;
  }) => { ok: boolean; reason?: string; dissolvedClanId?: string; releasedPlanetCount?: number };
  /** 계정 삭제/초기화 시 해당 uid의 클랜/점유/배치/작전 흔적 제거 */
  purgePlayerAccountWorldState: (params: {
    uid: string;
    currentClanId?: string | null;
  }) => Promise<{ ok: boolean; removedClanIds: string[]; releasedPlanetCount: number }>;
  /** 계정 초기화 안전망: 플레이어 유래(비 AI) 클랜/점유/배치/작전 전체 제거 */
  purgeAllNonAiClanWorldState: () => Promise<{
    ok: boolean;
    removedClanCount: number;
    releasedPlanetCount: number;
    removedDeploymentCount: number;
    removedOperationCount: number;
  }>;
  /** 2) 거점 행성에 전함 배치(assetId = npc_ai_ships.csv id 등) */
  deployCapital: (params: {
    uid: string;
    clanId: string;
    planetId: string;
    assetId: string;
    role: PlanetCapitalDeployment['role'];
  }) => { ok: boolean; reason?: string; deploymentId?: string };
  /** 3) 공격 개시(기록만 — 전투 해상도는 추후) */
  startRaidOnPlanet: (params: {
    attackerClanId: string;
    defenderClanId: string | null;
    targetPlanetId: string;
  }) => string;
  /** ArcCore 접전지역 자동전투 — 점유 변경 + 작전 기록 */
  applyArcCoreTerritorialHold: (params: {
    planetId: string;
    systemId: string;
    factionSide: 'BLUE' | 'RED' | 'NEUTRAL';
    operationMeta: Record<string, unknown>;
    /** 플레이어 전투 승리 중립화 — CSV 국가 시드 복구·지도 시드 폴백에서 보호(neutralizedAt) */
    neutralizedByPlayer?: boolean;
  }) => { changed: boolean; previousSide: MapFactionSide; newSide: MapFactionSide; operationId: string };
  getHold: (planetId: string) => PlanetClanHold | undefined;
  listDeploymentsForPlanet: (planetId: string) => PlanetCapitalDeployment[];
  getClanBasics: (clanId: string) => ClanBasicsRecord | undefined;
  /**
   * NPC AI 클랜장 3인(구역별) — 플레이 성계 구역의 기하학적 중심에 가까운 허브 행성에 클랜·점유·기함 1척 시드.
   * 플레이어 `player_home`이 이미 있으면 해당 행성은 건너뜀.
   */
  syncNpcAiClanTerritoryFromGalaxy: (
    systems: Record<string, StarSystem>,
    options?: { skipOccupationSeedPipeline?: boolean },
  ) => void;
  /** synth 아크코어 개방 직후 — 블루/레드·플레이어 home 은 덮어쓰지 않음 */
  seedSynthFrontierNeutralHold: (planetId: string, systemId: string) => void;
  /**
   * synth 아크코어 재잠금(세대/epoch hardReset) 시 — `seedSynthFrontierNeutralHold`가 만든
   * 순수 neutral 자리표만 제거. player_home·플레이어 독립국·클랜 점유(non-neutral)는 절대
   * 건드리지 않음(21코어·분쟁 시드 hold 보호 원칙과 동일).
   */
  clearSynthFrontierNeutralHold: (planetId: string) => void;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

function mapOccupierToGovernorSide(
  occupierClanId: string,
  clans: Record<string, ClanBasicsRecord>,
): 'BLUE' | 'RED' | 'NEUTRAL' {
  if (occupierClanId === 'neutral') return 'NEUTRAL';
  const side = resolveMapFactionSideFromClanIdPure(occupierClanId, clans);
  if (side === 'red') return 'RED';
  if (side === 'blue') return 'BLUE';
  return 'NEUTRAL';
}

function reassignGovernorsAfterOccupierChanges(
  beforeHolds: Record<string, PlanetClanHold>,
  afterHolds: Record<string, PlanetClanHold>,
  clans: Record<string, ClanBasicsRecord>,
  planetIds: readonly string[],
): void {
  for (const planetId of planetIds) {
    if (beforeHolds[planetId]?.occupierClanId === afterHolds[planetId]?.occupierClanId) continue;
    const hold = afterHolds[planetId];
    if (!hold) continue;
    reassignPlanetGovernorForOccupationSync({
      planetId,
      newFactionSide: mapOccupierToGovernorSide(hold.occupierClanId, clans),
    });
  }
}

function finalizeClanHoldRelease(
  get: () => ClanWarFoundationState,
  set: (partial: Partial<ClanWarFoundationState>) => void,
  releasedHolds: Record<string, PlanetClanHold>,
  clans: Record<string, ClanBasicsRecord>,
): Record<string, PlanetClanHold> {
  const piped = applyPlanetOccupationSeedPipeline(releasedHolds, clans);
  set({ clans: piped.clans, planetHolds: piped.holds });
  if (piped.occupierChangedPlanetIds.length > 0) {
    reassignGovernorsAfterOccupierChanges(
      releasedHolds,
      piped.holds,
      piped.clans,
      piped.occupierChangedPlanetIds,
    );
    // FrontPressure — 해산/purge로 occupier가 바뀐 성계 + 인접 성계의 posture가 달라질 수 있음
    // (2026-07-28 account-purge-ownership-neutralize M5, 기존 invalidate 패턴 재사용).
    for (const planetId of piped.occupierChangedPlanetIds) {
      const systemId = piped.holds[planetId]?.systemId;
      if (!systemId) continue;
      invalidateFrontPressure([systemId, ...listAdjacentSystemIds(systemId)]);
    }
    // 분쟁지역 풀 거버너(2026-07-31) — occupier 변경으로 SAFE/ELIGIBLE 분류가 바뀔 수 있음
    markContestedPoolDirty();
  }
  return piped.holds;
}

export const useClanWarFoundationStore = create<ClanWarFoundationState>((set, get) => ({
  hydrated: false,
  clans: {},
  planetHolds: {},
  deployments: [],
  operations: [],

  loadLocalClanWarFoundation: async () => {
    try {
      // 동적 분쟁지역(플레이어 전투 편입) 판정이 시드 reconcile·소급 수리보다 먼저 준비돼야 함
      await hydrateDynamicContestedZones();
      const loaded = await loadClanWarFoundationDb();
      // 소급 수리 — 마커 도입 전 전투 승리·반란 중립화가 시드 복구로 되돌려진 hold 복원
      const repaired = repairRuntimeNeutralizedHoldsFromOperations(
        loaded.planetHolds,
        loaded.operations,
      );
      const piped = applyPlanetOccupationSeedPipeline(repaired.holds, loaded.clans);
      set({
        clans: piped.clans,
        planetHolds: piped.holds,
        deployments: loaded.deployments,
        operations: loaded.operations,
      });
      const governorReassignPlanetIds = repaired.changed
        ? Array.from(
            new Set([
              ...piped.occupierChangedPlanetIds,
              ...Object.keys(repaired.holds).filter(
                (pid) => repaired.holds[pid] !== loaded.planetHolds[pid],
              ),
            ]),
          )
        : piped.occupierChangedPlanetIds;
      if (governorReassignPlanetIds.length > 0) {
        reassignGovernorsAfterOccupierChanges(
          loaded.planetHolds,
          piped.holds,
          piped.clans,
          governorReassignPlanetIds,
        );
      }
      if (piped.mutated || repaired.changed) {
        await saveClanWarFoundationDb({
          clans: piped.clans,
          planetHolds: piped.holds,
          deployments: loaded.deployments,
          operations: loaded.operations,
        });
      }
      await hydratePlanetGovernorAssignmentStore();
      // 소급 편입 — 이미 플레이어 전투가 벌어진 행성(작전 기록)을 동적 분쟁지역에 합류.
      // 수리·시드 파이프라인 이후 실행: 이번 부트의 hold 복원에는 영향 없고 다음 판정부터 적용.
      await promoteDynamicContestedZonesFromOperations(
        loaded.operations,
        (pid) => piped.holds[pid]?.systemId ?? null,
      );
      // 소급 편입 — 이미 구매된 독립국(녹색) 행성 중 인접 적대 팩션이 있는 곳도 순환고리 합류
      // (구매 시점 트리거 도입 2026-07-21 이전 구매분 · player_home 거점은 제외)
      for (const pid of Object.keys(piped.holds)) {
        const h = piped.holds[pid];
        if (!h || h.kind !== 'player_independent' || !h.systemId) continue;
        if (
          hasAdjacentHostileFactionSystem({
            systemId: h.systemId,
            side: 'INDEPENDENT',
            holds: piped.holds,
          })
        ) {
          await promoteDynamicContestedZone({
            planetId: pid,
            systemId: h.systemId,
            source: 'retro:player_ownership_purchase',
          });
        }
      }
    } finally {
      set({ hydrated: true });
    }
  },

  persistClanWarFoundation: async () => {
    const { clans, planetHolds, deployments, operations } = get();
    await saveClanWarFoundationDb({ clans, planetHolds, deployments, operations });
    scheduleUserCloudSync();
  },

  resetLocalClanWarFoundation: async () => {
    await resetClanWarFoundationDb();
    set({ clans: {}, planetHolds: {}, deployments: [], operations: [], hydrated: true });
  },

  ensureSoloClan: (uid, nickname, megaFactionId) => {
    const id = soloClanIdForUid(uid);
    const now = Date.now();
    const state = get();
    if (state.clans[id]) return id;
    const rec: ClanBasicsRecord = {
      id,
      displayName: `${nickname} 함대`,
      leaderUid: uid,
      megaFactionId,
      createdAt: now,
      ext: {},
    };
    set({ clans: { ...state.clans, [id]: rec } });
    void get().persistClanWarFoundation();
    return id;
  },

  claimHomePlanet: ({ uid, planetId, systemId, nickname, megaFactionId }) => {
    const clanId = get().ensureSoloClan(uid, nickname, megaFactionId);
    const hold = get().planetHolds[planetId];
    if (!canClaimAsHomePlanet(hold, clanId)) {
      return { ok: false, reason: 'occupied_by_other_clan' };
    }
    const now = Date.now();
    const nationClanId = resolveTerritorialNationClanIdForPlanet(planetId);
    const territorialOccupier =
      nationClanId ?? hold?.occupierClanId ?? clanId;
    const nextHold: PlanetClanHold = {
      planetId,
      systemId,
      occupierClanId: territorialOccupier,
      deedOwnerClanId: clanId,
      homePlayerUid: uid,
      kind: 'player_home',
      capturedAt: now,
    };
    set({ planetHolds: { ...get().planetHolds, [planetId]: nextHold } });
    const p = usePlayerStore.getState().player;
    if (p && p.uid === uid) {
      usePlayerStore.getState().setPlayer({
        ...p,
        homePlanetId: planetId,
        political: { ...p.political, clanId },
      });
      void usePlayerStore.getState().persist();
    }
    void get().persistClanWarFoundation();
    return { ok: true };
  },

  claimPlanetOwnershipByPurchase: ({ uid, planetId, systemId, nickname, megaFactionId }) => {
    const clanId = get().ensureSoloClan(uid, nickname, megaFactionId);
    const hold = get().planetHolds[planetId];
    const resolvedHold = resolvePlanetHoldForOwnershipCheck(planetId, hold);
    const purchaseCheck = canPurchasePlanetOwnershipDeed(
      planetId,
      hold,
      clanId,
      megaFactionId,
      get().clans,
    );
    if (!purchaseCheck.ok) {
      return { ok: false, reason: purchaseCheck.reason };
    }
    const nationOccupierId = resolveNationSeedClanIdForMegaFaction(megaFactionId);
    if (!nationOccupierId) {
      return { ok: false, reason: 'faction_mismatch' };
    }
    const now = Date.now();
    const nextHold: PlanetClanHold = {
      ...resolvedHold,
      planetId,
      systemId: resolvedHold.systemId || systemId,
      // 구매 시 블루·중립 영토 모두 플레이어(솔로 클랜) occupier → 녹색 독립국
      // (migratePlanetHoldOwnershipSplit 역마이그레이션 함정 회피: occupier·deedOwner 둘 다 player clanId)
      occupierClanId: clanId,
      deedOwnerClanId: clanId,
      homePlayerUid: uid,
      kind: 'player_independent',
      capturedAt: resolvedHold.capturedAt > 0 ? resolvedHold.capturedAt : now,
      // 전쟁 스폴일가(neutralizedAt) 종료 — 구매 후 단가 변동은 추후 구현
      neutralizedAt: null,
    };
    set({ planetHolds: { ...get().planetHolds, [planetId]: nextHold } });
    // FrontPressure — 독립국 편입으로 이 성계·인접 성계의 posture가 바뀔 수 있음(시리우스 시나리오 트리거)
    if (nextHold.systemId) {
      invalidateFrontPressure([nextHold.systemId, ...listAdjacentSystemIds(nextHold.systemId)]);
    }
    // 분쟁지역 풀 거버너(2026-07-31) — 독립국 편입으로 SAFE/ELIGIBLE 분류가 바뀔 수 있음
    markContestedPoolDirty();
    const p = usePlayerStore.getState().player;
    if (p && p.uid === uid) {
      usePlayerStore.getState().setPlayer({
        ...p,
        political: { ...p.political, clanId },
      });
      void usePlayerStore.getState().persist();
    }
    void get().persistClanWarFoundation();
    // 독립국 편입 — 인접 성계에 적대 팩션(정치관계 CSV) 점유가 있으면 분쟁 순환고리 자동 합류
    // (거점(player_home)은 구매 경로가 아니므로 해당 없음 · idempotent)
    const holdsAfter = get().planetHolds;
    if (
      nextHold.systemId &&
      hasAdjacentHostileFactionSystem({
        systemId: nextHold.systemId,
        side: 'INDEPENDENT',
        holds: holdsAfter,
      })
    ) {
      void promoteDynamicContestedZone({
        planetId,
        systemId: nextHold.systemId,
        source: 'player_ownership_purchase',
      });
    }
    return { ok: true, clanId };
  },

  dissolvePlayerClanByPurchase: ({ uid }) => {
    const p = usePlayerStore.getState().player;
    if (!p || p.uid !== uid) return { ok: false, reason: 'player_not_found' };
    const clanId = p.political.clanId;
    if (!clanId) return { ok: false, reason: 'no_clan' };

    const state = get();
    const nextClans = { ...state.clans };
    delete nextClans[clanId];
    const removedClanIds = new Set([clanId]);
    const released = releasePlayerPlanetHolds({
      holds: state.planetHolds,
      removedClanIds,
      remainingClanIds: new Set(Object.keys(nextClans)),
      uid,
      mode: 'dissolve_clan',
    });

    const nextDeployments = state.deployments.filter((d) => d.clanId !== clanId);
    const nextOperations = state.operations.filter(
      (op) => op.attackerClanId !== clanId && op.defenderClanId !== clanId,
    );

    set({
      clans: nextClans,
      deployments: nextDeployments,
      operations: nextOperations,
    });
    finalizeClanHoldRelease(get, set, released.holds, nextClans);

    usePlayerStore.getState().setPlayer({
      ...p,
      homePlanetId: null,
      political: { ...p.political, clanId: null },
    });
    void usePlayerStore.getState().persist();
    void get().persistClanWarFoundation();

    return { ok: true, dissolvedClanId: clanId, releasedPlanetCount: released.releasedPlanetCount };
  },

  purgePlayerAccountWorldState: async ({ uid, currentClanId }) => {
    const state = get();
    if (!uid) return { ok: false, removedClanIds: [], releasedPlanetCount: 0 };

    const removedClanIdsSet = new Set<string>();
    Object.values(state.clans).forEach((clan) => {
      if (clan.leaderUid === uid) removedClanIdsSet.add(clan.id);
    });
    // 클랜 레코드가 이미 누락된 상태여도 점유/배치 흔적 제거가 가능하도록 항상 포함
    const soloId = soloClanIdForUid(uid);
    removedClanIdsSet.add(soloId);
    if (currentClanId) removedClanIdsSet.add(currentClanId);

    const removedClanIds = Array.from(removedClanIdsSet);
    const removedClanIdSet = new Set(removedClanIds);
    const nextClans = { ...state.clans };
    removedClanIds.forEach((id) => delete nextClans[id]);
    const remainingClanIds = new Set(Object.keys(nextClans));

    const released = releasePlayerPlanetHolds({
      holds: state.planetHolds,
      removedClanIds: removedClanIdSet,
      remainingClanIds,
      uid,
      mode: 'purge_account',
    });

    const nextDeployments = state.deployments.filter(
      (d) =>
        d.deployedByUid !== uid
        && !removedClanIdSet.has(d.clanId)
        && (d.clanId.startsWith('ai_clan_') || remainingClanIds.has(d.clanId)),
    );
    const nextOperations = state.operations.filter(
      (op) => {
        if (removedClanIdSet.has(op.attackerClanId)) return false;
        if (op.defenderClanId != null && removedClanIdSet.has(op.defenderClanId)) return false;
        const attackerValid = op.attackerClanId.startsWith('ai_clan_') || remainingClanIds.has(op.attackerClanId);
        const defenderValid =
          op.defenderClanId == null
          || op.defenderClanId.startsWith('ai_clan_')
          || remainingClanIds.has(op.defenderClanId);
        return attackerValid && defenderValid;
      },
    );

    set({
      clans: nextClans,
      deployments: nextDeployments,
      operations: nextOperations,
    });
    finalizeClanHoldRelease(get, set, released.holds, nextClans);
    await get().persistClanWarFoundation();
    return { ok: true, removedClanIds, releasedPlanetCount: released.releasedPlanetCount };
  },

  purgeAllNonAiClanWorldState: async () => {
    const state = get();
    const nonAiClanIds = Object.keys(state.clans).filter((id) => !id.startsWith('ai_clan_'));
    const nonAiClanIdSet = new Set(nonAiClanIds);
    const nextClans: Record<string, ClanBasicsRecord> = {};
    Object.entries(state.clans).forEach(([id, clan]) => {
      if (!id.startsWith('ai_clan_')) return;
      nextClans[id] = clan;
    });
    const remainingClanIds = new Set(Object.keys(nextClans));

    const released = releasePlayerPlanetHolds({
      holds: state.planetHolds,
      removedClanIds: nonAiClanIdSet,
      remainingClanIds,
      mode: 'purge_all_non_ai',
    });

    const nextDeployments = state.deployments.filter((d) => d.clanId.startsWith('ai_clan_'));
    const removedDeploymentCount = state.deployments.length - nextDeployments.length;
    const nextOperations = state.operations.filter(
      (op) =>
        op.attackerClanId.startsWith('ai_clan_')
        && (op.defenderClanId == null || op.defenderClanId.startsWith('ai_clan_')),
    );
    const removedOperationCount = state.operations.length - nextOperations.length;

    if (
      nonAiClanIds.length === 0
      && released.releasedPlanetCount === 0
      && removedDeploymentCount === 0
      && removedOperationCount === 0
    ) {
      return {
        ok: true,
        removedClanCount: 0,
        releasedPlanetCount: 0,
        removedDeploymentCount: 0,
        removedOperationCount: 0,
      };
    }

    set({
      clans: nextClans,
      deployments: nextDeployments,
      operations: nextOperations,
    });
    finalizeClanHoldRelease(get, set, released.holds, nextClans);
    await get().persistClanWarFoundation();
    return {
      ok: true,
      removedClanCount: nonAiClanIdSet.size,
      releasedPlanetCount: released.releasedPlanetCount,
      removedDeploymentCount,
      removedOperationCount,
    };
  },

  deployCapital: ({ uid, clanId, planetId, assetId, role }) => {
    const hold = get().planetHolds[planetId];
    const list = get().deployments;
    if (!canDeployCapitalAtPlanet(hold, clanId, list, planetId)) {
      return { ok: false, reason: 'cannot_deploy_here' };
    }
    const id = makeId('dep');
    const row: PlanetCapitalDeployment = {
      id,
      planetId,
      clanId,
      deployedByUid: uid,
      assetId,
      role,
      placedAt: Date.now(),
    };
    set({ deployments: [...list, row] });
    void get().persistClanWarFoundation();
    return { ok: true, deploymentId: id };
  },

  startRaidOnPlanet: ({ attackerClanId, defenderClanId, targetPlanetId }) => {
    const id = makeId('op');
    const now = Date.now();
    const op: ClanWarOperation = {
      id,
      attackerClanId,
      defenderClanId,
      targetPlanetId,
      phase: 'staging',
      startedAt: now,
      updatedAt: now,
      ext: {},
    };
    set({ operations: [op, ...get().operations] });
    void get().persistClanWarFoundation();
    return id;
  },

  applyArcCoreTerritorialHold: ({ planetId, systemId, factionSide, operationMeta, neutralizedByPlayer }) => {
    const state = get();
    const prevHold = state.planetHolds[planetId];
    const previousSide = resolveMapFactionSideFromClanIdPure(
      prevHold?.occupierClanId ?? 'neutral',
      state.clans,
    );

    const occupierClanId =
      factionSide === 'NEUTRAL'
        ? 'neutral'
        : factionSide === 'RED'
          ? ARC_CORE_SEED_RED_CLAN_ID
          : ARC_CORE_SEED_BLUE_CLAN_ID;
    const kind: PlanetClanHold['kind'] = factionSide === 'NEUTRAL' ? 'neutral' : 'clan_hold';
    const newSide = resolveMapFactionSideFromClanIdPure(occupierClanId, state.clans);
    const markPlayerNeutralized = Boolean(neutralizedByPlayer) && factionSide === 'NEUTRAL';
    const unchanged =
      prevHold?.occupierClanId === occupierClanId && prevHold?.kind === kind;
    if (unchanged) {
      // 이미 중립 hold인데 플레이어 승리 마커만 없는 경우 — 마커 소급 부여(시드 복구 보호)
      if (markPlayerNeutralized && prevHold && !prevHold.neutralizedAt) {
        set({
          planetHolds: {
            ...state.planetHolds,
            [planetId]: { ...prevHold, neutralizedAt: Date.now() },
          },
        });
        void get().persistClanWarFoundation();
      }
      return { changed: false, previousSide, newSide, operationId: makeId('op_skip') };
    }

    const now = Date.now();
    const nextHold: PlanetClanHold = {
      planetId,
      systemId,
      occupierClanId,
      deedOwnerClanId: null,
      homePlayerUid: null,
      kind,
      capturedAt: now,
      neutralizedAt: markPlayerNeutralized ? now : null,
    };

    const attackerClanId =
      operationMeta.attackerSide === 'RED'
        ? ARC_CORE_SEED_RED_CLAN_ID
        : operationMeta.attackerSide === 'BLUE'
          ? ARC_CORE_SEED_BLUE_CLAN_ID
          : occupierClanId;
    const defenderClanId =
      operationMeta.defenderSide === 'RED'
        ? ARC_CORE_SEED_RED_CLAN_ID
        : operationMeta.defenderSide === 'BLUE'
          ? ARC_CORE_SEED_BLUE_CLAN_ID
          : prevHold?.occupierClanId ?? null;

    const operationId = makeId('op_arc');
    const op: ClanWarOperation = {
      id: operationId,
      attackerClanId,
      defenderClanId: defenderClanId === 'neutral' ? null : defenderClanId,
      targetPlanetId: planetId,
      phase: 'resolved',
      startedAt: now,
      updatedAt: now,
      ext: { ...operationMeta, previousSide, newSide },
    };

    set({
      planetHolds: { ...state.planetHolds, [planetId]: nextHold },
      operations: [op, ...state.operations],
    });
    reassignPlanetGovernorForOccupationSync({
      planetId,
      newFactionSide: factionSide,
    });
    // FrontPressure — 이 성계 + 인접 성계의 posture/battlesPerInterval이 이 hold 변경으로 달라질 수 있음
    invalidateFrontPressure([systemId, ...listAdjacentSystemIds(systemId)]);
    // 분쟁지역 풀 거버너(2026-07-31) — 이 hold 변경으로 SAFE/ELIGIBLE 분류가 바뀔 수 있음
    markContestedPoolDirty();
    void get().persistClanWarFoundation();
    return { changed: true, previousSide, newSide, operationId };
  },

  getHold: (planetId) => get().planetHolds[planetId],

  seedSynthFrontierNeutralHold: (planetId, systemId) => {
    const state = get();
    const cur = state.planetHolds[planetId];
    if (cur?.kind === 'player_home') return;
    if (cur && cur.kind === 'clan_hold' && cur.occupierClanId !== 'neutral') return;

    const now = Date.now();
    const nextHold: PlanetClanHold = {
      planetId,
      systemId,
      occupierClanId: 'neutral',
      homePlayerUid: null,
      kind: 'neutral',
      capturedAt: cur?.capturedAt ?? now,
    };
    if (
      cur?.occupierClanId === nextHold.occupierClanId
      && cur?.kind === nextHold.kind
    ) {
      return;
    }
    set({ planetHolds: { ...state.planetHolds, [planetId]: nextHold } });
    void get().persistClanWarFoundation();
  },

  clearSynthFrontierNeutralHold: (planetId) => {
    const state = get();
    const cur = state.planetHolds[planetId];
    if (!cur) return;
    // seedSynthFrontierNeutralHold가 만든 자리표만 제거 — player_home/독립국/클랜 점유는 보존
    if (cur.kind !== 'neutral' || cur.occupierClanId !== 'neutral') return;
    const nextHolds = { ...state.planetHolds };
    delete nextHolds[planetId];
    set({ planetHolds: nextHolds });
    void get().persistClanWarFoundation();
  },

  listDeploymentsForPlanet: (planetId) => get().deployments.filter((d) => d.planetId === planetId),

  getClanBasics: (clanId) => get().clans[clanId],

  syncNpcAiClanTerritoryFromGalaxy: (systems, options) => {
    const state = get();
    const hubPlanetIds = new Set<string>();
    const territoryClans = listAiClanTerritoryHubClans();
    const captainById = new Map(NPC_CAPTAINS_FROM_CSV.map((c) => [c.id, c]));

    for (const clan of territoryClans) {
      const zone = clan.territoryHubZone;
      if (!zone) continue;
      const hub0 = resolveGameplayZoneHubPlanet(systems, zone);
      if (hub0) hubPlanetIds.add(hub0.planetId);
    }

    let nextHolds: Record<string, PlanetClanHold> = { ...state.planetHolds };
    for (const pid of Object.keys(nextHolds)) {
      const h = nextHolds[pid];
      const occupier = normalizeAiClanId(h.occupierClanId);
      if (occupier.startsWith('ai_clan_') && !hubPlanetIds.has(pid)) {
        const { [pid]: _, ...rest } = nextHolds;
        nextHolds = rest;
      } else if (occupier !== h.occupierClanId && occupier.startsWith('ai_clan_')) {
        nextHolds[pid] = { ...h, occupierClanId: occupier };
      }
    }

    let nextClans: Record<string, ClanBasicsRecord> = { ...state.clans };
    let nextDep = state.deployments.filter((d) => !d.id.startsWith('ai_dep_'));
    const now = Date.now();

    for (const clan of territoryClans) {
      const zone = clan.territoryHubZone;
      if (!zone) continue;
      const cap = captainById.get(clan.leaderCaptainId);
      if (!cap) continue;

      const hub = resolveGameplayZoneHubPlanet(systems, zone);
      if (!hub) continue;

      // CSV 국가(BLUE/RED) 시드 행성 — AI 클랜 허브가 영토 occupier 를 덮어쓰지 않음
      if (resolveTerritorialNationClanIdForPlanet(hub.planetId)) continue;

      const cur = nextHolds[hub.planetId];
      if (cur?.kind === 'player_home') continue;

      const clanId = clan.id;
      const leaderUid = npcCaptainLeaderUid(cap.id);
      const mega = clan.megaFactionId || cap.factionId || 'mega_stellium_alliance';
      const prev = state.clans[clanId] ?? state.clans[normalizeAiClanId(clanId)];
      nextClans[clanId] = {
        id: clanId,
        displayName: clan.displayNameKo.trim(),
        leaderUid,
        megaFactionId: mega,
        createdAt: prev?.createdAt ?? now,
        ext: { source: 'ai_npc_captain', captainId: cap.id, registryClanId: clanId },
      };

      nextHolds[hub.planetId] = {
        planetId: hub.planetId,
        systemId: hub.systemId,
        occupierClanId: clanId,
        homePlayerUid: leaderUid,
        kind: 'clan_hold',
        capturedAt: cur?.capturedAt ?? now,
      };

      const shipId = cap.assignedShipId?.trim();
      if (shipId) {
        const depId = `ai_dep_${cap.id}`;
        nextDep = nextDep.filter((d) => d.id !== depId);
        nextDep.push({
          id: depId,
          planetId: hub.planetId,
          clanId,
          deployedByUid: leaderUid,
          assetId: shipId,
          role: 'garrison',
          placedAt: now,
        });
      }
    }

    const piped = options?.skipOccupationSeedPipeline
      ? { clans: nextClans, holds: nextHolds, occupierChangedPlanetIds: [] as string[], mutated: false }
      : applyPlanetOccupationSeedPipeline(nextHolds, nextClans);
    set({
      clans: piped.clans,
      planetHolds: piped.holds,
      deployments: nextDep,
    });
    if (piped.occupierChangedPlanetIds.length > 0) {
      reassignGovernorsAfterOccupierChanges(
        nextHolds,
        piped.holds,
        piped.clans,
        piped.occupierChangedPlanetIds,
      );
    }
    void get().persistClanWarFoundation();
  },
}));
