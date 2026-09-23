// GM 비트 — Table-First. 입은 이끌기만. 월드 write·퀘스트 신설 없음.

import { ARC_CORE_CHAT_GM_BEATS_FROM_CSV } from '../../data/generated/csvArcCoreChatGmBeats';
import { getMissionById } from '../../missions/missionCatalog';
import {
  isMainStoryMissionId,
  isQuestMissionId,
  isTutorialMissionId,
} from '../../missions/missionTrack';

export const ARC_CORE_CHAT_GM_WHENS = [
  'tutorial_active',
  'story_active',
  'quest_active',
  'story_available',
  'idle',
] as const;

export type ArcCoreChatGmWhen = (typeof ARC_CORE_CHAT_GM_WHENS)[number];

export type ArcCoreChatGmBeatRow = {
  id: string;
  sort: number;
  when: ArcCoreChatGmWhen;
  track: string;
  bindMissionId: string;
  intentKo: string;
  intentEn: string;
  steerKo: string;
  steerEn: string;
  bodyHint: string;
  suggestedProposalId: string;
};

export type ArcCoreChatGmProgressSnap = {
  missionId: string;
  status: string;
};

export type ArcCoreChatGmBindInput = {
  activeMissionId: string | null;
  progresses: Readonly<Record<string, ArcCoreChatGmProgressSnap>>;
  locale: 'ko' | 'en';
};

export type ArcCoreChatGmSession = {
  beatId: string;
  when: ArcCoreChatGmWhen;
  track: string;
  missionId: string;
  missionTitle: string;
  intentLine: string;
  steerLine: string;
  bodyHint: string;
  suggestedProposalId: string;
  hasStoryBeat: boolean;
  worldWrite: false;
};

function parseNum(raw: string, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function asWhen(raw: string): ArcCoreChatGmWhen | null {
  const id = raw.trim();
  for (let i = 0; i < ARC_CORE_CHAT_GM_WHENS.length; i += 1) {
    if (ARC_CORE_CHAT_GM_WHENS[i] === id) return id;
  }
  return null;
}

let beatCache: ArcCoreChatGmBeatRow[] | null = null;

export function listArcCoreChatGmBeatRows(): readonly ArcCoreChatGmBeatRow[] {
  if (!beatCache) {
    beatCache = [...ARC_CORE_CHAT_GM_BEATS_FROM_CSV]
      .map((row) => {
        const when = asWhen(String(row.when ?? ''));
        return {
          id: String(row.id ?? '').trim(),
          sort: parseNum(String(row.sort ?? ''), 99),
          when: when ?? 'idle',
          track: String(row.track ?? '').trim(),
          bindMissionId: String(row.bindMissionId ?? '').trim(),
          intentKo: String(row.intentKo ?? '').trim(),
          intentEn: String(row.intentEn ?? '').trim(),
          steerKo: String(row.steerKo ?? '').trim(),
          steerEn: String(row.steerEn ?? '').trim(),
          bodyHint: String(row.bodyHint ?? '').trim(),
          suggestedProposalId: String(row.suggestedProposalId ?? '').trim(),
        };
      })
      .filter((row) => row.id)
      .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));
  }
  return beatCache;
}

export function findArcCoreChatGmBeatRow(when: ArcCoreChatGmWhen): ArcCoreChatGmBeatRow | undefined {
  const rows = listArcCoreChatGmBeatRows();
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i]!.when === when) return rows[i];
  }
  return undefined;
}

function applyTitleToken(template: string, title: string): string {
  if (!template.includes('{title}')) return template;
  return template.split('{title}').join(title || '—');
}

function missionTitle(missionId: string, locale: 'ko' | 'en'): string {
  const mission = getMissionById(missionId);
  if (!mission) return missionId;
  if (locale === 'en') {
    return mission.titleEn?.trim() || mission.title?.trim() || missionId;
  }
  return mission.title?.trim() || missionId;
}

function isActiveSnap(snap: ArcCoreChatGmProgressSnap | undefined): boolean {
  return snap?.status === 'active';
}

function pickActiveMissionId(input: ArcCoreChatGmBindInput): string {
  const pinned = input.activeMissionId?.trim() ?? '';
  if (pinned && isActiveSnap(input.progresses[pinned]) && getMissionById(pinned)) {
    return pinned;
  }
  let tutorial = '';
  let story = '';
  let quest = '';
  const ids = Object.keys(input.progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]!;
    const snap = input.progresses[id];
    if (!isActiveSnap(snap) || !getMissionById(id)) continue;
    if (!tutorial && isTutorialMissionId(id)) tutorial = id;
    else if (!story && isMainStoryMissionId(id)) story = id;
    else if (!quest && isQuestMissionId(id)) quest = id;
  }
  return tutorial || story || quest;
}

function resolveWhen(input: ArcCoreChatGmBindInput, activeId: string): ArcCoreChatGmWhen {
  if (activeId) {
    if (isTutorialMissionId(activeId)) return 'tutorial_active';
    if (isMainStoryMissionId(activeId)) return 'story_active';
    if (isQuestMissionId(activeId)) return 'quest_active';
  }
  const offer = findArcCoreChatGmBeatRow('story_available');
  const offerId = offer?.bindMissionId.trim() || 'story_001';
  const offerSnap = input.progresses[offerId];
  if (!offerSnap || (offerSnap.status !== 'active' && offerSnap.status !== 'complete')) {
    if (getMissionById(offerId)) return 'story_available';
  }
  return 'idle';
}

function emptySession(locale: 'ko' | 'en'): ArcCoreChatGmSession {
  const idle = findArcCoreChatGmBeatRow('idle');
  return {
    beatId: idle?.id ?? 'beat_idle',
    when: 'idle',
    track: idle?.track ?? 'idle',
    missionId: '',
    missionTitle: '',
    intentLine: locale === 'en' ? idle?.intentEn ?? '' : idle?.intentKo ?? '',
    steerLine: locale === 'en' ? idle?.steerEn ?? '' : idle?.steerKo ?? '',
    bodyHint: idle?.bodyHint ?? 'bar',
    suggestedProposalId: '',
    hasStoryBeat: false,
    worldWrite: false,
  };
}

export function bindArcCoreChatGmSession(input: ArcCoreChatGmBindInput): ArcCoreChatGmSession {
  const locale = input.locale === 'en' ? 'en' : 'ko';
  const activeId = pickActiveMissionId(input);
  const when = resolveWhen(input, activeId);
  const row = findArcCoreChatGmBeatRow(when) ?? findArcCoreChatGmBeatRow('idle');
  if (!row) return emptySession(locale);

  const boundId =
    when === 'story_available'
      ? row.bindMissionId.trim()
      : activeId;
  const title = boundId ? missionTitle(boundId, locale) : '';
  const intent = locale === 'en' ? row.intentEn || row.intentKo : row.intentKo || row.intentEn;
  const steerRaw = locale === 'en' ? row.steerEn || row.steerKo : row.steerKo || row.steerEn;

  return {
    beatId: row.id,
    when,
    track: row.track,
    missionId: boundId,
    missionTitle: title.slice(0, 80),
    intentLine: intent.slice(0, 240),
    steerLine: applyTitleToken(steerRaw, title).slice(0, 240),
    bodyHint: row.bodyHint,
    suggestedProposalId: when === 'idle' ? '' : row.suggestedProposalId,
    hasStoryBeat: when !== 'idle',
    worldWrite: false,
  };
}

export function readArcCoreChatGmSession(locale: 'ko' | 'en'): ArcCoreChatGmSession {
  const { useMissionStore } = require('../../store/missionStore') as typeof import('../../store/missionStore');
  const state = useMissionStore.getState();
  const progresses: Record<string, ArcCoreChatGmProgressSnap> = {};
  const keys = Object.keys(state.progresses);
  for (let i = 0; i < keys.length; i += 1) {
    const id = keys[i]!;
    const row = state.progresses[id];
    if (!row) continue;
    progresses[id] = { missionId: row.missionId, status: row.status };
  }
  return bindArcCoreChatGmSession({
    activeMissionId: state.activeMissionId,
    progresses,
    locale,
  });
}
