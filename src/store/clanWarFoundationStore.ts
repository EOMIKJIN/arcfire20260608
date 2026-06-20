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
import { resolveGameplayZoneHubPlanet } from '../clanWar/resolveZoneHubPlanet';
import { aiClanIdForNpcCaptain, npcCaptainLeaderUid } from '../clanWar/aiNpcClanIds';
import { NPC_CAPTAINS_FROM_CSV } from '../data/generated';
import { usePlayerStore } from './playerStore';
import {
  loadClanWarFoundationDb,
  resetClanWarFoundationDb,
  saveClanWarFoundationDb,
} from '../world/clanWarFoundationDb';
import {
  seedPlanetOccupationHoldsFromBalance,
  ARC_CORE_SEED_BLUE_CLAN_ID,
  ARC_CORE_SEED_RED_CLAN_ID,
} from '../arcCore/balance/seedPlanetOccupationFromBalance';
import {
  resolveMapFactionSideFromClanIdPure,
  type MapFactionSide,
} from '../galaxyMap/mapFactionSideCore';

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
  /** 무역소 소유권 아이템 구매로 점유 획득(타 클랜 점유 행성은 실패) */
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
  }) => { changed: boolean; previousSide: MapFactionSide; newSide: MapFactionSide; operationId: string };
  getHold: (planetId: string) => PlanetClanHold | undefined;
  listDeploymentsForPlanet: (planetId: string) => PlanetCapitalDeployment[];
  getClanBasics: (clanId: string) => ClanBasicsRecord | undefined;
  /**
   * NPC AI 클랜장 3인(구역별) — 플레이 성계 구역의 기하학적 중심에 가까운 허브 행성에 클랜·점유·기함 1척 시드.
   * 플레이어 `player_home`이 이미 있으면 해당 행성은 건너뜀.
   */
  syncNpcAiClanTerritoryFromGalaxy: (systems: Record<string, StarSystem>) => void;
  /** synth 아크코어 개방 직후 — 블루/레드·플레이어 home 은 덮어쓰지 않음 */
  seedSynthFrontierNeutralHold: (planetId: string, systemId: string) => void;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export const useClanWarFoundationStore = create<ClanWarFoundationState>((set, get) => ({
  hydrated: false,
  clans: {},
  planetHolds: {},
  deployments: [],
  operations: [],

  loadLocalClanWarFoundation: async () => {
    try {
      const loaded = await loadClanWarFoundationDb();
      const seeded = seedPlanetOccupationHoldsFromBalance(loaded.planetHolds);
      const nextClans = { ...loaded.clans, ...seeded.clans };
      const holdsChanged = Object.keys(seeded.holds).length > Object.keys(loaded.planetHolds).length;
      set({
        clans: nextClans,
        planetHolds: seeded.holds,
        deployments: loaded.deployments,
        operations: loaded.operations,
      });
      if (holdsChanged) {
        await saveClanWarFoundationDb({
          clans: nextClans,
          planetHolds: seeded.holds,
          deployments: loaded.deployments,
          operations: loaded.operations,
        });
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
    const nextHold: PlanetClanHold = {
      planetId,
      systemId,
      occupierClanId: clanId,
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
    if (!canClaimAsHomePlanet(hold, clanId)) {
      return { ok: false, reason: 'occupied_by_other_clan' };
    }
    const now = Date.now();
    const nextHold: PlanetClanHold = {
      planetId,
      systemId,
      occupierClanId: clanId,
      homePlayerUid: uid,
      kind: 'clan_hold',
      capturedAt: now,
    };
    set({ planetHolds: { ...get().planetHolds, [planetId]: nextHold } });
    const p = usePlayerStore.getState().player;
    if (p && p.uid === uid) {
      usePlayerStore.getState().setPlayer({
        ...p,
        political: { ...p.political, clanId },
      });
      void usePlayerStore.getState().persist();
    }
    void get().persistClanWarFoundation();
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

    let releasedPlanetCount = 0;
    const nextPlanetHolds: Record<string, PlanetClanHold> = {};
    for (const [planetId, hold] of Object.entries(state.planetHolds)) {
      if (hold.occupierClanId === clanId) {
        releasedPlanetCount += 1;
        continue;
      }
      nextPlanetHolds[planetId] = hold;
    }

    const nextDeployments = state.deployments.filter((d) => d.clanId !== clanId);
    const nextOperations = state.operations.filter(
      (op) => op.attackerClanId !== clanId && op.defenderClanId !== clanId,
    );

    set({
      clans: nextClans,
      planetHolds: nextPlanetHolds,
      deployments: nextDeployments,
      operations: nextOperations,
    });

    usePlayerStore.getState().setPlayer({
      ...p,
      homePlanetId: null,
      political: { ...p.political, clanId: null },
    });
    void usePlayerStore.getState().persist();
    void get().persistClanWarFoundation();

    return { ok: true, dissolvedClanId: clanId, releasedPlanetCount };
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

    let releasedPlanetCount = 0;
    const nextPlanetHolds: Record<string, PlanetClanHold> = {};
    const nextClanIdSet = new Set(Object.keys(nextClans));
    for (const [planetId, hold] of Object.entries(state.planetHolds)) {
      const isTargetPlayerHold =
        hold.homePlayerUid === uid || removedClanIdSet.has(hold.occupierClanId);
      // orphan hold 방어: 클랜 레코드가 사라졌는데 점유만 남은 비정상 상태 제거
      const isOrphanNonAiHold =
        !hold.occupierClanId.startsWith('ai_clan_') && !nextClanIdSet.has(hold.occupierClanId);
      if (isTargetPlayerHold || isOrphanNonAiHold) {
        releasedPlanetCount += 1;
        continue;
      }
      nextPlanetHolds[planetId] = hold;
    }

    const nextDeployments = state.deployments.filter(
      (d) =>
        d.deployedByUid !== uid
        && !removedClanIdSet.has(d.clanId)
        && (d.clanId.startsWith('ai_clan_') || nextClanIdSet.has(d.clanId)),
    );
    const nextOperations = state.operations.filter(
      (op) => {
        if (removedClanIdSet.has(op.attackerClanId)) return false;
        if (op.defenderClanId != null && removedClanIdSet.has(op.defenderClanId)) return false;
        const attackerValid = op.attackerClanId.startsWith('ai_clan_') || nextClanIdSet.has(op.attackerClanId);
        const defenderValid =
          op.defenderClanId == null
          || op.defenderClanId.startsWith('ai_clan_')
          || nextClanIdSet.has(op.defenderClanId);
        return attackerValid && defenderValid;
      },
    );

    set({
      clans: nextClans,
      planetHolds: nextPlanetHolds,
      deployments: nextDeployments,
      operations: nextOperations,
    });
    await get().persistClanWarFoundation();
    return { ok: true, removedClanIds, releasedPlanetCount };
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

    let releasedPlanetCount = 0;
    const nextPlanetHolds: Record<string, PlanetClanHold> = {};
    Object.entries(state.planetHolds).forEach(([planetId, hold]) => {
      if (hold.occupierClanId.startsWith('ai_clan_')) {
        nextPlanetHolds[planetId] = hold;
      } else {
        releasedPlanetCount += 1;
      }
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
      && releasedPlanetCount === 0
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
      planetHolds: nextPlanetHolds,
      deployments: nextDeployments,
      operations: nextOperations,
    });
    await get().persistClanWarFoundation();
    return {
      ok: true,
      removedClanCount: nonAiClanIdSet.size,
      releasedPlanetCount,
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

  applyArcCoreTerritorialHold: ({ planetId, systemId, factionSide, operationMeta }) => {
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
    const unchanged =
      prevHold?.occupierClanId === occupierClanId && prevHold?.kind === kind;
    if (unchanged) {
      return { changed: false, previousSide, newSide, operationId: makeId('op_skip') };
    }

    const now = Date.now();
    const nextHold: PlanetClanHold = {
      planetId,
      systemId,
      occupierClanId,
      homePlayerUid: null,
      kind,
      capturedAt: now,
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

  listDeploymentsForPlanet: (planetId) => get().deployments.filter((d) => d.planetId === planetId),

  getClanBasics: (clanId) => get().clans[clanId],

  syncNpcAiClanTerritoryFromGalaxy: (systems) => {
    const state = get();
    const hubPlanetIds = new Set<string>();
    for (const cap of NPC_CAPTAINS_FROM_CSV) {
      if (!cap.isAiClanLeader || !cap.aiClanZone || !cap.aiClanName.trim()) continue;
      const hub0 = resolveGameplayZoneHubPlanet(systems, cap.aiClanZone);
      if (hub0) hubPlanetIds.add(hub0.planetId);
    }
    let nextHolds: Record<string, PlanetClanHold> = { ...state.planetHolds };
    for (const pid of Object.keys(nextHolds)) {
      const h = nextHolds[pid];
      if (h.occupierClanId.startsWith('ai_clan_') && !hubPlanetIds.has(pid)) {
        const { [pid]: _, ...rest } = nextHolds;
        nextHolds = rest;
      }
    }

    let nextClans: Record<string, ClanBasicsRecord> = { ...state.clans };
    let nextDep = state.deployments.filter((d) => !d.id.startsWith('ai_dep_'));
    const now = Date.now();

    for (const cap of NPC_CAPTAINS_FROM_CSV) {
      if (!cap.isAiClanLeader || !cap.aiClanZone || !cap.aiClanName.trim()) continue;
      const hub = resolveGameplayZoneHubPlanet(systems, cap.aiClanZone);
      if (!hub) continue;

      const cur = nextHolds[hub.planetId];
      if (cur?.kind === 'player_home') continue;

      const clanId = aiClanIdForNpcCaptain(cap.id);
      const leaderUid = npcCaptainLeaderUid(cap.id);
      const mega = cap.factionId ?? 'mega_stellium_alliance';
      const prev = state.clans[clanId];
      nextClans[clanId] = {
        id: clanId,
        displayName: cap.aiClanName.trim(),
        leaderUid,
        megaFactionId: mega,
        createdAt: prev?.createdAt ?? now,
        ext: { source: 'ai_npc_captain', captainId: cap.id },
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

    set({ clans: nextClans, planetHolds: nextHolds, deployments: nextDep });
    void get().persistClanWarFoundation();
  },
}));
