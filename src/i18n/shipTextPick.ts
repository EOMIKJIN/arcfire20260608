import type { AppLocale } from './types';
import { isKoUi } from './index';

export function pickNpcCapitalShipDisplayName(
  locale: AppLocale,
  npc: { name?: string | null; nameEn?: string | null } | null | undefined,
  item: { name?: string | null; nameEn?: string | null } | null | undefined,
  fallback: string,
): string {
  const stripDelivery = (raw: string) => raw.replace(/\s*\(Delivery\)\s*$/i, '').trim();
  if (!isKoUi(locale)) {
    if (npc?.nameEn?.trim()) return npc.nameEn.trim();
    if (item?.nameEn?.trim()) return stripDelivery(item.nameEn);
  }
  if (npc?.name?.trim()) return npc.name.trim();
  if (item?.name?.trim()) return item.name.trim();
  return fallback.trim();
}
