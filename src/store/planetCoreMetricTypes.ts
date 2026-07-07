// ============================================================
// 행성 핵심 지표 — 상위 스칼라는 planetCoreRuntimeStore.
// 세부 속성은 이 파일에 단계적으로 추가(에너지는 R=Resource 스칼라에 통합).
// ============================================================

/** Resource(자원·에너지 통합 스칼라) 하위 속성 자리 — 차후 광물·궤도 기여 등 */
export type PlanetResourceDetail = {
  version?: number;
  /** 스타터 genesis 표 정정 — 1회 런타임 재정렬 rev */
  genesisRealignRev?: number;
};

/** PlanetDevelopment — 모듈별 런타임 슬롯 (방위위성·향후 9개) */
export type PlanetDevelopmentDetail = {
  version: 1;
  byModuleId?: Record<string, PlanetDefenseSatelliteDetail | PlanetFacilityModuleDetail | Record<string, unknown>>;
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

/** 미세 피해 누적 — 정수 게이지 반영 전 소수 잔량 */
export type PlanetAttackMicroRemainder = {
  resource?: number;
  population?: number;
  defense?: number;
  technology?: number;
  environment?: number;
};

/** 행성 5대 스탯 공격 피해 텔레메트리 — `PlanetCoreRuntime.detail.attackDamage` */
export type PlanetAttackDamageDetail = {
  version: 1;
  daily: PlanetAttackDailyCounter;
  lastEvents: PlanetAttackLastEvent[];
  totalEvents: number;
  /** impact_scale 미세 반영 시 소수 잔량 */
  microRemainder?: PlanetAttackMicroRemainder;
  /** CSV 기준 D/T 재정렬 마이그레이션 rev */
  realignRev?: number;
};

/** Economy Fabric — 운영 실물(수송·피해·재고) 누적 · 일 1회 reconcile */
export type PlanetEconomyFabricEvent = {
  kind: 'attack' | 'convoy_settlement' | 'player_trade' | 'daily_reconcile';
  atMs: number;
  payload: Record<string, number>;
};

export type PlanetEconomyFabricDetail = {
  version: 1;
  window: {
    kstDayKey: string;
    convoyProfitCredits: number;
    convoyTrips: number;
    supplyUnitsDelivered: number;
    attackDefenseLoss: number;
    attackPopulationLoss: number;
    /** 플레이어 무역 — 금일 총 거래액(수수료 전) */
    playerTradeGrossCredits: number;
    playerTradeCount: number;
    playerBuyUnits: number;
    playerSellUnits: number;
  };
  lastDailyReconcile?: {
    atMs: number;
    supplyStockScale: number;
    operationalBase: number;
    resourceNudge: number;
    populationNudge: number;
    /** 일 1회 생산지 재고 합 스냅샷 — R 힌트 산출용 */
    supplyStockUnitsSnapshot?: number;
    /** reconcile 직전 윈도우 KPI (학습·오버레이 read-only) */
    windowConvoyProfit?: number;
    windowConvoyTrips?: number;
    windowPlayerTradeGross?: number;
    windowSummary: PlanetEconomyFabricDetail['window'];
  };
  recentEvents: PlanetEconomyFabricEvent[];
};

/** 선술집 바운티 보드 항목 — v2.0 §6-3 */
export type TavernBountyEntry = {
  id: string;
  titleKey: string;
  rewardCredits: number;
  mercTier: string;
  postedAtMs: number;
  expiresAtMs: number;
};

/** 행성 방위위성 — 플레이어 설치·업그레이드 런타임 정본 */
/** v3.1 — standard Lv1~10 · epic L11+ (facility_upgrade_duration_global.csv) */
export type PlanetFacilityDurationTier = 'standard' | 'epic';

export type PlanetDefenseSatelliteUpgradeJob = {
  targetLevel: number;
  startedAtMs: number;
  completeAtMs: number;
  /** omit → standard (구 세이브 호환) */
  durationTier?: PlanetFacilityDurationTier;
};

export type PlanetDefenseSatelliteDetail = {
  version: 1;
  /** 최초 설치 완료 여부 */
  installed: boolean;
  /** 1..10 — `planet_defense_satellite_level_policy.csv` */
  level: number;
  /** 진행 중 업그레이드 (없으면 null) */
  upgradeJob?: PlanetDefenseSatelliteUpgradeJob | null;
  updatedAtMs?: number;
};

/**
 * 범용 시설 개발 모듈 런타임 정본 — 방위위성과 동일한 install·레벨업 구조를 공유한다.
 * (조선소·무역소 등 facility 모듈이 `development.byModuleId[모듈id]`에 이 형태로 저장)
 */
export type PlanetFacilityModuleDetail = {
  version: 1;
  /** 최초 설치(메뉴 활성) 완료 여부 */
  installed: boolean;
  /** 1.. — 모듈별 레벨 정책 CSV 기준 */
  level: number;
  /** 조선소 — 현재 레벨까지 건조 완료 hullTierKey (무역소 listing 필터) */
  builtHullTierKeys?: string[];
  /** 연구소 — R&D 속도 감소율 캐시(%) */
  rdSpeedBonusPct?: number;
  /** 선술집 — 활성 바운티 수 · 마지막 갱신 시각 */
  activeBountyCount?: number;
  lastBountyRefreshTimestamp?: number;
  /** 선술집 — 바운티 보드 슬롯 (일일 배치 갱신) */
  bountyBoard?: TavernBountyEntry[];
  /** 진행 중 업그레이드 (없으면 null) */
  upgradeJob?: PlanetDefenseSatelliteUpgradeJob | null;
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

/** 5대 스탯 키 — UI·일일 배치 추세 공용 */
export type PlanetCoreStatKey =
  | 'resource'
  | 'population'
  | 'defense'
  | 'technology'
  | 'environment';

/** ArcCore base + player dev share — 0~100 gauge 분해 (Table-First genesis base) */
export type PlanetCoreGaugeCompositionDetail = {
  version: 1;
  arcCoreBase: Record<PlanetCoreStatKey, number>;
  playerDevShare: Record<PlanetCoreStatKey, number>;
  lastAppliedKstDayKey?: string;
};

/** 아크코어 일일 운영 배치(arc_core_daily_ops) 직후 Δ — 행성정보 시세 화살표 */
export type PlanetCoreStatOpsTrendDetail = {
  version: 1;
  /** `planetAttackKstDayKey()` — 배치 완료 KST 일자 */
  kstDayKey: string;
  /** `arc_core_daily_ops_policy.observationWindowHours` */
  observationWindowHours: number;
  batchCompletedAtMs: number;
  /** 일일 배치 전후 Δ — 0.1 단위 */
  delta: Record<PlanetCoreStatKey, number>;
};

/** v2.0 §5-3 — 행성 코어 스탯 15단계 R&D */
export type PlanetCoreStatRdJob = {
  statType: 'resource' | 'population' | 'defense' | 'technology' | 'environment';
  fromStage: number;
  targetStage: number;
  startedAtMs: number;
  completeAtMs: number;
};

export type PlanetCoreStatRdDetail = {
  version: 1;
  stages?: Partial<Record<PlanetCoreStatRdJob['statType'], number>>;
  activeJob?: PlanetCoreStatRdJob | null;
};

/** 일 1회 유지비 정산 — runArcCorePlanetUpkeepDailyPass */
export type PlanetDailyUpkeepDetail = {
  kstDayKey: string;
  paid: boolean;
  creditsDue: number;
  creditsPaid: number;
};

/** 일 1회 소유권 증서 가격 — runPlanetOwnershipDeedPricingDailyPass */
export type PlanetOwnershipDeedPricingDetail = {
  version: 1;
  kstDayKey: string;
  priceCredits: number;
  /** 연간 실물 수익(일 순·총 gross × annual_days) */
  annualTangibleCredits: number;
  /** PGP·구역·시설 기반 정성·영토가치 */
  qualitativeCredits: number;
  dailyGrossCredits: number;
  dailyNetCredits: number;
  pgpBmu: number;
  updatedAtMs: number;
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
  /** 운영 실물 → 스탯·무역 재고 연결 패브릭 */
  economyFabric?: PlanetEconomyFabricDetail;
  /** 연구소 R&D 15단계 진행 */
  coreStatRd?: PlanetCoreStatRdDetail;
  /** 일 1회 아크코어 스탯 운영 배치 Δ — 행성정보 추세 표시 */
  statOpsTrend?: PlanetCoreStatOpsTrendDetail;
  /** 플레이어 행성 일 유지비 납부 결과 — stat equilibrium 입력 */
  lastDailyUpkeep?: PlanetDailyUpkeepDetail;
  /** gauge = arcCoreBase + playerDevShare — 일일 composition apply 정본 */
  gaugeComposition?: PlanetCoreGaugeCompositionDetail;
  /** 일 1회 배치 산출 소유권 증서 가격 — 무역소 listing 정본 */
  ownershipDeedPricing?: PlanetOwnershipDeedPricingDetail;
};
