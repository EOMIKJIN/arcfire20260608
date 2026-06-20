// ============================================================
// v2.0 §5-3 — 행성 코어 스탯 R&D 런타임 (연구소 getEffectiveRdTimeHours 연동)
// ============================================================

import { getEffectiveRdTimeHours } from '../../arcCore/balance/facilityLaboratoryLevelPolicy';
import { resolveFacilityLevelByType } from './planetFacilityLevelResolver';
import {
  resolvePlanetCoreStatRdBaseHours,
  resolvePlanetCoreStatRdTargetStage,
  type PlanetCoreStatRdStat,
} from './planetCoreStatRdPolicy';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { PlanetCoreStatRdDetail, PlanetCoreStatRdJob } from '../../store/planetCoreMetricTypes';

export type { PlanetCoreStatRdJob, PlanetCoreStatRdDetail };

function readRdDetail(planetId: string): PlanetCoreStatRdDetail {
  const detail = usePlanetCoreRuntimeStore.getState().byPlanetId[planetId]?.detail?.coreStatRd;
  if (detail?.version === 1) return detail;
  return { version: 1, stages: {}, activeJob: null };
}

function writeRdDetail(planetId: string, patch: Partial<PlanetCoreStatRdDetail>): void {
  const prev = readRdDetail(planetId);
  const core = usePlanetCoreRuntimeStore.getState().byPlanetId[planetId];
  if (!core) return;
  usePlanetCoreRuntimeStore.getState().patchPlanetCore(planetId, {
    detail: {
      ...core.detail,
      coreStatRd: {
        ...prev,
        ...patch,
        version: 1,
      },
    },
  });
}

export function resolvePlanetCoreStatStage(planetId: string, stat: PlanetCoreStatRdStat): number {
  const stages = readRdDetail(planetId).stages;
  return Math.max(0, Math.min(14, Math.floor(stages?.[stat] ?? 0)));
}

/** 연구소 레벨 보정 적용 R&D 시간(h) */
export function resolvePlanetEffectiveStatRdHours(
  planetId: string,
  stat: PlanetCoreStatRdStat,
): number | null {
  const stage = resolvePlanetCoreStatStage(planetId, stat);
  const target = resolvePlanetCoreStatRdTargetStage(stage);
  if (target == null) return null;
  const baseHours = resolvePlanetCoreStatRdBaseHours(stage);
  const labLevel = resolveFacilityLevelByType(planetId, 'laboratory');
  return getEffectiveRdTimeHours(baseHours, labLevel);
}

export function tryCompletePlanetCoreStatRd(planetId: string): boolean {
  const rd = readRdDetail(planetId);
  const job = rd.activeJob;
  if (!job || Date.now() < job.completeAtMs) return false;
  const stages = { ...rd.stages, [job.statType]: job.targetStage };
  writeRdDetail(planetId, { stages, activeJob: null });
  return true;
}

export function startPlanetCoreStatRd(
  planetId: string,
  stat: PlanetCoreStatRdStat,
): { ok: true } | { ok: false; reason: string } {
  if (resolveFacilityLevelByType(planetId, 'laboratory') <= 0) {
    return { ok: false, reason: 'research_lab_required' };
  }
  const rd = readRdDetail(planetId);
  if (rd.activeJob) return { ok: false, reason: 'rd_in_progress' };
  const fromStage = resolvePlanetCoreStatStage(planetId, stat);
  const targetStage = resolvePlanetCoreStatRdTargetStage(fromStage);
  if (targetStage == null) return { ok: false, reason: 'max_stage' };
  const hours = resolvePlanetEffectiveStatRdHours(planetId, stat);
  if (hours == null) return { ok: false, reason: 'cannot_rd' };
  const startedAtMs = Date.now();
  writeRdDetail(planetId, {
    activeJob: {
      statType: stat,
      fromStage,
      targetStage,
      startedAtMs,
      completeAtMs: startedAtMs + hours * 3600 * 1000,
    },
  });
  return { ok: true };
}

export function readPlanetCoreStatRdSnapshot(planetId: string): {
  labLevel: number;
  technologyStage: number;
  nextTechnologyRdHours: number | null;
  activeJob: PlanetCoreStatRdJob | null;
} {
  tryCompletePlanetCoreStatRd(planetId);
  const rd = readRdDetail(planetId);
  const labLevel = resolveFacilityLevelByType(planetId, 'laboratory');
  return {
    labLevel,
    technologyStage: resolvePlanetCoreStatStage(planetId, 'technology'),
    nextTechnologyRdHours: resolvePlanetEffectiveStatRdHours(planetId, 'technology'),
    activeJob: rd.activeJob ?? null,
  };
}
