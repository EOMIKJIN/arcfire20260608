// ============================================================
// 행성 정보창(포트rait·설명·배경) — 개발 단계별 Table-First 정본
// `tables/balance/planet_info_panel_stage.csv`
// ============================================================

import { PlanetInfoPanelStage_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type PlanetInfoPanelStageRow = {
  planetId: string;
  stageTier: number;
  synthPhaseMin: number;
  devModulesMin: number;
  descriptionKo: string;
  descriptionEn: string;
  infoPanelPortraitAssetKey: string;
  backdropImageAssetKey: string;
};

let rowsCache: PlanetInfoPanelStageRow[] | null = null;
let rowsByPlanetId: Map<string, PlanetInfoPanelStageRow[]> | null = null;

function parseNum(raw: unknown, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRow(raw: (typeof PlanetInfoPanelStage_FROM_BALANCE_CSV)[number]): PlanetInfoPanelStageRow {
  return {
    planetId: String(raw.planetId ?? '').trim(),
    stageTier: parseNum(raw.stageTier, 0),
    synthPhaseMin: Math.max(0, parseNum(raw.synthPhaseMin, 0)),
    devModulesMin: Math.max(0, parseNum(raw.devModulesMin, 0)),
    descriptionKo: String(raw.descriptionKo ?? '').trim(),
    descriptionEn: String(raw.descriptionEn ?? '').trim(),
    infoPanelPortraitAssetKey: String(raw.infoPanelPortraitAssetKey ?? '').trim(),
    backdropImageAssetKey: String(raw.backdropImageAssetKey ?? '').trim(),
  };
}

function getRows(): PlanetInfoPanelStageRow[] {
  if (!rowsCache) {
    rowsCache = PlanetInfoPanelStage_FROM_BALANCE_CSV.map(normalizeRow).filter((r) => r.planetId.length > 0);
  }
  return rowsCache;
}

function getRowsByPlanetId(): Map<string, PlanetInfoPanelStageRow[]> {
  if (!rowsByPlanetId) {
    const map = new Map<string, PlanetInfoPanelStageRow[]>();
    for (const row of getRows()) {
      const list = map.get(row.planetId) ?? [];
      list.push(row);
      map.set(row.planetId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.stageTier - b.stageTier);
    }
    rowsByPlanetId = map;
  }
  return rowsByPlanetId;
}

/** synth 행성 — planetId 전용 없으면 `_synth_default` 폴백 */
export function listPlanetInfoPanelStageCandidates(planetId: string): PlanetInfoPanelStageRow[] {
  const id = planetId.trim();
  if (!id) return [];
  const map = getRowsByPlanetId();
  const exact = map.get(id) ?? [];
  if (exact.length > 0) return exact;
  if (id.startsWith('synth_') && id.endsWith('_p')) {
    return map.get('_synth_default') ?? [];
  }
  return map.get('*') ?? [];
}

export function resolveBestPlanetInfoPanelStageRow(
  planetId: string,
  synthPhase: number,
  devModulesInstalled: number,
): PlanetInfoPanelStageRow | null {
  const candidates = listPlanetInfoPanelStageCandidates(planetId);
  if (candidates.length === 0) return null;
  let best: PlanetInfoPanelStageRow | null = null;
  for (const row of candidates) {
    if (synthPhase < row.synthPhaseMin) continue;
    if (devModulesInstalled < row.devModulesMin) continue;
    if (!best || row.stageTier > best.stageTier) best = row;
  }
  return best;
}

/** balance CSV hot reload · 테스트 */
export function invalidatePlanetInfoPanelStageCache(): void {
  rowsCache = null;
  rowsByPlanetId = null;
}
