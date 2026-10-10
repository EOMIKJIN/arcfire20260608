export const BLUE_CLAN = 'balance_seed_faction_blue';
export const RED_CLAN = 'balance_seed_faction_red';
export const NEUTRAL_CLAN = 'neutral';

export type FactionPaint = 'BLUE' | 'RED' | 'NEUTRAL' | 'INDEPENDENT';

export type PersonaId =
  | 'mixed_ref'
  | 'front_annex'
  | 'trader'
  | 'colonize_edge'
  | 'story_main';

export type ActionKind =
  | 'quest'
  | 'combat'
  | 'trade'
  | 'annex_path'
  | 'colonize'
  | 'travel'
  | 'idle'
  | 'skill'
  | 'gear'
  | 'develop'
  | 'capital';

export type JournalKind =
  | 'TRAVEL'
  | 'LAND'
  | 'COMBAT'
  | 'TRADE'
  | 'QUEST'
  | 'SAT'
  | 'ANNEX'
  | 'COLONIZE'
  | 'TERRITORIAL'
  | 'DAILY'
  | 'HOLD'
  | 'ANALYZE'
  | 'LEVEL'
  | 'DESTROY'
  | 'REBOARD'
  | 'LEARN'
  | 'SKILL'
  | 'GEAR'
  | 'DEVELOP'
  | 'CAPITAL'
  | 'MINE'
  | 'SEARCH'
  | 'EXCHANGE';

export type JournalEntry = {
  t: number;
  day: number;
  tick: number;
  kind: JournalKind;
  line: string;
  hold?: boolean;
  reason?: string;
  /** 이미착륙 연속 — 콘솔·저널 미기록 */
  silent?: boolean;
  /** 앱 emitPlayVerb 와 같은 행동 문자열. 스텔라 판단 재생용. */
  obs?: Array<{ verb: import('../../../src/game/playerObserve/playerObserveSink').PlayerObserveVerb; detail: string }>;
};

export type PlanetSlot = {
  planetId: string;
  systemId: string;
  occupierClanId: string;
  kind: 'neutral' | 'clan_hold' | 'player_home' | 'player_independent';
  capturedAt: number;
  neutralizedAt: number | null;
  satLevel: number;
  combatEnabled: boolean;
  contested: boolean;
  labelKo: string;
  hasTrade: boolean;
  tcl: number;
};

export type ActiveQuest = {
  missionId: string;
  title: string;
  objIndex: number;
  acceptedDay: number;
  /** 이 퀘스트의 직전 목표 행성 — 행성이 안 적힌 격파 목표의 전장 */
  lastPlanetId?: string;
  /** 항로 위험으로 보류된 틱 한도 — 이때까지는 복귀하지 않는다 */
  routeBlockedUntil?: number;
  /** 항로 위험으로 처음 막힌 틱 — 퀘스트를 끝낼 때까지 유지 */
  blockedSince?: number;
};

export type FocusStats = {
  resource: number;
  population: number;
  defense: number;
  technology: number;
  environment: number;
};

export type DevJob = {
  moduleId: string;
  labelKo: string;
  targetLevel: number;
  completeTick: number;
};

export type WorldState = {
  runId: string;
  persona: PersonaId;
  nowMs: number;
  day: number;
  tick: number;
  ticksPerDay: number;
  currentPlanetId: string;
  currentSystemId: string;
  level: number;
  totalExp: number;
  credits: number;
  blueVault: number;
  combatWins: number;
  combatLosses: number;
  trades: number;
  mineralCargo: number;
  /** 무역소에서 산 교역품 단위. 매도는 이게 있을 때만. 옛 세계 파일에는 없을 수 있다. */
  goodsCargo?: number;
  /** 도착 전까지 지키는 이동 목적지와 정한 틱. */
  travelGoal?: string;
  travelGoalTick?: number;
  /** tg_* 교역로 왕복 중이면 그 화물. 사기 전이면 qty 0. */
  tgRun?: { goodId: string; supply: string; demand: string; qty: number; costUnit: number; sellNetUnit: number };
  /** 교역로 매도 이후 연속 수련 전투 수. 상한을 넘으면 교역로를 먼저 본다. */
  trainStreak?: number;
  /** A-7b 실기 `globalEngageHpMul` — 적 유효HP 배율(0.7~1.3). 일 1회 교전 시간으로 보정. */
  engageHpMul?: number;
  /** 최근 교전 시간(초) 최대 20개 — 실기 listRecentMatchSummaries(20) 대응. */
  engageSecLog?: number[];
  /** 공급지·품목별 당일 매입량. 재고 상한 근사용. */
  tgBought?: Record<string, { day: number; qty: number }>;
  gems: number;
  gemExchangeDay: number;
  gemExchangeWeek: number;
  gemsSpentDay: number;
  gemsSpentWeek: number;
  annexOk: number;
  annexFail: number;
  satInstalls: number;
  colonizeOk: number;
  questAccepted: number;
  questCleared: number;
  holdCount: number;
  lastHoldReason: string;
  lastHoldStreak: number;
  alreadyLandKey: string;
  alreadyLandRepeat: number;
  lastQuestId: string;
  lastAction: ActionKind;
  stuckTicks: number;
  storyCursor: number;
  sideCursor: number;
  completedMissionIds: string[];
  completedLookup: Record<string, true>;
  learnedLookup: Record<string, true>;
  activeQuest: ActiveQuest | null;
  /** 승률이 낮아 보류한 퀘스트. 승률이 회복되면 다시 집는다. */
  parkedQuests: ActiveQuest[];
  planets: Record<string, PlanetSlot>;
  dailyBatchCount: number;
  flags: string[];
  hangarShips: number;
  hangarMax: number;
  shipDestroys: number;
  reboards: number;
  actionCounts: Record<string, number>;
  skillPoints: number;
  learnedSkills: string[];
  equipped: Record<string, string>;
  gearScore: number;
  /** 플레이봇 구간 함선. 격납고 척수와 별개. */
  hullTierKey: string;
  hullName: string;
  hullShipId: string;
  hullRank: number;
  hullSaveDay: number;
  hullJustBought: boolean;
  /** 지금 함선의 광물 강화 statId→레벨. 함선이 바뀌면 비운다(함선별 · 넘겨주지 않음 · 2026-10-10). */
  hullUpgrades?: Record<string, number>;
  /** 채굴·수색 광물 종류별 적재(oreId→개수). 합계 = mineralCargo. 옛 세계 파일에는 없을 수 있다. */
  oreCargo?: Record<string, number>;
  /** 광물 강화 횟수(벤치 지표). */
  mineralUpgradeCount?: number;
  /** 같은 도전(행성·행동·세팅) 파괴 횟수 — 20회면 막음(대표님 2026-10-10 인간 플레이 기준) */
  challengeLosses?: Record<string, number>;
  /** 파괴 뒤 이 틱까지는 도전을 쉬고 안전 전투·우회 */
  detourUntilTick?: number;
  /** 매복(이동 중 조우 파괴)당한 성계 → 횟수·마지막 틱·레벨. 레벨이 오르거나 며칠 지나면 잊는다(사람처럼) */
  ambushMemory?: Record<string, { n: number; tick: number; level: number }>;
  /** 경험치 정체 판단 — 마지막으로 본 누적 경험치와 그 틱 */
  progressExpMark?: number;
  progressExpTick?: number;
  /** 목적 있는 이동이 위험 관문에 처음 막힌 틱 — 그 이동이 성공하면 지운다 */
  purposeBlockedSince?: number;
  /** 산 함선을 잃은 성계 → 그 틱 */
  hullLossTick?: Record<string, number>;
  /** 도전 전 강화 미루기 — 목표·전투력 서명과 횟수 */
  prepDefer?: { key: string; n: number };
  /** 정복 마무리 대상 — 중립화한 행성 · 이 틱까지 위성·편입을 먼저 */
  conquestFocus?: { planetId: string; untilTick: number };
  /** 마지막으로 land 를 남긴 행성. 앱 landOnPlanet 의 같은 행성 재착륙 무시와 맞춘다. */
  obsLand?: string;
  /** 다음 저널 줄에 붙일 앱 형식 행동. */
  obsPending?: Array<{ verb: import('../../../src/game/playerObserve/playerObserveSink').PlayerObserveVerb; detail: string }>;
  /** 퀘스트 전투 연패. 승률이 회복되거나 이기면 0. */
  questCombatLossStreak: number;
  /** 이기기 어려운 퀘스트를 피해 머무는 수련 행성. */
  trainPlanetId: string;
  trainMissionId: string;
  trainUntilLevel: number;
  salvageDay: number;
  salvageCount: number;
  effFights: number;
  effWins: number;
  effExp: number;
  effCredits: number;
  focusPlanetId: string;
  focusSystemId: string;
  devLevels: Record<string, number>;
  capitalDestroyed: boolean;
  lastQuestPlanetId: string;
  /** `__neighbor_system__` / `__discovery_planet__` — 수락 성계. */
  questOriginSystemId: string;
  skillLearned: number;
  gearBuys: number;
  devUpgrades: number;
  questBuyCount: number;
  focusStats: FocusStats;
  devJob: DevJob | null;
  /** 유저 체감 초. 가상 틱과 별개. persist 금지. */
  earlyFeelSec: number;
  earlyFeelClosed: boolean;
  earlyFeelOpeningApplied: boolean;
  earlyFeelReported: boolean;
  earlyFeelBeats: Array<{
    tSec: number;
    kind: string;
    line: string;
    feelSec: number;
    spine: boolean;
  }>;
};

export type KpiSnapshot = {
  day: number;
  level: number;
  totalExp: number;
  credits: number;
  blueVault: number;
  blue: number;
  red: number;
  neutral: number;
  independent: number;
  combatWins: number;
  combatLosses: number;
  trades: number;
  annexOk: number;
  colonizeOk: number;
  questCleared: number;
  holdCount: number;
  lastHoldReason: string;
  hangarShips: number;
  shipDestroys: number;
  reboards: number;
  skills: number;
  skillPoints: number;
  gearScore: number;
  devSum: number;
  capitalDestroyed: number;
  hullTierKey?: string;
  hullName?: string;
  hullShipId?: string;
  hullFundGap?: number;
};

export type AnalyzeFinding = {
  severity: 'info' | 'warn' | 'risk';
  code: string;
  detail: string;
};

export type AnalyzeReport = {
  day: number;
  findings: AnalyzeFinding[];
  kpi: KpiSnapshot;
};
