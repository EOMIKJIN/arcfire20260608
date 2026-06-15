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

/** 행성 공격 1회 적용 기록 — `applyPlanetAttackCoreDamage` */
export type PlanetAttackLastEvent = {
  attackKind: string;
  atMs: number;
  sourceId?: string;
  /** 실제 반영된 Δ (클램프 후) */
  applied: {
    resource: number;
    population: number;
    defense: number;
    technology: number;
    environment: number;
  };
};

/** KST 일별 공격 이벤트 카운터 — daily_event_cap 집계 */
export type PlanetAttackDailyCounter = {
  kstDayKey: string;
  byKind: Record<string, number>;
};

/** 행성 5대 스탯 공격 피해 텔레메트리 — `PlanetCoreRuntime.detail.attackDamage` */
export type PlanetAttackDamageDetail = {
  version: 1;
  daily: PlanetAttackDailyCounter;
  lastEvents: PlanetAttackLastEvent[];
  totalEvents: number;
};

/** 행성 방위위성 — 플레이어 업그레이드 레벨(런타임 정본) */
export type PlanetDefenseSatelliteDetail = {
  version: 1;
  /** 1..10 — `planet_defense_satellite_level_policy.csv` */
  level: number;
  updatedAtMs?: number;
};

/** 아크코어 마스터 밸런스(`planet_leveling_progression.csv`) — 런타임 동적 보정 메타 */
export type PlanetMasterBalanceDetail = {
  version: 1;
  zoneIndex: number;
  sectorBand: string;
  recommendedPilotLevel: number;
  requiredFleetMinDps: number;
  targetCreditsEarned: number;
  enemyAffinityKind: string;
  recommendedHullTierKey: string;
  recommendedWeaponTierKey: string;
  combatsInZone: number;
  combatMinutesTotal: number;
  targetEngageSec: number;
  mineralUpgradeCapAtZone: number;
  /** level_band_targets 대비 CPM 런타임 계수(1.0=기본) */
  runtimeCpmMul?: number;
  /** `01_레벨업구조` · play_scenario_zone_planets */
  scenarioLocationKo?: string;
  /** `play_scenario_economy.csv` — 구간별 성장·채굴 목표(없는 zone은 생략) */
  growthStageKo?: string;
  scenarioTargetItemKo?: string;
  scenarioRequiredCredits?: number;
  scenarioMineralQty?: number;
  scenarioMiningMinutes?: number;
  scenarioBountyMinutes?: number;
};

/**
 * 런타임 `PlanetCoreRuntime.detail` — 직렬화 가능한 얕은 JSON 위주.
 * 필드는 필요할 때만 채운다.
 */
export type PlanetCoreMetricsDetail = {
  resource?: PlanetResourceDetail;
  development?: PlanetDevelopmentDetail;
  masterBalance?: PlanetMasterBalanceDetail;
  defenseSatellite?: PlanetDefenseSatelliteDetail;
  /** 행성 공격 요소(드론·공성 등) → 5대 스탯 피해 이력 */
  attackDamage?: PlanetAttackDamageDetail;
};
