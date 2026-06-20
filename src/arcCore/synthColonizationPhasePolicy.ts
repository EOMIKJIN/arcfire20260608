// ============================================================
// synth_colonization_phase_policy.csv — 개척 단계별 시설·세력·수송
// ============================================================

import { SynthColonizationPhasePolicy_FROM_BALANCE_CSV } from '../data/balance/generated';

export const SYNTH_COLONIZATION_MAX_PHASE = 3;
export const SYNTH_FRONTIER_FACTION_ID = 'independent';

export type SynthColonizationPhaseRow = {
  phaseIndex: number;
  hasTavern: boolean;
  hasTradePort: boolean;
  hasShipyard: boolean;
  useQuadrantFaction: boolean;
  seedTransport: boolean;
};

function parseBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const PHASE_ROWS: SynthColonizationPhaseRow[] = SynthColonizationPhasePolicy_FROM_BALANCE_CSV.map((row) => ({
  phaseIndex: parseNum(row.phaseIndex, 0),
  hasTavern: parseBool(row.hasTavern),
  hasTradePort: parseBool(row.hasTradePort),
  hasShipyard: parseBool(row.hasShipyard),
  useQuadrantFaction: parseBool(row.useQuadrantFaction),
  seedTransport: parseBool(row.seedTransport),
})).sort((a, b) => a.phaseIndex - b.phaseIndex);

export function getSynthColonizationPhaseRow(phase: number): SynthColonizationPhaseRow {
  const p = Math.max(0, Math.min(SYNTH_COLONIZATION_MAX_PHASE, Math.floor(phase)));
  return PHASE_ROWS.find((r) => r.phaseIndex === p) ?? PHASE_ROWS[0]!;
}
