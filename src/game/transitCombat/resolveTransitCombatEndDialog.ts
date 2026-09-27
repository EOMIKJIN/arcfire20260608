/**
 * 이동중 전투 종료 인게임 대화 — 패배한 적 함장 화자 + Table-First 패배/도주 대사.
 * 틱/렌더 금지. 전투 종료 1회. CSV 인덱스는 모듈 1회.
 */

import { TransitCombatEndDialog_FROM_BALANCE_CSV } from '../../data/balance/generated';
import type { AppLocale } from '../../i18n/types';

function preferKo(locale: AppLocale): boolean {
  return locale === 'ko';
}

export type TransitCombatEndDialogKind = 'defeat' | 'flee';

export type TransitCombatEndDialogCaptainRef = {
  id: string;
  displayName: string;
  displayNameEn?: string | null;
  factionId?: string | null;
  portraitImageAssetKey?: string | null;
};

export type TransitCombatEndDialogCopy = {
  label: string;
  text: string;
  portraitAssetKey: string | null;
  usedCaptain: boolean;
};

type DialogRow = (typeof TransitCombatEndDialog_FROM_BALANCE_CSV)[number];

let rowsByKindFaction: Map<string, DialogRow[]> | null = null;
let rowsByKindCaptain: Map<string, DialogRow> | null = null;

function kindKey(kind: TransitCombatEndDialogKind, factionId: string): string {
  return `${kind}::${factionId}`;
}

function getIndexes(): {
  byKindFaction: Map<string, DialogRow[]>;
  byKindCaptain: Map<string, DialogRow>;
} {
  if (rowsByKindFaction && rowsByKindCaptain) {
    return { byKindFaction: rowsByKindFaction, byKindCaptain: rowsByKindCaptain };
  }
  const byKindFaction = new Map<string, DialogRow[]>();
  const byKindCaptain = new Map<string, DialogRow>();
  for (const row of TransitCombatEndDialog_FROM_BALANCE_CSV) {
    const kind = String(row.kind ?? '').trim();
    if (kind !== 'defeat' && kind !== 'flee') continue;
    const captainId = String(row.captainId ?? '').trim();
    if (captainId) {
      byKindCaptain.set(`${kind}::${captainId}`, row);
      continue;
    }
    const factionId = String(row.factionId ?? '').trim() || '*';
    const key = kindKey(kind as TransitCombatEndDialogKind, factionId);
    const list = byKindFaction.get(key);
    if (list) list.push(row);
    else byKindFaction.set(key, [row]);
  }
  rowsByKindFaction = byKindFaction;
  rowsByKindCaptain = byKindCaptain;
  return { byKindFaction, byKindCaptain };
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickRow(
  kind: TransitCombatEndDialogKind,
  captainId: string,
  factionId: string,
): DialogRow | null {
  const { byKindFaction, byKindCaptain } = getIndexes();
  const exact = byKindCaptain.get(`${kind}::${captainId}`);
  if (exact) return exact;
  const factionRows = byKindFaction.get(kindKey(kind, factionId));
  const pool = factionRows && factionRows.length > 0
    ? factionRows
    : byKindFaction.get(kindKey(kind, '*'));
  if (!pool || pool.length === 0) return null;
  return pool[hashId(captainId) % pool.length] ?? pool[0] ?? null;
}

function resolveLine(row: DialogRow | null, locale: AppLocale): string {
  if (!row) return '';
  const ko = String(row.lineKo ?? '').trim();
  const en = String(row.lineEn ?? '').trim();
  if (preferKo(locale)) return ko || en;
  return en || ko;
}

function resolveCaptainLabel(
  captain: TransitCombatEndDialogCaptainRef,
  locale: AppLocale,
): string {
  const ko = String(captain.displayName ?? '').trim();
  if (preferKo(locale)) return ko;
  const en = String(captain.displayNameEn ?? '').trim();
  return en || ko;
}

export function resolveTransitCombatEndDialogCopy(input: {
  kind: TransitCombatEndDialogKind;
  captain: TransitCombatEndDialogCaptainRef | null | undefined;
  locale: AppLocale;
  fallbackLabel: string;
  fallbackText: string;
}): TransitCombatEndDialogCopy {
  const captain = input.captain;
  const captainId = String(captain?.id ?? '').trim();
  if (!captain || !captainId) {
    return {
      label: input.fallbackLabel,
      text: input.fallbackText,
      portraitAssetKey: null,
      usedCaptain: false,
    };
  }
  const factionId = String(captain.factionId ?? '').trim() || '*';
  const row = pickRow(input.kind, captainId, factionId);
  const text = resolveLine(row, input.locale) || input.fallbackText;
  const label = resolveCaptainLabel(captain, input.locale) || input.fallbackLabel;
  const portraitAssetKey = String(captain.portraitImageAssetKey ?? '').trim() || null;
  return {
    label,
    text,
    portraitAssetKey,
    usedCaptain: true,
  };
}

/** 단위테스트 전용. 런타임·틱에서 호출 금지. */
export function invalidateTransitCombatEndDialogCache(): void {
  rowsByKindFaction = null;
  rowsByKindCaptain = null;
}
