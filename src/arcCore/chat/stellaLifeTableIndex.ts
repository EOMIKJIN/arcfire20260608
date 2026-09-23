import { STELLA_LIFE_SLOTS_FROM_CSV } from '../../data/generated/csvStellaLifeSlots';
import { STELLA_LIFE_GOALS_FROM_CSV } from '../../data/generated/csvStellaLifeGoals';
import { STELLA_LIFE_ENV_RULES_FROM_CSV } from '../../data/generated/csvStellaLifeEnvRules';
import { STELLA_LIFE_COGNITION_BANDS_FROM_CSV } from '../../data/generated/csvStellaLifeCognitionBands';
import { STELLA_LIFE_ASK_MOTIVE_FROM_CSV } from '../../data/generated/csvStellaLifeAskMotive';
import { STELLA_LIFE_ASK_WHY_FROM_CSV } from '../../data/generated/csvStellaLifeAskWhy';
import { STELLA_LIFE_NARRATIVE_FROM_CSV } from '../../data/generated/csvStellaLifeNarrative';
import type { StellaLifeAskId, StellaLifeDriveId, StellaLifeMotiveId } from './stellaLifeTypes';
import { STELLA_LIFE_ASK_IDS, STELLA_LIFE_DRIVE_IDS, STELLA_LIFE_MOTIVE_IDS } from './stellaLifeTypes';

export type StellaLifeSlotRow = {
  id: string;
  slotFrom: number;
  slotTo: number;
  weekdayMask: string;
  dutyOrOff: 'duty' | 'off';
  activityKo: string;
  activityEn: string;
  energyDelta: number;
  focusDelta: number;
  topicHint: string;
};

export type StellaLifeGoalRow = {
  id: string;
  driveId: StellaLifeDriveId;
  goalKo: string;
  goalEn: string;
  spanDays: number;
  progressStep: number;
};

export type StellaLifeEnvRuleRow = {
  id: string;
  envKey: string;
  condition: string;
  moodDelta: number;
  focusDelta: number;
  lineKo: string;
  lineEn: string;
};

export type StellaLifeCognitionBandRow = {
  id: string;
  axis: 'recall' | 'askDepth' | 'grounding' | 'casualFirst';
  lo: number;
  hi: number;
  packAnchors: number;
  allowLead: boolean;
  allowLifeLine: boolean;
  forceHumanFirst: boolean;
};

export type StellaLifeAskMotiveRow = {
  id: string;
  driveId: StellaLifeDriveId | '*';
  dutyOrOff: 'duty' | 'off' | '*';
  moodLo: number;
  moodHi: number;
  motiveId: StellaLifeMotiveId;
  allowAsk: boolean;
};

export type StellaLifeNarrativeRow = {
  id: string;
  priority: number;
  warmthLo: number;
  dutyLo: number;
  curiosityLo: number;
  lineKo: string;
  lineEn: string;
};

export type StellaLifeAskWhyRow = {
  id: string;
  priority: number;
  askId: StellaLifeAskId;
  motiveIds: readonly StellaLifeMotiveId[];
  lineKo: string;
  lineEn: string;
};

function num(raw: string, fallback = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function asDrive(raw: string): StellaLifeDriveId {
  return STELLA_LIFE_DRIVE_IDS.includes(raw as StellaLifeDriveId)
    ? (raw as StellaLifeDriveId)
    : 'duty';
}

let slots: StellaLifeSlotRow[] | null = null;
let goals: StellaLifeGoalRow[] | null = null;
let envRules: StellaLifeEnvRuleRow[] | null = null;
let bands: StellaLifeCognitionBandRow[] | null = null;
let motives: StellaLifeAskMotiveRow[] | null = null;
let whys: StellaLifeAskWhyRow[] | null = null;
let narratives: StellaLifeNarrativeRow[] | null = null;

export function listStellaLifeSlots(): readonly StellaLifeSlotRow[] {
  if (slots) return slots;
  slots = STELLA_LIFE_SLOTS_FROM_CSV.map((row) => ({
    id: row.id,
    slotFrom: num(row.slotFrom),
    slotTo: num(row.slotTo),
    weekdayMask: row.weekdayMask || '*',
    dutyOrOff: row.dutyOrOff === 'off' ? 'off' : 'duty',
    activityKo: row.activityKo,
    activityEn: row.activityEn,
    energyDelta: num(row.energyDelta),
    focusDelta: num(row.focusDelta),
    topicHint: row.topicHint,
  }));
  return slots;
}

export function listStellaLifeGoals(): readonly StellaLifeGoalRow[] {
  if (goals) return goals;
  goals = STELLA_LIFE_GOALS_FROM_CSV.map((row) => ({
    id: row.id,
    driveId: asDrive(row.driveId),
    goalKo: row.goalKo,
    goalEn: row.goalEn,
    spanDays: num(row.spanDays, 7),
    progressStep: num(row.progressStep, 8),
  }));
  return goals;
}

export function listStellaLifeEnvRules(): readonly StellaLifeEnvRuleRow[] {
  if (envRules) return envRules;
  envRules = STELLA_LIFE_ENV_RULES_FROM_CSV.map((row) => ({
    id: row.id,
    envKey: row.envKey,
    condition: row.condition,
    moodDelta: num(row.moodDelta),
    focusDelta: num(row.focusDelta),
    lineKo: row.lineKo,
    lineEn: row.lineEn,
  }));
  return envRules;
}

export function listStellaLifeCognitionBands(): readonly StellaLifeCognitionBandRow[] {
  if (bands) return bands;
  bands = STELLA_LIFE_COGNITION_BANDS_FROM_CSV.map((row) => ({
    id: row.id,
    axis: row.axis as StellaLifeCognitionBandRow['axis'],
    lo: num(row.lo),
    hi: num(row.hi, 100),
    packAnchors: num(row.packAnchors),
    allowLead: row.allowLead === '1',
    allowLifeLine: row.allowLifeLine !== '0',
    forceHumanFirst: row.forceHumanFirst === '1',
  }));
  return bands;
}

export function listStellaLifeAskMotives(): readonly StellaLifeAskMotiveRow[] {
  if (motives) return motives;
  motives = STELLA_LIFE_ASK_MOTIVE_FROM_CSV.map((row) => ({
    id: row.id,
    driveId: String(row.driveId) === '*' ? '*' : asDrive(row.driveId),
    dutyOrOff: String(row.dutyOrOff) === '*' || row.dutyOrOff === 'off' || row.dutyOrOff === 'duty'
      ? (String(row.dutyOrOff) === '*' ? '*' : row.dutyOrOff)
      : '*',
    moodLo: num(row.moodLo),
    moodHi: num(row.moodHi, 100),
    motiveId: STELLA_LIFE_MOTIVE_IDS.includes(row.motiveId as StellaLifeMotiveId)
      ? (row.motiveId as StellaLifeMotiveId)
      : 'none',
    allowAsk: row.allowAsk === '1',
  }));
  return motives;
}

export function listStellaLifeAskWhys(): readonly StellaLifeAskWhyRow[] {
  if (whys) return whys;
  whys = STELLA_LIFE_ASK_WHY_FROM_CSV.map((row) => ({
    id: row.id,
    priority: num(row.priority, 9),
    askId: STELLA_LIFE_ASK_IDS.includes(row.askId as StellaLifeAskId)
      ? (row.askId as StellaLifeAskId)
      : 'share',
    motiveIds: row.motiveIds.split('|').filter((id): id is StellaLifeMotiveId =>
      STELLA_LIFE_MOTIVE_IDS.includes(id as StellaLifeMotiveId)
    ),
    lineKo: row.lineKo,
    lineEn: row.lineEn,
  }));
  return whys;
}

export function listStellaLifeNarratives(): readonly StellaLifeNarrativeRow[] {
  if (narratives) return narratives;
  narratives = STELLA_LIFE_NARRATIVE_FROM_CSV.map((row) => ({
    id: row.id,
    priority: num(row.priority, 9),
    warmthLo: num(row.warmthLo),
    dutyLo: num(row.dutyLo),
    curiosityLo: num(row.curiosityLo),
    lineKo: row.lineKo,
    lineEn: row.lineEn,
  })).sort((a, b) => a.priority - b.priority);
  return narratives;
}

export function resolveStellaLifeNarrativeLine(
  traits: { warmth: number; duty: number; curiosity: number },
  locale: 'ko' | 'en',
): string {
  const rows = listStellaLifeNarratives();
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    if (traits.warmth < row.warmthLo) continue;
    if (traits.duty < row.dutyLo) continue;
    if (traits.curiosity < row.curiosityLo) continue;
    return locale === 'en' ? row.lineEn : row.lineKo;
  }
  return locale === 'en' ? 'The day is folded away.' : '하루를 접어 두고 있다.';
}

export function findStellaLifeGoal(id: string): StellaLifeGoalRow | null {
  const list = listStellaLifeGoals();
  for (let i = 0; i < list.length; i += 1) {
    if (list[i]!.id === id) return list[i]!;
  }
  return null;
}
