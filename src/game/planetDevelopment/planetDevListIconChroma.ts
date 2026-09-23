// 행성개발 리스트 아이콘 — 단색→원색 채색량 (레벨·업그레이드 진행)

export const PLANET_DEV_LIST_ICON_PX = 52;
export const PLANET_DEV_LIST_ICON_MONO = '#8B93A1';
export const PLANET_DEV_LIST_LEVEL_TAG_BG = '#252930';
export const PLANET_DEV_LIST_LEVEL_TAG_INK = '#F4F6F8';
export const PLANET_DEV_LIST_LEVEL_TAG_INK_MUTED = '#B8BEC9';

export function formatPlanetDevListLevelTag(level: number): string {
  const n = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
  return `LV.${n}`;
}

const PLANET_DEV_LIST_ICON_CHROMA: Record<string, string> = {
  defense_satellite: '#C39214',
  dev_orbit_shipyard: '#2F6F9A',
  dev_trade_port: '#1F8A54',
  dev_research_lab: '#1A8FB8',
  dev_population_dome: '#B84A78',
};

const DEFAULT_CHROMA = '#2F6F9A';

export function resolvePlanetDevListIconChromaColor(catalogId: string): string {
  return PLANET_DEV_LIST_ICON_CHROMA[catalogId] ?? DEFAULT_CHROMA;
}

export function resolvePlanetDevIconChromaPct(input: {
  enabled: boolean;
  installed: boolean;
  level: number;
  maxLevel: number;
  isInstalling: boolean;
  isUpgrading: boolean;
  upgradeProgressPct: number;
}): number {
  if (!input.enabled) return 0;
  const max = Math.max(1, Math.floor(input.maxLevel) || 15);
  const progress = Math.max(0, Math.min(100, input.upgradeProgressPct)) / 100;
  if (input.isInstalling) {
    return Math.max(0, Math.min(1, progress / max));
  }
  if (!input.installed) return 0;
  const level = Math.max(0, input.level);
  const effective = input.isUpgrading ? level + progress : level;
  return Math.max(0, Math.min(1, effective / max));
}
