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
  | 'CAPITAL';

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
