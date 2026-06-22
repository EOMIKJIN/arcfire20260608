import AsyncStorage from '@react-native-async-storage/async-storage';
import { TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC } from './territorialCombatCampaign';

const STORAGE_KEY = 'arcfire_arc_core_territorial_combat_v1';

type CampaignGroupState = {
  lastPassAtMs: number;
  lastOrderIndex: number;
};

type Persisted = {
  byPlanetId: Record<string, { lastPassAtMs: number }>;
  campaignGroups: Record<string, CampaignGroupState>;
};

let mem: Persisted = { byPlanetId: {}, campaignGroups: {} };
let hydrated = false;

export async function hydrateArcCoreTerritorialCombatState(): Promise<void> {
  if (hydrated) return;
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
            ? parsed.campaignGroups
            : {},
      };
    }
  } catch {
    /* ignore */
  } finally {
    hydrated = true;
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
  };
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
  mem = {
    ...mem,
    byPlanetId: {
      ...mem.byPlanetId,
      [planetId]: { lastPassAtMs: nowMs },
    },
    campaignGroups: campaign
      ? {
          ...mem.campaignGroups,
          [campaign.group]: {
            lastPassAtMs: nowMs,
            lastOrderIndex: campaign.orderIndex,
          },
        }
      : mem.campaignGroups,
  };
  await persistTerritorialCombatState();
}

/** 캠페인 그룹 — passInterval(초)당 1행성만 순차 판정 */
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
  const nextOrderIndex =
    state == null ? 0 : (state.lastOrderIndex + 1) % sorted.length;
  const target = sorted[nextOrderIndex];
  if (!target) return null;
  return { planetId: target.planetId, orderIndex: nextOrderIndex };
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
