import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  listTerritorialCombatPolicies,
  listTerritorialCombatPoliciesForCampaign,
} from './arcCoreTerritorialCombatPolicy';
import { TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC } from './territorialCombatCampaign';
import { hydrateDynamicContestedZones } from './dynamicContestedZoneStore';

const STORAGE_KEY = 'arcfire_arc_core_territorial_combat_v1';

export type CampaignGroupState = {
  lastPassAtMs: number;
  lastOrderIndex: number;
  /** 미리 고정된 다음 판정·맵 링 예고 순번 (0..N-1) — 판정 완료 시에만 전진 */
  nextPreviewOrderIndex: number;
};

type Persisted = {
  byPlanetId: Record<string, { lastPassAtMs: number }>;
  campaignGroups: Record<string, CampaignGroupState>;
};

let mem: Persisted = { byPlanetId: {}, campaignGroups: {} };
let hydrated = false;
let previewScheduleRevision = 0;
const previewScheduleListeners = new Set<() => void>();

function notifyTerritorialPreviewScheduleChanged(): void {
  previewScheduleRevision += 1;
  for (const listener of previewScheduleListeners) {
    listener();
  }
}

export function subscribeTerritorialPreviewSchedule(listener: () => void): () => void {
  previewScheduleListeners.add(listener);
  return () => {
    previewScheduleListeners.delete(listener);
  };
}

export function getTerritorialPreviewScheduleRevision(): number {
  return previewScheduleRevision;
}

function normalizePreviewOrderIndex(index: number, campaignLength: number): number {
  if (campaignLength <= 0) return 0;
  return ((index % campaignLength) + campaignLength) % campaignLength;
}

function migrateCampaignGroupStates(): boolean {
  let mutated = false;
  const policies = listTerritorialCombatPolicies();
  for (const group of listTerritorialCampaignGroups(policies)) {
    const groupPolicies = listTerritorialCombatPoliciesForCampaign(group);
    const n = groupPolicies.length;
    if (n === 0) continue;

    const raw = mem.campaignGroups[group];
    const lastPassAtMs = typeof raw?.lastPassAtMs === 'number' ? raw.lastPassAtMs : 0;
    const lastOrderIndex = typeof raw?.lastOrderIndex === 'number' ? raw.lastOrderIndex : -1;
    let nextPreviewOrderIndex =
      typeof raw?.nextPreviewOrderIndex === 'number' && Number.isFinite(raw.nextPreviewOrderIndex)
        ? raw.nextPreviewOrderIndex
        : lastOrderIndex < 0
          ? 0
          : normalizePreviewOrderIndex(lastOrderIndex + 1, n);
    nextPreviewOrderIndex = normalizePreviewOrderIndex(nextPreviewOrderIndex, n);

    const next: CampaignGroupState = {
      lastPassAtMs,
      lastOrderIndex,
      nextPreviewOrderIndex,
    };
    if (
      !raw
      || raw.lastPassAtMs !== next.lastPassAtMs
      || raw.lastOrderIndex !== next.lastOrderIndex
      || raw.nextPreviewOrderIndex !== next.nextPreviewOrderIndex
    ) {
      mem.campaignGroups[group] = next;
      mutated = true;
    }
  }
  return mutated;
}

export async function hydrateArcCoreTerritorialCombatState(): Promise<void> {
  if (hydrated) return;
  // 동적 분쟁지역이 캠페인 순번(길이)에 합류하므로 마이그레이션 전에 hydrate
  await hydrateDynamicContestedZones();
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Persisted>;
      mem = {
        byPlanetId:
          parsed.byPlanetId && typeof parsed.byPlanetId === 'object'
            ? parsed.byPlanetId
            : {},
        campaignGroups:
          parsed.campaignGroups && typeof parsed.campaignGroups === 'object'
            ? (parsed.campaignGroups as Record<string, CampaignGroupState>)
            : {},
      };
    }
    if (migrateCampaignGroupStates()) {
      await persistTerritorialCombatState();
    }
  } catch {
    /* ignore */
  } finally {
    hydrated = true;
  }
}

/** 부트 시 캠페인별 nextPreviewOrderIndex 미리 확정(저장) */
export async function ensureTerritorialCampaignPreviewSchedules(): Promise<void> {
  await hydrateArcCoreTerritorialCombatState();
  await hydrateDynamicContestedZones();
  if (migrateCampaignGroupStates()) {
    await persistTerritorialCombatState();
  }
}

export function getTerritorialCombatLastPassAtMs(planetId: string): number | null {
  const row = mem.byPlanetId[planetId];
  return typeof row?.lastPassAtMs === 'number' ? row.lastPassAtMs : null;
}

export function getTerritorialCampaignGroupState(
  campaignGroup: string,
): CampaignGroupState | null {
  const row = mem.campaignGroups[campaignGroup];
  if (!row) return null;
  return {
    lastPassAtMs: row.lastPassAtMs,
    lastOrderIndex: row.lastOrderIndex,
    nextPreviewOrderIndex: row.nextPreviewOrderIndex,
  };
}

/** 미리 고정된 다음 판정·맵 링 예고 순번 */
export function resolveScheduledPreviewOrderIndex(
  campaignGroup: string,
  campaignLength: number,
): number {
  const row = mem.campaignGroups[campaignGroup];
  const idx = typeof row?.nextPreviewOrderIndex === 'number' ? row.nextPreviewOrderIndex : 0;
  return normalizePreviewOrderIndex(idx, campaignLength);
}

async function persistTerritorialCombatState(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}

export async function markTerritorialCombatPassCompleted(
  planetId: string,
  nowMs: number,
  campaign?: { group: string; orderIndex: number },
): Promise<void> {
  let previewAdvanced = false;
  mem = {
    ...mem,
    byPlanetId: {
      ...mem.byPlanetId,
      [planetId]: { lastPassAtMs: nowMs },
    },
    campaignGroups: { ...mem.campaignGroups },
  };

  if (campaign) {
    const groupPolicies = listTerritorialCombatPoliciesForCampaign(campaign.group);
    const n = groupPolicies.length;
    const nextPreviewOrderIndex =
      n > 0 ? normalizePreviewOrderIndex(campaign.orderIndex + 1, n) : 0;
    mem.campaignGroups[campaign.group] = {
      lastPassAtMs: nowMs,
      lastOrderIndex: campaign.orderIndex,
      nextPreviewOrderIndex,
    };
    previewAdvanced = true;
  }

  await persistTerritorialCombatState();
  if (previewAdvanced) {
    notifyTerritorialPreviewScheduleChanged();
  }
}

/** 캠페인 그룹 — passInterval(초)당 1행성만 순차 판정 (예고 순번 = nextPreviewOrderIndex) */
export function resolveTerritorialCampaignPlanetDue(
  campaignGroup: string,
  policies: Array<{ planetId: string; campaignOrder: number }>,
  nowMs: number,
): { planetId: string; orderIndex: number } | null {
  if (policies.length === 0) return null;
  const sorted = [...policies].sort((a, b) => a.campaignOrder - b.campaignOrder);
  const intervalMs = TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC * 1000;
  const state = getTerritorialCampaignGroupState(campaignGroup);
  if (state != null && nowMs - state.lastPassAtMs < intervalMs) {
    return null;
  }
  const orderIndex = resolveScheduledPreviewOrderIndex(campaignGroup, sorted.length);
  const target = sorted[orderIndex];
  if (!target) return null;
  return { planetId: target.planetId, orderIndex };
}

export function listTerritorialCampaignGroups(
  policies: Array<{ campaignGroup: string | null; enabled: boolean }>,
): string[] {
  const groups = new Set<string>();
  for (const p of policies) {
    if (!p.enabled || !p.campaignGroup) continue;
    groups.add(p.campaignGroup);
  }
  return Array.from(groups);
}
