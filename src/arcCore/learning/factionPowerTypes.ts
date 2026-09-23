// ============================================================
// 팩션 전력 평가 — 1안 스냅샷·비교 타입
// 점유 오버레이(BLUE/RED)와 4대 항로 국가(F1~F4)는 별축.
// 레드 금고 = 아크코어 중앙(월드 공용). F2/F4 국가 금고 없음.
// ============================================================

export type FactionPowerWarSide = 'BLUE' | 'RED';
export type FactionPowerQuadCode = 'F1' | 'F2' | 'F3' | 'F4';
export type FactionPowerHoldSide = 'BLUE' | 'RED' | 'NEUTRAL' | 'INDEPENDENT';
export type FactionPowerRoute = 'west' | 'south' | 'east' | 'north';
export type FactionPowerSnapshotSource = 'live_stores' | 'table_seed';
export type TerritorialLearningSource = 'npc_auto' | 'player_wave' | 'operation_fallback';
export type TerritorialLearningDecision = 'battle' | 'neutral_declare' | 'status_quo';

export type FactionPowerHoldMix = {
  blue: number;
  red: number;
  neutral: number;
  independent: number;
};

export type FactionPowerWarSideSnapshot = {
  side: FactionPowerWarSide;
  planetCount: number;
  pgpBmu: number;
  occupiedFleetPower: number;
  doctrineFleetPower: number;
  vaultCredits: number | null;
  vaultLabelKo: string;
  combatCaptainCount: number;
  combatCaptainLevelSum: number;
  governorCount: number;
  governorTacticsGradeSum: number;
};

export type FactionPowerQuadNationSnapshot = {
  code: FactionPowerQuadCode;
  megaFactionId: string;
  displayNameKo: string;
  route: FactionPowerRoute;
  planetCount: number;
  pgpBmu: number;
  holdMix: FactionPowerHoldMix;
  combatCaptainCount: number;
  vaultCredits: number | null;
  vaultNoteKo: string;
};

export type FactionPowerSnapshot = {
  capturedAtMs: number;
  source: FactionPowerSnapshotSource;
  corePlanetCount: number;
  war: Record<FactionPowerWarSide, FactionPowerWarSideSnapshot>;
  quad: Record<FactionPowerQuadCode, FactionPowerQuadNationSnapshot>;
};

export type TerritorialLearningOutcome = {
  planetId?: string;
  wallTimeMs: number;
  decision: TerritorialLearningDecision;
  holdChanged: boolean;
  previousSide: string;
  newSide: string;
  source: TerritorialLearningSource;
  attackerSide?: string;
  attackerWon?: boolean;
};

export type FactionPowerDivergence = {
  id: string;
  summaryKo: string;
};

export type FactionPowerCompareReport = {
  windowMs: number;
  outcomeCount: number;
  blueCaptures: number;
  redCaptures: number;
  neutralizations: number;
  statusQuo: number;
  playerWaveCount: number;
  npcAutoCount: number;
  warLeaderByPlanets: FactionPowerWarSide | 'tie';
  warLeaderByPgp: FactionPowerWarSide | 'tie';
  warLeaderByFleet: FactionPowerWarSide | 'tie';
  warLeaderByVault: FactionPowerWarSide | 'tie' | 'unavailable';
  quadLeaderByPgp: FactionPowerQuadCode | 'tie';
  quadLeaderByPlanets: FactionPowerQuadCode | 'tie';
  divergences: FactionPowerDivergence[];
};

/** kpiTimeline 압축 필드 — 전체 스냅샷을 persist 하지 않음 */
export type FactionPowerKpiCompact = {
  bluePlanets: number;
  redPlanets: number;
  bluePgp: number;
  redPgp: number;
  blueFleet: number;
  redFleet: number;
  blueVault: number;
  redVault: number;
  f1Pgp: number;
  f2Pgp: number;
  f3Pgp: number;
  f4Pgp: number;
  blueCaptures24h: number;
  redCaptures24h: number;
  divergenceCount: number;
  warLeaderByPlanets: FactionPowerWarSide | 'tie';
  quadLeaderByPgp: FactionPowerQuadCode | 'tie';
};

export type FactionPowerPlanetRow = {
  planetId: string;
  holdSide: FactionPowerHoldSide;
  pgpBmu: number;
  route: FactionPowerRoute | null;
  blueFleetPower: number;
  redFleetPower: number;
  governorSide?: 'BLUE' | 'RED' | 'NEUTRAL';
  governorTacticsGrade?: number;
};

export type FactionPowerCaptainRow = {
  combatTeam: string;
  operationalState: string;
  basePlanetId: string | null;
  initialLevel: number;
};

export type FactionPowerEvaluateInput = {
  nowMs: number;
  source: FactionPowerSnapshotSource;
  planets: readonly FactionPowerPlanetRow[];
  captains: readonly FactionPowerCaptainRow[];
  vaults: {
    blue: number | null;
    redArcCore: number | null;
  };
};
