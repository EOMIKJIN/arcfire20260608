// ============================================================
// 무역소 화면 정책 — app/(game)/trade.tsx 에서 분리한 순수 로직 축
// (2026-07-18 폴더구조 리팩토링 1단계 — 로직 무변경·위치만 이동)
// 훅·JSX 의존성 없음. store 접근은 getState() 단발 read/write 만.
// ============================================================

import { t as tStatic } from '../i18n';
import { TRADE_GOODS, getItemDef } from '../data/goods';
import { MarketListing, ItemDef, Player, MissionProgress } from '../types';
import { getPlanetTradePortItemIds } from '../world/planetTradePortDb';
import {
  filterTradePortCatalogForBuyMarket,
  filterTradePortCatalogForPlayer,
} from '../arcCore/balance/tradePortCatalogPolicy';
import {
  applyQuestMarketListingOverrides,
  mergeQuestTradePortItemIds,
} from '../missions/questItemOpsRegistry';
import {
  addToInventorySlotsMax,
  countGoodInInventory,
  maxAddableToInventory,
  normalizeInventorySlots,
} from './playerInventory';
import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { previewPlanetOwnershipDeedPurchase } from '../clanWar/planetOwnershipModel';
import { soloClanIdForUid } from '../clanWar/clanWarRules';
import { computeTradeFeeForPlanetGross } from './planetDevelopment/planetTradePortRuntimeBridge';
import { resolveTradeMineralSinkTotalQty } from '../arcCore/economy/tradeMineralSinkPolicy';
import { usePlayerStore } from '../store/playerStore';
import { reversePlanetTradeTransactionFee } from '../arcCore/economy/applyPlanetTradeTransactionFee';
import { useMissionStore } from '../store/missionStore';
import { generateMarketByItemIds, getBuyPrice, getSellPrice } from '../engine/TradeEngine';
import { resolvePlayerLifetimeCredits } from './resolvePlayerLifetimeCredits';
import { resolveTradeRoutePlayerSellUnit } from '../arcCore/economy/tradeRouteCommercePolicy';
import { resolveMineralCatalogSellPrice } from '../arcCore/economy/mineralTradePricing';

const DEMAND_LABEL_KEYS: Record<string, string> = {
  low: 'trade.demand.low', normal: 'trade.demand.normal', high: 'trade.demand.high',
};
export function demandLabel(demand: string): string {
  return tStatic(DEMAND_LABEL_KEYS[demand] ?? 'trade.demand.normal');
}

export const arcTradeDialogButtons = () => [
  { text: tStatic('trade.btn.cancel'), style: 'cancel' as const },
  { text: tStatic('trade.btn.confirm') },
];

export function isSellableByTable(itemDef: ItemDef | null | undefined): boolean {
  if (!itemDef) return false;
  if (!itemDef.tradeable) return false;
  return itemDef.sellable === true;
}

export function resolveTradeGoodById(goodId: string) {
  return TRADE_GOODS[goodId];
}

export function resolveItemDefById(goodId: string) {
  return getItemDef(goodId);
}

export type TradeBuyBlock = { title: string; message: string };

export function resolveTradePortListedItemIds(
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): string[] {
  let catalogIds = getPlanetTradePortItemIds(planetId);
  // 카탈로그 resync는 tradeScreenSession·arcMemoryGovernor warm 에서만 — 렌더 dispatch 금지
  const base = filterTradePortCatalogForBuyMarket(catalogIds, playerLevel);
  return mergeQuestTradePortItemIds(planetId, base, progresses);
}

export function resolveTradeBuyBlock(input: {
  listing: MarketListing;
  qty: number;
  itemDef: ItemDef | null | undefined;
  player: Player;
  unitPrice: number;
  hasEverPurchasedItem: (uid: string, itemId: string) => boolean;
  planetId?: string | null;
}): TradeBuyBlock | null {
  const { listing, qty, itemDef, player, unitPrice, hasEverPurchasedItem, planetId } = input;
  const buyQty = Math.max(1, Math.floor(qty));
  const isPlanetOwnershipItemType = itemDef?.type === 'planet_ownership';
  const isCapitalShipItemType = itemDef?.type === 'capital_ship';
  const capitalShipNpcId = isCapitalShipItemType && typeof itemDef?.attrs?.npcCapitalShipId === 'string'
    ? String(itemDef.attrs.npcCapitalShipId)
    : null;
  const alreadyOwnsCapitalShip = isCapitalShipItemType && capitalShipNpcId
    ? (
        countGoodInInventory(normalizeInventorySlots(player.inventorySlots), listing.goodId) > 0
        || player.shipHangar.some((h) => h.npcCapitalShipId === capitalShipNpcId)
      )
    : false;
  const blockedByHistory = Boolean(
    (itemDef?.nonRepurchase || isCapitalShipItemType)
    && !isPlanetOwnershipItemType
    && player.uid
    && hasEverPurchasedItem(player.uid, listing.goodId),
  );

  if ((isCapitalShipItemType && alreadyOwnsCapitalShip) || (!isCapitalShipItemType && blockedByHistory)) {
    return { title: tStatic('trade.block.norepurchaseTitle'), message: tStatic('trade.block.norepurchaseMsg') };
  }

  if (isPlanetOwnershipItemType) {
    const deedPlanetId = typeof itemDef?.attrs?.planetId === 'string'
      ? String(itemDef.attrs.planetId).trim()
      : null;
    if (deedPlanetId && player.uid) {
      const clanWar = useClanWarFoundationStore.getState();
      const purchasePreview = previewPlanetOwnershipDeedPurchase(
        deedPlanetId,
        clanWar.planetHolds[deedPlanetId],
        soloClanIdForUid(player.uid),
        player.political.megaFactionId,
        clanWar.clans,
      );
      if (!purchasePreview.ok) {
        const failMsgKey =
          purchasePreview.reason === 'red_territory'
            ? 'trade.own.claimFailRedTerritory'
            : purchasePreview.reason === 'already_owner'
              ? 'trade.own.claimFailAlready'
              : purchasePreview.reason === 'owned_by_other_clan'
                ? 'trade.own.claimFailMsg'
                : purchasePreview.reason === 'faction_mismatch' || purchasePreview.reason === 'neutral_territory'
                  ? 'trade.own.claimFailFaction'
                  : 'trade.own.claimFailMsg';
        return { title: tStatic('trade.own.claimFailTitle'), message: tStatic(failMsgKey) };
      }
    }
  }

  if (!filterTradePortCatalogForPlayer([listing.goodId], player.level).includes(listing.goodId)) {
    return { title: tStatic('trade.block.cannotBuyTitle'), message: tStatic('trade.block.level') };
  }
  if (listing.stock <= 0 || buyQty > listing.stock) {
    return { title: tStatic('trade.block.cannotBuyTitle'), message: tStatic('trade.block.stock') };
  }

  const isNoInventoryPurchase =
    itemDef?.type === 'planet_ownership'
    || itemDef?.type === 'clan_disband'
    || itemDef?.type === 'capital_ship';
  if (!isNoInventoryPurchase) {
    const invSlotsNow = normalizeInventorySlots(player.inventorySlots);
    const maxInv = maxAddableToInventory(invSlotsNow, listing.goodId, listing.stock);
    if (maxInv < buyQty) {
      return { title: tStatic('trade.block.cannotBuyTitle'), message: tStatic('trade.block.invSpace') };
    }
  }

  const grossPreview = unitPrice * buyQty;
  const feePreview = computeTradeFeeForPlanetGross(planetId ?? player.currentPlanetId, grossPreview);
  const totalChargedPreview = grossPreview + feePreview.totalFee;
  if (player.credits < totalChargedPreview) {
    return { title: tStatic('trade.block.cannotBuyTitle'), message: tStatic('trade.block.credits') };
  }

  const mineralSink = resolveTradeMineralSinkTotalQty(itemDef, buyQty);
  if (mineralSink) {
    const ownedMineral = countGoodInInventory(
      normalizeInventorySlots(player.inventorySlots),
      mineralSink.mineralItemId,
    );
    if (ownedMineral < mineralSink.totalQty) {
      return {
        title: tStatic('trade.block.cannotBuyTitle'),
        message: tStatic('trade.block.mineral', { need: mineralSink.totalQty, owned: ownedMineral }),
      };
    }
  }

  return null;
}

export function refundTradeMineralSink(
  player: Player,
  itemDef: ItemDef | null | undefined,
  buyQty: number,
): Player {
  const mineralSink = resolveTradeMineralSinkTotalQty(itemDef, buyQty);
  if (!mineralSink) return player;
  const restored = addToInventorySlotsMax(
    normalizeInventorySlots(player.inventorySlots),
    mineralSink.mineralItemId,
    mineralSink.totalQty,
    0,
  );
  return { ...player, inventorySlots: restored.slots };
}

export function rollbackTradeBuyFailure(input: {
  itemDef: ItemDef | null | undefined;
  buyQty: number;
  totalCharged: number;
  planetId?: string | null;
  grossCredits?: number;
  capitalShipNpcId?: string | null;
}): void {
  const store = usePlayerStore.getState();
  const current = store.player;
  if (current) {
    const restored = refundTradeMineralSink(current, input.itemDef, input.buyQty);
    if (restored !== current) store.setPlayer(restored);
  }
  store.addCredits(input.totalCharged);
  if (input.planetId && input.grossCredits != null && input.grossCredits > 0) {
    reversePlanetTradeTransactionFee(input.planetId, input.grossCredits);
  }
  if (input.capitalShipNpcId) store.removeHangarShipByNpcId(input.capitalShipNpcId);
}

export function resolveFreshTradeBuyUnitPrice(
  listing: MarketListing,
  planetId: string,
  player: Player,
): number {
  const progresses = useMissionStore.getState().progresses;
  const base = generateMarketByItemIds(
    resolveTradePortListedItemIds(planetId, player.level, progresses),
    planetId.length * 37,
    resolvePlayerLifetimeCredits(player),
    planetId,
  );
  // 화면 진열과 동일한 퀘스트 배치 단가 오버라이드를 적용해야 표시가와 일치한다.
  const freshListing = applyQuestMarketListingOverrides(base, planetId, progresses)
    .find((m) => m.goodId === listing.goodId);
  return getBuyPrice(freshListing ?? listing);
}

/** 수량 선택 UI 상한 — 진열 재고 기준(0이면 1). 구매 가능 여부는 구매 버튼에서 검증 */
export function resolveTradeBuyPickerMaxQty(listing: MarketListing): number {
  return Math.max(1, listing.stock);
}

export function resolveInventorySellPrice(
  planetId: string,
  goodId: string,
  basePrice: number,
  listing: MarketListing | undefined,
  inventoryBuyUnitPrice = 0,
): number {
  const itemDef = resolveItemDefById(goodId);
  if (itemDef?.type === 'trade_route') {
    const tgSell = resolveTradeRoutePlayerSellUnit(planetId, goodId, inventoryBuyUnitPrice);
    if (tgSell > 0) return tgSell;
  }
  if (listing) return getSellPrice(listing, { planetId, goodId });
  const mineralPolicy = resolveMineralCatalogSellPrice(goodId);
  if (mineralPolicy != null) return mineralPolicy;
  return Math.floor(basePrice * 0.7);
}
