import { PlanetDevelopmentCatalog_FROM_BALANCE_CSV } from '../../data/balance/generated/csvPlanetDevelopmentCatalog';

export type PlanetDevelopmentCatalogRow = {
  id: string;
  labelKo: string;
  summaryKo: string;
  enabled: boolean;
  detailModuleKey: string;
  /** 최초 설치 비용(CR) — 0이면 무료/미사용(모듈별 레벨정책 CSV가 따로 있으면 그쪽 우선) */
  installCostCredits: number;
  notesKo: string;
};

type RawPlanetDevelopmentCatalogRow = {
  id?: string;
  labelKo?: string;
  summaryKo?: string;
  enabled?: string;
  detailModuleKey?: string;
  installCostCredits?: string;
  notesKo?: string;
};

let cached: PlanetDevelopmentCatalogRow[] | null = null;

function parseBool(raw: string | undefined): boolean {
  const v = String(raw ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function parseRow(raw: RawPlanetDevelopmentCatalogRow): PlanetDevelopmentCatalogRow {
  return {
    id: String(raw.id ?? '').trim(),
    labelKo: String(raw.labelKo ?? ''),
    summaryKo: String(raw.summaryKo ?? ''),
    enabled: parseBool(raw.enabled),
    detailModuleKey: String(raw.detailModuleKey ?? raw.id ?? '').trim(),
    installCostCredits: Math.max(0, Math.floor(Number(raw.installCostCredits) || 0)),
    notesKo: String(raw.notesKo ?? ''),
  };
}

export function listPlanetDevelopmentCatalogRows(): PlanetDevelopmentCatalogRow[] {
  if (cached) return cached;
  const rows = (PlanetDevelopmentCatalog_FROM_BALANCE_CSV as readonly RawPlanetDevelopmentCatalogRow[])
    .map(parseRow)
    .filter((r) => r.id.length > 0);
  cached = rows;
  return rows;
}

/** enabled=false placeholder 항목 (방위위성 제외) */
export function listPlanetDevelopmentPlaceholderCatalogRows(): PlanetDevelopmentCatalogRow[] {
  return listPlanetDevelopmentCatalogRows().filter(
    (r) => !r.enabled && r.id !== 'defense_satellite',
  );
}

export function getPlanetDevelopmentCatalogRow(id: string): PlanetDevelopmentCatalogRow | null {
  return listPlanetDevelopmentCatalogRows().find((r) => r.id === id) ?? null;
}
