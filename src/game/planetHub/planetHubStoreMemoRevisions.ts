import type { PlanetCoreMetricsDetail } from '../../store/planetCoreMetricTypes';
import { readDefenseSatelliteDetailFromCoreDetail } from '../planetDevelopment/planetDefenseSatelliteRuntime';

/** Zustand selector — `JSON.stringify` 대신 bounded revision key (허브 re-render·GC 톱니 완화) */
export function missionProgressMemoRev(progresses: Record<string, { objectives?: Record<string, boolean> }>): string {
  const keys = Object.keys(progresses);
  if (keys.length === 0) return '';
  keys.sort();
  let rev = `${keys.length}`;
  for (const id of keys) {
    const objectives = progresses[id]?.objectives ?? {};
    const objIds = Object.keys(objectives);
    let done = 0;
    for (let i = 0; i < objIds.length; i += 1) {
      if (objectives[objIds[i]!]) done += 1;
    }
    rev += `|${id}:${done}/${objIds.length}`;
  }
  return rev;
}

function facilityModuleMemoToken(
  moduleId: string,
  mod: { installed?: boolean; level?: number; upgradeJob?: { completeAtMs?: number; targetLevel?: number } | null; updatedAtMs?: number } | null | undefined,
): string {
  if (!mod) return `${moduleId}:0`;
  const job = mod.upgradeJob;
  return `${moduleId}:${mod.installed ? 1 : 0}:${mod.level ?? 0}:${job?.completeAtMs ?? 0}:${job?.targetLevel ?? 0}:${mod.updatedAtMs ?? 0}`;
}

/** 행성개발 모듈 게이트(무역소·조선소 등) — byModuleId 전체 serialize 금지 */
export function planetHubFacilityDevMemoRev(
  detail: PlanetCoreMetricsDetail | undefined,
): string {
  const byModule = detail?.development?.byModuleId;
  if (!byModule) return '';
  const ids = Object.keys(byModule).sort();
  return ids.map((id) => facilityModuleMemoToken(id, byModule[id] as Parameters<typeof facilityModuleMemoToken>[1])).join(';');
}

/** 방위위성·궤도 월드오브젝트 — defense_satellite 모듈/legacy 병합(byModuleId·legacy 분기 무시 방지) */
export function planetHubDefenseSatelliteMemoRev(
  detail: PlanetCoreMetricsDetail | undefined,
): string {
  const merged = readDefenseSatelliteDetailFromCoreDetail(detail);
  return facilityModuleMemoToken(
    'defense_satellite',
    merged as Parameters<typeof facilityModuleMemoToken>[1],
  );
}
