// ============================================================
// 행성 핵심 지표 — 상위 스칼라는 planetCoreRuntimeStore.
// 세부 속성은 이 파일에 단계적으로 추가(에너지는 R=Resource 스칼라에 통합).
// ============================================================

/** Resource(자원·에너지 통합 스칼라) 하위 속성 자리 — 차후 광물·궤도 기여 등 */
export type PlanetResourceDetail = {
  version?: number;
};

/** 발전/교통 등 하위 속성 자리 */
export type PlanetDevelopmentDetail = {
  version?: number;
};

/**
 * 런타임 `PlanetCoreRuntime.detail` — 직렬화 가능한 얕은 JSON 위주.
 * 필드는 필요할 때만 채운다.
 */
export type PlanetCoreMetricsDetail = {
  resource?: PlanetResourceDetail;
  development?: PlanetDevelopmentDetail;
};
