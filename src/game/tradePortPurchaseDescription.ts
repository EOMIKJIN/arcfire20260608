// ============================================================
// 무역소 구매 팝업 — item_defs / weapon_list / npc_ai_ships `특징설명`
// ============================================================

import {
  formatCapitalShipIdentityBlock,
  resolveCapitalShipClassification,
} from '../arcCore/balance/capitalShipClassification';
import type { ItemDef } from '../types';

function resolveNpcCapitalShipIdFromItem(itemDef: ItemDef): string | null {
  const attrs = itemDef.attrs as { npcCapitalShipId?: string } | undefined;
  const id = attrs?.npcCapitalShipId?.trim();
  return id || null;
}

export function resolveTradePortPurchaseDescription(
  itemDef: ItemDef | null | undefined,
): string | null {
  if (!itemDef) return null;

  const npcShipId = itemDef.type === 'capital_ship' ? resolveNpcCapitalShipIdFromItem(itemDef) : null;
  const classification = npcShipId ? resolveCapitalShipClassification(npcShipId) : null;
  const identityBlock = classification ? formatCapitalShipIdentityBlock(classification) : null;

  const feature = itemDef.featureDescription?.trim();
  const fallback = itemDef.description?.trim();
  const body = feature || fallback || null;

  if (identityBlock && body) return `${identityBlock}\n\n${body}`;
  if (identityBlock) return identityBlock;
  return body;
}
