// Table-First 채팅 인덱스 — 모듈 로드 1회. 매 턴 find 금지.

import { ARC_CORE_CHAT_KNOWLEDGE_FROM_CSV } from '../../data/generated/csvArcCoreChatKnowledge';
import { ARC_CORE_CHAT_MODES_FROM_CSV } from '../../data/generated/csvArcCoreChatModes';
import { ARC_CORE_CHAT_OPERATOR_PERSONA_FROM_CSV } from '../../data/generated/csvArcCoreChatOperatorPersona';
import { ARC_CORE_CHAT_PERSONA_FROM_CSV } from '../../data/generated/csvArcCoreChatPersona';
import { ARC_CORE_CHAT_PURPOSES_FROM_CSV } from '../../data/generated/csvArcCoreChatPurposes';
import { ARC_CORE_CHAT_SPEAKERS_FROM_CSV } from '../../data/generated/csvArcCoreChatSpeakers';
import { ARC_CORE_CHAT_TOPICS_FROM_CSV } from '../../data/generated/csvArcCoreChatTopics';
import type { NlMouthId } from '../../game/conversation/conversationGateContract';

export type ArcCoreChatPersonaRow = {
  id: string;
  sort: number;
  kind: string;
  textKo: string;
  textEn: string;
};

export type ArcCoreChatTopicRow = {
  id: string;
  keywordHints: readonly string[];
  hintTools: readonly string[];
  textKo: string;
  textEn: string;
};

export type ArcCoreChatPurposeRow = {
  id: string;
  sort: number;
  when: string;
  clueTopic: string;
  textKo: string;
  textEn: string;
};

export type ArcCoreChatModeRow = {
  id: string;
  sort: number;
  textKo: string;
  textEn: string;
};

export type ArcCoreChatKnowledgeRow = {
  id: string;
  topicId: string;
  speakIf: string;
  priority: number;
  textKo: string;
  textEn: string;
};

export type ArcCoreChatSpeakerRow = {
  id: NlMouthId;
  sort: number;
  displayNameKo: string;
  displayNameEn: string;
  subtitleKo: string;
  subtitleEn: string;
  portraitAssetKey: string;
  captainId: string;
  defaultActive: boolean;
  inboundPreferred: boolean;
};

function splitPipe(raw: string): string[] {
  return String(raw ?? '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseNum(raw: string, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

let personaCache: ArcCoreChatPersonaRow[] | null = null;
let operatorPersonaCache: ArcCoreChatPersonaRow[] | null = null;
let speakerCache: ArcCoreChatSpeakerRow[] | null = null;
let speakerByIdCache: Map<string, ArcCoreChatSpeakerRow> | null = null;
let topicCache: ArcCoreChatTopicRow[] | null = null;
let knowledgeCache: ArcCoreChatKnowledgeRow[] | null = null;
let purposeCache: ArcCoreChatPurposeRow[] | null = null;
let modeCache: ArcCoreChatModeRow[] | null = null;

function mapPersonaRows(raw: readonly Record<string, string>[]): ArcCoreChatPersonaRow[] {
  return raw
    .map((row) => ({
      id: String(row.id ?? '').trim(),
      sort: parseNum(String(row.sort ?? ''), 0),
      kind: String(row.kind ?? '').trim(),
      textKo: String(row.textKo ?? '').trim(),
      textEn: String(row.textEn ?? '').trim(),
    }))
    .filter((row) => row.id)
    .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));
}

export function listArcCoreChatPersonaRows(): readonly ArcCoreChatPersonaRow[] {
  if (!personaCache) {
    personaCache = mapPersonaRows(ARC_CORE_CHAT_PERSONA_FROM_CSV as unknown as Record<string, string>[]);
  }
  return personaCache;
}

export function listArcCoreChatOperatorPersonaRows(): readonly ArcCoreChatPersonaRow[] {
  if (!operatorPersonaCache) {
    operatorPersonaCache = mapPersonaRows(
      ARC_CORE_CHAT_OPERATOR_PERSONA_FROM_CSV as unknown as Record<string, string>[],
    );
  }
  return operatorPersonaCache;
}

export function listArcCoreChatPersonaRowsForSpeaker(
  speakerId: NlMouthId,
): readonly ArcCoreChatPersonaRow[] {
  return speakerId === 'operator'
    ? listArcCoreChatOperatorPersonaRows()
    : listArcCoreChatPersonaRows();
}

export function listArcCoreChatSpeakerRows(): readonly ArcCoreChatSpeakerRow[] {
  if (!speakerCache) {
    speakerCache = [...ARC_CORE_CHAT_SPEAKERS_FROM_CSV]
      .map((row) => {
        const id = String(row.id ?? '').trim();
        if (id !== 'operator' && id !== 'arc_core') return null;
        return {
          id,
          sort: parseNum(String(row.sort ?? ''), 0),
          displayNameKo: String(row.displayNameKo ?? '').trim(),
          displayNameEn: String(row.displayNameEn ?? '').trim(),
          subtitleKo: String(row.subtitleKo ?? '').trim(),
          subtitleEn: String(row.subtitleEn ?? '').trim(),
          portraitAssetKey: String(row.portraitAssetKey ?? '').trim(),
          captainId: String(row.captainId ?? '').trim(),
          defaultActive: String(row.defaultActive ?? '') === '1',
          inboundPreferred: String(row.inboundPreferred ?? '') === '1',
        } satisfies ArcCoreChatSpeakerRow;
      })
      .filter((row): row is ArcCoreChatSpeakerRow => row != null)
      .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));
    speakerByIdCache = new Map(speakerCache.map((row) => [row.id, row]));
  }
  return speakerCache;
}

export function getArcCoreChatSpeakerRow(id: string): ArcCoreChatSpeakerRow | undefined {
  if (!speakerByIdCache) listArcCoreChatSpeakerRows();
  return speakerByIdCache?.get(id);
}

export function getDefaultNlMouthId(): NlMouthId {
  const rows = listArcCoreChatSpeakerRows();
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i]!.defaultActive) return rows[i]!.id;
  }
  return 'operator';
}

export function getOperatorNlCaptainId(): string {
  return getArcCoreChatSpeakerRow('operator')?.captainId || 'npc_cpt_operator_stella';
}

export function listArcCoreChatPurposeRows(): readonly ArcCoreChatPurposeRow[] {
  if (!purposeCache) {
    purposeCache = [...ARC_CORE_CHAT_PURPOSES_FROM_CSV]
      .map((row) => ({
        id: String(row.id ?? '').trim(),
        sort: parseNum(String(row.sort ?? ''), 0),
        when: String(row.when ?? '').trim(),
        clueTopic: String(row.clueTopic ?? '').trim(),
        textKo: String(row.textKo ?? '').trim(),
        textEn: String(row.textEn ?? '').trim(),
      }))
      .filter((row) => row.id)
      .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));
  }
  return purposeCache;
}

export function listArcCoreChatModeRows(): readonly ArcCoreChatModeRow[] {
  if (!modeCache) {
    modeCache = [...ARC_CORE_CHAT_MODES_FROM_CSV]
      .map((row) => ({
        id: String(row.id ?? '').trim(),
        sort: parseNum(String(row.sort ?? ''), 0),
        textKo: String(row.textKo ?? '').trim(),
        textEn: String(row.textEn ?? '').trim(),
      }))
      .filter((row) => row.id)
      .sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));
  }
  return modeCache;
}

export function listArcCoreChatTopicRows(): readonly ArcCoreChatTopicRow[] {
  if (!topicCache) {
    topicCache = [...ARC_CORE_CHAT_TOPICS_FROM_CSV]
      .map((row) => ({
        id: String(row.id ?? '').trim(),
        keywordHints: splitPipe(String(row.keywordHints ?? '')),
        hintTools: splitPipe(String(row.hintTools ?? '')),
        textKo: String(row.textKo ?? '').trim(),
        textEn: String(row.textEn ?? '').trim(),
      }))
      .filter((row) => row.id);
  }
  return topicCache;
}

export function listArcCoreChatKnowledgeRows(): readonly ArcCoreChatKnowledgeRow[] {
  if (!knowledgeCache) {
    knowledgeCache = [...ARC_CORE_CHAT_KNOWLEDGE_FROM_CSV]
      .map((row) => ({
        id: String(row.id ?? '').trim(),
        topicId: String(row.topicId ?? '').trim(),
        speakIf: String(row.speakIf ?? 'always').trim() || 'always',
        priority: parseNum(String(row.priority ?? ''), 99),
        textKo: String(row.textKo ?? '').trim(),
        textEn: String(row.textEn ?? '').trim(),
      }))
      .filter((row) => row.id)
      .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
  }
  return knowledgeCache;
}

export const ARC_CORE_CHAT_TOPIC_HINT_ORDER = [
  'refuse',
  'nations',
  'routes',
  'setting',
  'location',
  'spy',
  'combat',
  'safety',
  'notice',
  'mission',
  'story',
  'mining',
  'daily',
  'cores',
  'trade',
  'shipyard',
  'seats',
  'self',
  'smalltalk',
  'greet',
  'other',
] as const;

export function hintArcCoreChatTopicId(userText: string): string {
  const text = userText.trim();
  if (!text) return 'greet';
  const lower = text.toLowerCase();
  const topics = listArcCoreChatTopicRows();
  const byId = new Map(topics.map((row) => [row.id, row]));
  for (let i = 0; i < ARC_CORE_CHAT_TOPIC_HINT_ORDER.length; i += 1) {
    const id = ARC_CORE_CHAT_TOPIC_HINT_ORDER[i]!;
    const row = byId.get(id);
    if (!row) continue;
    for (let h = 0; h < row.keywordHints.length; h += 1) {
      const hint = row.keywordHints[h]!;
      if (hint && lower.includes(hint.toLowerCase())) return id;
    }
  }
  return 'other';
}

export function findArcCoreChatPurposeRow(id: string): ArcCoreChatPurposeRow | undefined {
  const want = id.trim();
  if (!want) return undefined;
  const rows = listArcCoreChatPurposeRows();
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i]!.id === want) return rows[i];
  }
  return undefined;
}

export function findArcCoreChatModeRow(id: string): ArcCoreChatModeRow | undefined {
  const want = id.trim();
  if (!want) return undefined;
  const rows = listArcCoreChatModeRows();
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i]!.id === want) return rows[i];
  }
  return undefined;
}

export function listHintToolsForTopic(topicId: string): readonly string[] {
  const topics = listArcCoreChatTopicRows();
  for (let i = 0; i < topics.length; i += 1) {
    if (topics[i]!.id === topicId) return topics[i]!.hintTools;
  }
  return [];
}
