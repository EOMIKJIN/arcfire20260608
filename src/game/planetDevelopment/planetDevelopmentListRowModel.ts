// ============================================================
// 행성개발 목록 행 — 스냅샷 → 리스트 카드 뷰 모델
// ============================================================

import type { PlanetDevelopmentCatalogRow } from './planetDevelopmentCatalog';
import { t } from '../../i18n';
import { tryCompleteLaboratoryUpgrade } from './planetLaboratoryDevelopment';
import { tryCompleteOrbitShipyardUpgrade } from './planetOrbitShipyardDevelopment';
import { tryCompleteTavernFacilityUpgrade } from './planetTavernFacilityDevelopment';
import { tryCompleteTradePortUpgrade } from './planetTradePortDevelopment';
import { tryCompleteDefenseSatelliteUpgrade } from '../../systems/planetaryDefense/planetDefenseSatelliteDevelopment';

export type PlanetDevFacilitySnapshotSlice = {
  installed: boolean;
  level: number;
  isInstalling: boolean;
  isUpgrading: boolean;
  upgradeProgressPct: number;
  upgradeJob?: { targetLevel: number } | null;
  isCsvWorldBaseline?: boolean;
  activeSatelliteCount?: number;
};

export type PlanetDevListRowProgress = {
  label: string;
  progressPct: number;
  a11yLabel: string;
};

export type PlanetDevListRowView = {
  catalogId: string;
  enabled: boolean;
  placeholderGlyph: string;
  label: string;
  summary: string;
  completeStatus: string | null;
  progress: PlanetDevListRowProgress | null;
};

const PLACEHOLDER_GLYPH: Record<string, string> = {
  defense_satellite: '🛰',
  dev_orbit_shipyard: '⚓',
  dev_trade_port: '🏪',
  dev_research_lab: '⚗',
  dev_population_dome: '🍺',
  dev_energy_plant: '⚡',
  dev_mineral_refinery: '⛏',
  dev_trade_route: '🛸',
  dev_smart_farm: '🌾',
  dev_eco_restore: '🌿',
  dev_fleet_support: '🛡',
};

function resolveLabel(row: PlanetDevelopmentCatalogRow): string {
  const key = `planetDev.label.${row.id}`;
  const val = t(key);
  return val === key ? row.labelKo : val;
}

function resolveSummary(row: PlanetDevelopmentCatalogRow): string {
  const key = `planetDev.summary.${row.id}`;
  const val = t(key);
  return val === key ? row.summaryKo : val;
}

export function resolvePlanetDevListPlaceholderGlyph(catalogId: string): string {
  return PLACEHOLDER_GLYPH[catalogId] ?? '◫';
}

function resolveCompleteStatus(
  catalogId: string,
  snap: PlanetDevFacilitySnapshotSlice,
): string | null {
  if (!snap.installed || snap.isInstalling || snap.isUpgrading) return null;

  switch (catalogId) {
    case 'defense_satellite':
      return t('planetDev.defenseInstalled', {
        level: snap.level,
        count: snap.activeSatelliteCount ?? 0,
      });
    case 'dev_orbit_shipyard':
      return snap.isCsvWorldBaseline
        ? t('planetDev.worldBuiltInstalled', { level: snap.level })
        : t('planetDev.shipyardInstalled', { level: snap.level });
    case 'dev_trade_port':
      return snap.isCsvWorldBaseline
        ? t('planetDev.worldBuiltInstalled', { level: snap.level })
        : t('planetDev.tradePortInstalled', { level: snap.level });
    case 'dev_research_lab':
      return t('planetDev.researchLabInstalled', { level: snap.level });
    case 'dev_population_dome':
      return snap.isCsvWorldBaseline
        ? t('planetDev.worldBuiltInstalled', { level: snap.level })
        : t('planetDev.populationDomeInstalled', { level: snap.level });
    default:
      return t('planetDev.listStatusCompleteGeneric', { level: snap.level });
  }
}

function resolveProgress(snap: PlanetDevFacilitySnapshotSlice): PlanetDevListRowProgress | null {
  if (snap.isInstalling) {
    const pct = snap.upgradeProgressPct;
    return {
      label: t('planetDev.installProgress'),
      progressPct: pct,
      a11yLabel: t('planetDev.installProgressA11y', { pct }),
    };
  }
  if (snap.isUpgrading) {
    const pct = snap.upgradeProgressPct;
    const target = snap.upgradeJob?.targetLevel;
    const from = snap.level;
    const label = target != null && from > 0
      ? t('planetDev.listUpgradeProgress', { from, to: target })
      : t('planetDev.upgradeProgress');
    return {
      label,
      progressPct: pct,
      a11yLabel: t('planetDev.listUpgradeProgressA11y', { pct }),
    };
  }
  return null;
}

export function buildPlanetDevListRowView(
  row: PlanetDevelopmentCatalogRow,
  snapshot: PlanetDevFacilitySnapshotSlice | null,
): PlanetDevListRowView {
  const label = resolveLabel(row);
  const summary = resolveSummary(row);
  const placeholderGlyph = resolvePlanetDevListPlaceholderGlyph(row.id);

  if (!row.enabled || !snapshot) {
    return {
      catalogId: row.id,
      enabled: row.enabled,
      placeholderGlyph,
      label,
      summary,
      completeStatus: null,
      progress: null,
    };
  }

  return {
    catalogId: row.id,
    enabled: row.enabled,
    placeholderGlyph,
    label,
    summary,
    completeStatus: resolveCompleteStatus(row.id, snapshot),
    progress: resolveProgress(snapshot),
  };
}

export function tryCompleteAllPlanetDevJobs(planetId: string): void {
  tryCompleteDefenseSatelliteUpgrade(planetId);
  tryCompleteOrbitShipyardUpgrade(planetId);
  tryCompleteTradePortUpgrade(planetId);
  tryCompleteLaboratoryUpgrade(planetId);
  tryCompleteTavernFacilityUpgrade(planetId);
}

export function hasAnyPlanetDevJobInProgress(
  snapshots: readonly PlanetDevFacilitySnapshotSlice[],
): boolean {
  for (let i = 0; i < snapshots.length; i++) {
    const s = snapshots[i];
    if (s.isInstalling || s.isUpgrading) return true;
  }
  return false;
}
