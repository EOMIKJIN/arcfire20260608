import { ITEM_DEFS_FROM_CSV } from '../data/generated';
import { getNpcCapitalShip } from '../npc/npcFleetRegistry';
import type { AppLocale } from './types';
import { useAppSettingsStore } from '../store/appSettingsStore';

export function resolveNpcCapitalShipDisplayName(
  npcShipId: string | null | undefined,
  fallback: string,
  locale: AppLocale,
): string {
  const id = String(npcShipId ?? '').trim();
  if (!id) return fallback;

  const npc = getNpcCapitalShip(id);
  if (locale !== 'ko' && npc?.nameEn?.trim()) return npc.nameEn.trim();
  if (npc?.name?.trim()) return npc.name.trim();

  const itemId = `capital_ship_${id}`;
  const itemDef = ITEM_DEFS_FROM_CSV[itemId];
  if (locale !== 'ko' && itemDef?.nameEn?.trim()) {
    return itemDef.nameEn.replace(/\s*\(Delivery\)\s*$/i, '').trim();
  }

  return fallback.trim() || id;
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
  if (locale !== 'ko' && row.labelEn?.trim()) return row.labelEn.trim();
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
  if (locale === 'ko') return String(descriptionKo ?? '').trim();
  const en = SHIP_TEMPLATE_DESC_EN[String(templateId).trim()];
  return en?.trim() || String(descriptionKo ?? '').trim();
}
