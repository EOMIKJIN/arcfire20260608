/**
 * 스텔라 퀘스트 현장 메모 — Table-First 카드 1~3.
 * 정본: docs/STELLA_QUEST_FIELD_NOTE_v0.1.md
 */
import { STELLA_CAPTAIN_NOTE_FROM_CSV } from '../../data/generated/csvStellaCaptainNote';
import { STELLA_QUEST_ASIDE_FROM_CSV } from '../../data/generated/csvStellaQuestAside';
import { STELLA_QUEST_DOSSIER_FROM_CSV } from '../../data/generated/csvStellaQuestDossier';
import type { NlMouthId } from '../../game/conversation/conversationGateContract';
import { getCurrentSequentialObjective } from '../../missions/missionObjectiveSequence';
import { missionIdFromObjectiveId, readLastStellaQuestTalk } from './stellaQuestTalkMemory';

export { missionIdFromObjectiveId } from './stellaQuestTalkMemory';

export type StellaFieldNoteCard = {
  id: string;
  topicId: 'mission';
  text: string;
};

export const STELLA_FIELD_NOTE_CARD_MAX = 3;
export const STELLA_FIELD_NOTE_TEXT_MAX = 220;
export const STELLA_FIELD_NOTE_ID_PREFIXES = ['sqd_', 'sqa_', 'scn_'] as const;

type DossierRow = {
  id: string;
  missionId: string;
  sort: number;
  textKo: string;
  textEn: string;
};

type AsideRow = {
  id: string;
  objectiveId: string;
  mentionId: string;
  mentionHints: string[];
  sort: number;
  textKo: string;
  textEn: string;
};

type CaptainRow = {
  id: string;
  captainId: string;
  nameHints: string[];
  sort: number;
  textKo: string;
  textEn: string;
};

let dossierByMission: Map<string, DossierRow> | null = null;
let asidesByObjective: Map<string, AsideRow[]> | null = null;
let captainById: Map<string, CaptainRow> | null = null;

function parseHints(raw: string): string[] {
  const out: string[] = [];
  const parts = String(raw ?? '').split('|');
  for (let i = 0; i < parts.length; i += 1) {
    const hint = parts[i]!.trim();
    if (hint) out.push(hint);
  }
  return out;
}

function parseSort(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function ensureIndexes(): void {
  if (dossierByMission && asidesByObjective && captainById) return;

  const dossiers = new Map<string, DossierRow>();
  for (let i = 0; i < STELLA_QUEST_DOSSIER_FROM_CSV.length; i += 1) {
    const row = STELLA_QUEST_DOSSIER_FROM_CSV[i]!;
    const missionId = String(row.missionId ?? '').trim();
    if (!missionId) continue;
    dossiers.set(missionId, {
      id: String(row.id ?? '').trim(),
      missionId,
      sort: parseSort(String(row.sort ?? '')),
      textKo: String(row.textKo ?? ''),
      textEn: String(row.textEn ?? ''),
    });
  }

  const asides = new Map<string, AsideRow[]>();
  for (let i = 0; i < STELLA_QUEST_ASIDE_FROM_CSV.length; i += 1) {
    const row = STELLA_QUEST_ASIDE_FROM_CSV[i]!;
    const objectiveId = String(row.objectiveId ?? '').trim();
    if (!objectiveId) continue;
    const next: AsideRow = {
      id: String(row.id ?? '').trim(),
      objectiveId,
      mentionId: String(row.mentionId ?? '').trim(),
      mentionHints: parseHints(String(row.mentionHints ?? '')),
      sort: parseSort(String(row.sort ?? '')),
      textKo: String(row.textKo ?? ''),
      textEn: String(row.textEn ?? ''),
    };
    const list = asides.get(objectiveId) ?? [];
    list.push(next);
    asides.set(objectiveId, list);
  }
  asides.forEach((list) => {
    list.sort((a, b) => a.sort - b.sort);
  });

  const captains = new Map<string, CaptainRow>();
  for (let i = 0; i < STELLA_CAPTAIN_NOTE_FROM_CSV.length; i += 1) {
    const row = STELLA_CAPTAIN_NOTE_FROM_CSV[i]!;
    const captainId = String(row.captainId ?? '').trim();
    if (!captainId) continue;
    captains.set(captainId, {
      id: String(row.id ?? '').trim(),
      captainId,
      nameHints: parseHints(String(row.nameHints ?? '')),
      sort: parseSort(String(row.sort ?? '')),
      textKo: String(row.textKo ?? ''),
      textEn: String(row.textEn ?? ''),
    });
  }

  dossierByMission = dossiers;
  asidesByObjective = asides;
  captainById = captains;
}

function pickLocaleText(ko: string, en: string, locale: 'ko' | 'en'): string {
  if (locale === 'en') return (en || ko).trim();
  return (ko || en).trim();
}

function clipNote(text: string): string {
  const t = text.trim();
  if (t.length <= STELLA_FIELD_NOTE_TEXT_MAX) return t;
  return t.slice(0, STELLA_FIELD_NOTE_TEXT_MAX);
}

function hintsHit(userText: string, hints: readonly string[]): boolean {
  if (!userText || hints.length === 0) return false;
  const lower = userText.toLowerCase();
  for (let i = 0; i < hints.length; i += 1) {
    const hint = hints[i]!;
    if (hint && lower.includes(hint.toLowerCase())) return true;
  }
  return false;
}

function asCard(
  id: string,
  textKo: string,
  textEn: string,
  locale: 'ko' | 'en',
): StellaFieldNoteCard | null {
  const text = clipNote(pickLocaleText(textKo, textEn, locale));
  if (!id || !text) return null;
  return { id, topicId: 'mission', text };
}

export function isStellaFieldNoteCardId(id: string): boolean {
  const key = id.trim();
  for (let i = 0; i < STELLA_FIELD_NOTE_ID_PREFIXES.length; i += 1) {
    if (key.startsWith(STELLA_FIELD_NOTE_ID_PREFIXES[i]!)) return true;
  }
  return false;
}

export type StellaQuestFieldNoteSnap = {
  locale: 'ko' | 'en';
  userText: string;
  missionId: string;
  objectiveId: string;
  offerCaptainId: string;
  lastCaptainId: string;
  lastObjectiveId: string;
};

export function pickStellaQuestFieldNoteCardsFromSnap(
  snap: StellaQuestFieldNoteSnap,
): StellaFieldNoteCard[] {
  ensureIndexes();
  const cards: StellaFieldNoteCard[] = [];
  const seen = new Set<string>();
  const push = (card: StellaFieldNoteCard | null) => {
    if (!card || seen.has(card.id) || cards.length >= STELLA_FIELD_NOTE_CARD_MAX) return;
    seen.add(card.id);
    cards.push(card);
  };

  const userText = snap.userText.trim();
  const objectiveId = snap.lastObjectiveId || snap.objectiveId;
  const asides = objectiveId ? asidesByObjective?.get(objectiveId) ?? [] : [];

  let hitAside: AsideRow | null = null;
  for (let i = 0; i < asides.length; i += 1) {
    const row = asides[i]!;
    if (hintsHit(userText, row.mentionHints)) {
      hitAside = row;
      break;
    }
  }
  if (!hitAside && asides[0]) hitAside = asides[0];
  if (hitAside) {
    push(asCard(hitAside.id, hitAside.textKo, hitAside.textEn, snap.locale));
  }

  const missionId = snap.missionId || missionIdFromObjectiveId(objectiveId);
  const dossier = missionId ? dossierByMission?.get(missionId) : undefined;
  if (dossier) {
    push(asCard(dossier.id, dossier.textKo, dossier.textEn, snap.locale));
  }

  const captainId = snap.lastCaptainId || snap.offerCaptainId;
  const captain = captainId ? captainById?.get(captainId) : undefined;
  if (captain && (hintsHit(userText, captain.nameHints) || cards.length < STELLA_FIELD_NOTE_CARD_MAX)) {
    push(asCard(captain.id, captain.textKo, captain.textEn, snap.locale));
  }

  return cards;
}

export function pickStellaQuestFieldNoteCards(input: {
  speakerId: NlMouthId;
  locale: 'ko' | 'en';
  userText: string;
}): StellaFieldNoteCard[] {
  if (input.speakerId !== 'operator') return [];
  const { useMissionStore } = require('../../store/missionStore') as typeof import('../../store/missionStore');
  const bundle = useMissionStore.getState().getActiveMission();
  if (!bundle) return [];
  const current = getCurrentSequentialObjective(bundle.mission, bundle.progress);
  const last = readLastStellaQuestTalk();
  return pickStellaQuestFieldNoteCardsFromSnap({
    locale: input.locale,
    userText: input.userText,
    missionId: bundle.mission.id,
    objectiveId: current?.id ?? '',
    offerCaptainId: bundle.mission.offerCaptainId ?? '',
    lastCaptainId: last?.speakerCaptainId ?? '',
    lastObjectiveId: last?.objectiveId ?? '',
  });
}
