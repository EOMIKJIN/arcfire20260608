// ============================================================
// 테이블 체류전함 — 시민 축 공용 타입 (수송 축과 분리)
// ============================================================

import type { ZoneType } from '../../types';

export const DWELL_ROLE_IDS = [
  'colonizer',
  'survey',
  'civilian_consumer',
  'cultural',
  'information',
] as const;

export type DwellRoleId = (typeof DWELL_ROLE_IDS)[number];

export type DwellRebellionPhase = 'none' | 'simmering' | 'overthrow';

export type DwellJudgmentAction = 'stay' | 'relocate' | 'depart';

export type PlanetDwellSignal = {
  planetId: string;
  population: number;
  resource: number;
  defense: number;
  technology: number;
  environment: number;
  hasTradePort: boolean;
  hasShipyard: boolean;
  hasBar: boolean;
  zone: ZoneType;
  targetCreditsEarned: number;
  feeGrossNorm: number;
  isFrontier: boolean;
  colonizationPhase: number;
  isContested: boolean;
  wdi: number;
  rebellionPhase: DwellRebellionPhase;
  gravity: number;
  logicalCap: number;
};

export type DwellRoleDef = {
  roleId: DwellRoleId;
  frontierPreferred: boolean;
  civilianBannedOnFrontierPhase1: boolean;
  wResource: number;
  wPopulation: number;
  wDefense: number;
  wTechnology: number;
  wEnvironment: number;
};

export type DwellJudgmentInput = {
  captainId: string;
  role: DwellRoleId;
  basePlanetId: string | null;
  activityPlanetIds: readonly string[];
  candidates: readonly string[];
  signalsById: ReadonlyMap<string, PlanetDwellSignal>;
  occupancy: ReadonlyMap<string, number>;
  dayBucket: number;
  epochBucket: number;
};

export type DwellJudgment = {
  planetId: string | null;
  action: DwellJudgmentAction;
  winningScore: number;
  considered: number;
};
