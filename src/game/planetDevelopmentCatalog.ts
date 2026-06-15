/** 행성개발 리스트 — 향후 Table-First CSV로 이전 예정 */

export type PlanetDevelopmentCatalogItem = {
  id: string;
  labelKo: string;
  summaryKo: string;
  /** true — `PlanetDevelopmentOverlayContent`에서 탭 가능 */
  enabled: boolean;
};

/** 향후 추가 예정 임시 항목 (방위위성은 목록 UI에서 별도 1행) */
export const PLANET_DEVELOPMENT_PLACEHOLDER_ITEMS: readonly PlanetDevelopmentCatalogItem[] = [
  { id: 'dev_energy_plant', labelKo: '에너지 발전소', summaryKo: '행성 R(자원) 생산 · 임시', enabled: false },
  { id: 'dev_mineral_refinery', labelKo: '광물 정제소', summaryKo: '광물 가공 · 임시', enabled: false },
  { id: 'dev_population_dome', labelKo: '인구 거주 돔', summaryKo: 'P(인구) 성장 · 임시', enabled: false },
  { id: 'dev_research_lab', labelKo: '과학 연구소', summaryKo: 'T(기술) 연구 · 임시', enabled: false },
  { id: 'dev_trade_route', labelKo: '무역 항로 확장', summaryKo: '무역소 수익 · 임시', enabled: false },
  { id: 'dev_orbit_shipyard', labelKo: '궤도 조선소', summaryKo: '함대 지원 · 임시', enabled: false },
  { id: 'dev_smart_farm', labelKo: '스마트 농장', summaryKo: '식량·보급 · 임시', enabled: false },
  { id: 'dev_eco_restore', labelKo: '환경 재생망', summaryKo: 'E(환경) 회복 · 임시', enabled: false },
  { id: 'dev_fleet_support', labelKo: '함대 지원 기지', summaryKo: 'D(방어) 보조 · 임시', enabled: false },
] as const;

export function listPlanetDevelopmentPlaceholderItems(): PlanetDevelopmentCatalogItem[] {
  return [...PLANET_DEVELOPMENT_PLACEHOLDER_ITEMS];
}
