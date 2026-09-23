export const STELLA_LIFE_DRIVE_IDS = [
  'duty',
  'curiosity',
  'care',
  'rest',
  'growth',
  'unease',
] as const;

export type StellaLifeDriveId = (typeof STELLA_LIFE_DRIVE_IDS)[number];

export const STELLA_LIFE_MOTIVE_IDS = [
  'none',
  'want_share',
  'need_you',
  'unfinished',
  'want_right',
  'check_in',
] as const;

export type StellaLifeMotiveId = (typeof STELLA_LIFE_MOTIVE_IDS)[number];

export const STELLA_LIFE_ASK_IDS = [
  'promise',
  'correction',
  'thread',
  'care',
  'share',
] as const;

export type StellaLifeAskId = (typeof STELLA_LIFE_ASK_IDS)[number];

export type StellaLifeEnv = {
  hour: number;
  weekdayKey: string;
  planetId: string;
  coreR: number;
  coreP: number;
  coreD: number;
  coreT: number;
  coreE: number;
  spyAlertPending: boolean;
  hasCombatRecord: boolean;
};

export type StellaLifeResolved = {
  dayKey: string;
  slotIndex: number;
  activityKo: string;
  activityEn: string;
  dutyOrOff: 'duty' | 'off';
  energy: number;
  mood: number;
  focus: number;
  driveId: StellaLifeDriveId;
  goalId: string;
  goalProgress: number;
  playerGapDays: number;
  topicHint: string;
  envLineKo: string;
  envLineEn: string;
};

export type StellaLifeDigestRow = {
  d: string;
  mood: number;
  driveId: StellaLifeDriveId;
  goalId: string;
  done: string[];
  withPlayer: 0 | 1;
};

export type StellaLifeTraits = {
  duty: number;
  warmth: number;
  curiosity: number;
  steadiness: number;
};

export type StellaLifeCognition = {
  recall: number;
  askDepth: number;
  grounding: number;
  casualFirst: number;
  lastIngestDay: string;
  ev: StellaLifeCognitionDay[];
};

export type StellaLifeCognitionDay = {
  d: string;
  h5: number;
  topic: number;
  casual: number;
  dump: number;
  corr: number;
};

export type StellaLifeCognitionSession = {
  h5: number;
  topic: number;
  casual: number;
  dump: number;
  corr: number;
};

export type StellaLifeSnapshot = {
  digests: StellaLifeDigestRow[];
  traits: StellaLifeTraits;
  anchors: string[];
  narrative: string;
  sharedDays: number;
  goalHistory: string[];
  lastConsolidatedDayKey: string;
  lastPlayerDay: string;
  lastAskDay: string;
  sessionMoodDelta: number;
  withPlayerToday: boolean;
  todayKey: string;
  cognition: StellaLifeCognition;
  cognitionSession: StellaLifeCognitionSession;
};

export type StellaLifeAskResolved = {
  motiveId: Exclude<StellaLifeMotiveId, 'none'>;
  askId: StellaLifeAskId;
  textKo: string;
  textEn: string;
};
