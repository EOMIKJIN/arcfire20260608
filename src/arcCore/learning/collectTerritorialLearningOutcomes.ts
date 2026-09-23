// ============================================================
// 최근 분쟁 결과 수집 — 관측 tail 우선, operations는 폴백
// ============================================================

import type { ArcCoreObservationEvent } from '../observation/arcCoreObservationTypes';
import type { ClanWarOperation } from '../../types';
import type { TerritorialLearningDecision, TerritorialLearningOutcome } from './factionPowerTypes';

function asDecision(raw: unknown): TerritorialLearningDecision | null {
  if (raw === 'battle' || raw === 'neutral_declare' || raw === 'status_quo') return raw;
  return null;
}

function asSource(raw: unknown): TerritorialLearningOutcome['source'] | null {
  if (raw === 'npc_auto' || raw === 'player_wave' || raw === 'operation_fallback') return raw;
  return null;
}

export function territorialOutcomesFromObservations(
  events: readonly ArcCoreObservationEvent[],
  cutoffMs: number,
): TerritorialLearningOutcome[] {
  const out: TerritorialLearningOutcome[] = [];
  for (let i = 0; i < events.length; i += 1) {
    const ev = events[i]!;
    if (ev.kind !== 'territorial.pass_result') continue;
    if (ev.wallTimeMs < cutoffMs) continue;
    const decision = asDecision(ev.payload.decision);
    if (!decision) continue;
    const source = asSource(ev.payload.source) ?? 'npc_auto';
    out.push({
      planetId: ev.planetId,
      wallTimeMs: ev.wallTimeMs,
      decision,
      holdChanged: ev.payload.holdChanged === true,
      previousSide: String(ev.payload.previousSide ?? ''),
      newSide: String(ev.payload.newSide ?? ''),
      source,
      attackerSide: ev.payload.attackerSide != null ? String(ev.payload.attackerSide) : undefined,
      attackerWon: typeof ev.payload.attackerWon === 'boolean' ? ev.payload.attackerWon : undefined,
    });
  }
  return out;
}

function operationSource(ext: Record<string, unknown>): TerritorialLearningOutcome['source'] | null {
  const src = String(ext.source ?? '');
  if (src === 'arc_core_territorial') return 'operation_fallback';
  if (src === 'player_wave_defense_win' || src === 'player_wave') return 'player_wave';
  return null;
}

export function territorialOutcomesFromOperations(
  operations: readonly ClanWarOperation[],
  cutoffMs: number,
): TerritorialLearningOutcome[] {
  const out: TerritorialLearningOutcome[] = [];
  for (let i = 0; i < operations.length; i += 1) {
    const op = operations[i]!;
    if (op.updatedAt < cutoffMs && op.startedAt < cutoffMs) continue;
    const ext = op.ext ?? {};
    const source = operationSource(ext);
    if (!source) continue;
    const decision = asDecision(ext.decision) ?? 'battle';
    out.push({
      planetId: op.targetPlanetId,
      wallTimeMs: op.updatedAt || op.startedAt,
      decision,
      holdChanged: true,
      previousSide: String(ext.previousSide ?? ''),
      newSide: String(ext.newSide ?? ''),
      source,
      attackerSide: ext.attackerSide != null ? String(ext.attackerSide) : undefined,
      attackerWon: typeof ext.attackerWon === 'boolean' ? ext.attackerWon : undefined,
    });
  }
  return out;
}

/** 관측이 있으면 관측만. 없으면 operations(홀드 변경만) 폴백. */
export function collectTerritorialLearningOutcomes(input: {
  observations: readonly ArcCoreObservationEvent[];
  operations: readonly ClanWarOperation[];
  nowMs: number;
  windowMs?: number;
}): TerritorialLearningOutcome[] {
  const windowMs = input.windowMs ?? 24 * 60 * 60 * 1000;
  const cutoff = input.nowMs - windowMs;
  const fromObs = territorialOutcomesFromObservations(input.observations, cutoff);
  if (fromObs.length > 0) return fromObs;
  return territorialOutcomesFromOperations(input.operations, cutoff);
}
