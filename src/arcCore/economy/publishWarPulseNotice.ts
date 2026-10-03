// ============================================================
// 일 1회 전쟁 경제 뉴스 0~1줄 — overlay 없음. 부트/틱 금지.
// ============================================================

import { useBarBoardStore } from '../../store/barBoardStore';
import {
  getArcCoreLearningStoreSnapshot,
  isArcCoreLearningStoreHydrated,
} from '../learning/arcCoreLearningStore';
import { resolveWarPulseKind, type WarPulseKind } from './resolveWarPulseKind';
import type { FactionVaultDailyRow } from './factionVaultDailySummary';
import { isEarlyWarImmersionOverlayLocked } from '../../navigation/earlyWarImmersionGate';

export function peekPrevWindowConvoyTrips(todayKey: string): number | undefined {
  if (!isArcCoreLearningStoreHydrated()) return undefined;
  const timeline = getArcCoreLearningStoreSnapshot().kpiTimeline;
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    const row = timeline[i];
    if (!row || row.dayKey === todayKey) continue;
    const trips = row.economy?.windowConvoyTrips;
    if (typeof trips === 'number') return trips;
  }
  return undefined;
}

export function resolveWarPulseKindFromBatch(input: {
  kstDayKey: string;
  windowConvoyTrips?: number;
  vaultDaily?: FactionVaultDailyRow | null;
}): WarPulseKind | null {
  const annex = input.vaultDaily?.vaults.blue.windowKindSum.stellium_annex;
  return resolveWarPulseKind({
    windowConvoyTrips: input.windowConvoyTrips,
    prevWindowConvoyTrips: peekPrevWindowConvoyTrips(input.kstDayKey),
    blueAnnexDelta: typeof annex === 'number' ? annex : undefined,
  });
}

export function publishWarPulseNotice(input: {
  kstDayKey: string;
  windowConvoyTrips?: number;
  vaultDaily?: FactionVaultDailyRow | null;
}): WarPulseKind | null {
  const dayKey = String(input.kstDayKey ?? '').trim();
  if (!dayKey) return null;

  const kind = resolveWarPulseKindFromBatch(input);
  if (!kind) return null;

  const i18nKey = kind === 'convoyCut' ? 'news.warPulse.convoyCut' : 'news.warPulse.vaultAnnex';
  useBarBoardStore.getState().pushOrRefreshNotice(
    {
      i18nKey,
      title: kind === 'convoyCut' ? 'Front — Convoy' : 'Front — Vault',
      body: kind,
      tag: 'economy',
    },
    `war_pulse_${dayKey}`,
    { silentBadge: isEarlyWarImmersionOverlayLocked() },
  );
  return kind;
}
