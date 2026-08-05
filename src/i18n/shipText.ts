import { ITEM_DEFS_FROM_CSV } from '../data/generated';
import { SHIP_TEMPLATES } from '../data/ships';
import { getNpcCapitalShip } from '../npc/npcFleetRegistry';
import type { PlayerShip } from '../types';
import type { AppLocale } from './types';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { isKoUi } from './index';

/** `SHIP_TEMPLATES` KO name 대응 EN (템플릿 id 키) */
const SHIP_TEMPLATE_NAME_EN: Record<string, string> = {
  starter_fighter: 'Arcfire Mk.I',
  scout_ship: 'Scout Radar',
  freighter: 'Cosmos Freighter',
};

export function resolveNpcCapitalShipDisplayName(
  npcShipId: string | null | undefined,
  fallback: string,
  locale: AppLocale,
): string {
  const id = String(npcShipId ?? '').trim();
  if (!id) return fallback;

  const npc = getNpcCapitalShip(id);
  if (!isKoUi(locale) && npc?.nameEn?.trim()) return npc.nameEn.trim();
  if (npc?.name?.trim()) return npc.name.trim();

  const itemId = `capital_ship_${id}`;
  const itemDef = ITEM_DEFS_FROM_CSV[itemId];
  if (!isKoUi(locale) && itemDef?.nameEn?.trim()) {
    return itemDef.nameEn.replace(/\s*\(Delivery\)\s*$/i, '').trim();
  }

  return fallback.trim() || id;
}

/**
 * 플레이어 기함 표시명 — KO는 계정 `ship.name` 유지,
 * EN은 portrait NPC/템플릿 EN 우선 (저장값 KO 하드코딩 우회).
 */
export function resolvePlayerShipDisplayName(
  ship: Pick<PlayerShip, 'name' | 'templateId' | 'portraitNpcCapitalShipId'> | null | undefined,
  locale: AppLocale,
): string {
  if (!ship) return '';
  const stored = String(ship.name ?? '').trim();
  if (isKoUi(locale)) {
    return stored || String(ship.templateId ?? '').trim();
  }

  const portraitId = String(ship.portraitNpcCapitalShipId ?? '').trim();
  if (portraitId) {
    const fromNpc = resolveNpcCapitalShipDisplayName(portraitId, '', locale);
    if (fromNpc) return fromNpc;
  }

  const templateId = String(ship.templateId ?? '').trim();
  const tmplEn = SHIP_TEMPLATE_NAME_EN[templateId];
  if (tmplEn) return tmplEn;

  const tmplKo = SHIP_TEMPLATES[templateId]?.name?.trim();
  return stored || tmplKo || templateId;
}

export function resolveNpcCapitalShipDisplayNameNow(
  npcShipId: string | null | undefined,
  fallback: string,
): string {
  return resolveNpcCapitalShipDisplayName(
    npcShipId,
    fallback,
    useAppSettingsStore.getState().locale,
  );
}

type HullPurchaseLabelRow = { labelKo?: string; labelEn?: string };

export function resolveCapitalHullPurchaseLabel(
  row: HullPurchaseLabelRow,
  locale: AppLocale,
): string {
  if (!isKoUi(locale) && row.labelEn?.trim()) return row.labelEn.trim();
  return String(row.labelKo ?? '').trim();
}

const SHIP_TEMPLATE_DESC_EN: Record<string, string> = {
  starter_fighter:
    'An aging but reliable starter warship. Every pilot\'s first ship.',
  scout_ship: 'A fast, agile scout with high evasion.',
  freighter: 'A large cargo hauler built for trade. Weak in combat but huge hold.',
};

export function resolveShipTemplateDescription(
  templateId: string,
  descriptionKo: string | undefined,
  locale: AppLocale,
): string {
  if (isKoUi(locale)) return String(descriptionKo ?? '').trim();
  const en = SHIP_TEMPLATE_DESC_EN[String(templateId).trim()];
  return en?.trim() || String(descriptionKo ?? '').trim();
}
