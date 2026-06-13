// ============================================================
// Macro SIM delta → economyPriceOverlay + aabsPolicy ingest
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AABS_MULTIPLIER_KEYS, type AabsMultiplierKey } from '../aabs/aabsConstants';
import { useAabsPolicyStore } from '../aabs/aabsPolicyStore';
import { getEconomyPriceMicroPolicyNum } from '../balance/balanceTableRegistry';
import type { BalanceOverlayDelta } from './balanceOverlayDeltaTypes';
import { BALANCE_OVERLAY_DELTA_SCHEMA_VERSION } from './balanceOverlayDeltaTypes';
import {
  ECONOMY_CATEGORY_KEYS,
  type EconomyCategoryKey,
  useEconomyPriceOverlayStore,
} from './economyPriceOverlayStore';
import { EconomySimOverlayDelta_FROM_SIM } from '../../data/balance/generated/economySimOverlayDelta';

const INGEST_STORAGE_KEY = 'arcfire_balance_overlay_delta_ingest_v1';

type IngestState = {
  lastDeltaId: string | null;
  ingestedAt: number;
};

export type BalanceOverlayIngestResult = {
  ran: boolean;
  deltaId: string | null;
  skippedReason?: 'same_delta' | 'invalid_schema' | 'empty';
};

function parseTargetMul(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function isValidDelta(delta: BalanceOverlayDelta | null | undefined): delta is BalanceOverlayDelta {
  if (!delta) return false;
  if (delta.schemaVersion !== BALANCE_OVERLAY_DELTA_SCHEMA_VERSION) return false;
  return typeof delta.deltaId === 'string' && delta.deltaId.trim().length > 0;
}

function hasActionableTargets(delta: BalanceOverlayDelta): boolean {
  const cat = delta.categoryTargetMul ?? {};
  const aabs = delta.aabsTargetMul ?? {};
  const catAny = ECONOMY_CATEGORY_KEYS.some((k) => parseTargetMul(cat[k]) != null);
  const aabsAny = AABS_MULTIPLIER_KEYS.some((k) => parseTargetMul(aabs[k]) != null);
  return catAny || aabsAny;
}

async function loadIngestState(): Promise<IngestState> {
  try {
    const raw = await AsyncStorage.getItem(INGEST_STORAGE_KEY);
    if (!raw) return { lastDeltaId: null, ingestedAt: 0 };
    const parsed = JSON.parse(raw) as Partial<IngestState>;
    return {
      lastDeltaId: typeof parsed.lastDeltaId === 'string' ? parsed.lastDeltaId : null,
      ingestedAt: typeof parsed.ingestedAt === 'number' ? parsed.ingestedAt : 0,
    };
  } catch {
    return { lastDeltaId: null, ingestedAt: 0 };
  }
}

async function saveIngestState(state: IngestState): Promise<void> {
  await AsyncStorage.setItem(INGEST_STORAGE_KEY, JSON.stringify(state));
}

/**
 * 번들된 SIM delta 1회 ingest — 일일 배치 `runMarketMicroAdjustPass` 직전 호출.
 * 동일 deltaId는 재적용하지 않음(누적은 overlay store step으로 유지).
 */
export async function ingestBalanceOverlayDeltaIfPending(
  delta: BalanceOverlayDelta = EconomySimOverlayDelta_FROM_SIM,
): Promise<BalanceOverlayIngestResult> {
  if (!isValidDelta(delta)) {
    return { ran: false, deltaId: null, skippedReason: 'invalid_schema' };
  }

  const prior = await loadIngestState();
  if (prior.lastDeltaId === delta.deltaId) {
    return { ran: false, deltaId: delta.deltaId, skippedReason: 'same_delta' };
  }

  if (!hasActionableTargets(delta)) {
    await saveIngestState({ lastDeltaId: delta.deltaId, ingestedAt: Date.now() });
    return { ran: false, deltaId: delta.deltaId, skippedReason: 'empty' };
  }

  const priceStore = useEconomyPriceOverlayStore.getState();
  const aabsStore = useAabsPolicyStore.getState();
  if (!priceStore.hydrated) await priceStore.loadAsync();
  if (!aabsStore.hydrated) await aabsStore.loadAsync();

  const maxStep = getEconomyPriceMicroPolicyNum('max_daily_price_step_pct', 2) / 100;
  const maxDrift = getEconomyPriceMicroPolicyNum('max_cumulative_price_drift_pct', 10) / 100;
  const combatWeight = Math.max(0, Math.min(1, Number(delta.combatWeight) || 0));
  const macroWeight = 1;

  for (const key of ECONOMY_CATEGORY_KEYS) {
    const targetRaw = parseTargetMul(delta.categoryTargetMul?.[key]);
    if (targetRaw == null) continue;
    const blended = 1 + (targetRaw - 1) * macroWeight;
    priceStore.applyCategoryStep(key, blended, maxStep, maxDrift);
  }

  for (const key of AABS_MULTIPLIER_KEYS) {
    if (key === 'combatDifficulty' && combatWeight <= 0) continue;
    const targetRaw = parseTargetMul(delta.aabsTargetMul?.[key as AabsMultiplierKey]);
    if (targetRaw == null) continue;
    const weight = key === 'combatDifficulty' ? combatWeight : macroWeight;
    const blended = 1 + (targetRaw - 1) * weight;
    aabsStore.applyStepToward(key, blended);
  }

  priceStore.markAdjust(delta.virtualPopulation ?? 0);
  await priceStore.persistAsync();
  await aabsStore.persistAsync();
  await saveIngestState({ lastDeltaId: delta.deltaId, ingestedAt: Date.now() });

  if (__DEV__) {
    console.log(
      `[ArcCore/Economy] overlay delta ingest id=${delta.deltaId} kpi=${delta.kpi?.status ?? 'n/a'}`,
    );
  }

  return { ran: true, deltaId: delta.deltaId };
}
