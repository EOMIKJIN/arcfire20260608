// ============================================================
// 아크파이어 온라인 - 무역소 화면
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { presentArcOverlayTradeQuantity } from '../../src/ui/overlay/presentArcTradeQuantity';
import { listTradeResellProfitTips } from '../../src/game/tradeProfitTips';
import { formatCredits } from '../../src/utils/formatCredits';
import { usePlayerStore } from '../../src/store/playerStore';
import { useWorldStore } from '../../src/store/worldStore';
import { useMissionStore } from '../../src/store/missionStore';
import { useItemLedgerStore } from '../../src/store/itemLedgerStore';
import { useClanWarFoundationStore } from '../../src/store/clanWarFoundationStore';
import { generateMarketByItemIds, getBuyPrice, getSellPrice } from '../../src/engine/TradeEngine';
import { TRADE_GOODS, getItemDef } from '../../src/data/goods';
import { listArcCoreGalacticMineralItemIds, resolveMineralCatalogSellPrice } from '../../src/arcCore/economy/mineralTradePricing';
import {
  addToInventorySlotsMax,
  aggregateInventoryForTrade,
  countGoodInInventory,
  inventoryHasRoomFor,
  maxAddableToInventory,
  normalizeInventorySlots,
  removeGoodFromInventorySlots,
} from '../../src/game/playerInventory';
import { MarketListing, CargoItem, ItemDef } from '../../src/types';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import { usePlanetSubStageMemory } from '../../src/hooks/usePlanetSubStageMemory';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { ArcStageBackButton } from '../../src/ui/overlay/ArcStageBackButton';
import { PlanetFacilityTabBar } from '../../src/ui/planetFacility/PlanetFacilityTabBar';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import { getPlanetTradePortItemIds } from '../../src/world/planetTradePortDb';
import { adjustPlanetTradeMarketStock } from '../../src/world/planetTradeMarketStore';
import { resolveTradeRoutePlayerSellUnit } from '../../src/arcCore/economy/tradeRouteCommercePolicy';
import { filterTradePortCatalogForPlayer } from '../../src/arcCore/balance/tradePortCatalogPolicy';
import { runTradeRouteMarketPass } from '../../src/arcCore/economy/runTradeRouteMarketPass';
import { resolvePlayerLifetimeCredits } from '../../src/game/resolvePlayerLifetimeCredits';
import {
  TRADE_BUY_SUB_TAB_LABELS,
  TRADE_BUY_SUB_TAB_ORDER,
  inferTradeBuySubTabFromGoodId,
  type TradeBuySubTabId,
} from '../../src/game/tradeBuySubTab';
import { TradeListingIcon } from '../../src/ui/trade/TradeListingIcon';

const DEMAND_LABELS: Record<string, string> = {
  low: '낮음 ↓', normal: '보통', high: '높음 ↑',
};

const DEMAND_COLORS: Record<string, string> = {
  low: COLORS.ink_light,
  normal: COLORS.ink_mid,
  high: COLORS.danger,
};
/** 메인스테이지 기준 하단 공백과 동기 */
const TRADE_BOTTOM_STAGE_RESERVE_PX = PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX;

function isSellableByTable(itemDef: ItemDef | null | undefined): boolean {
  if (!itemDef) return false;
  if (!itemDef.tradeable) return false;
  return itemDef.sellable === true;
}

function resolveTradeGoodById(goodId: string) {
  return TRADE_GOODS[goodId];
}

function resolveItemDefById(goodId: string) {
  return getItemDef(goodId);
}

function resolveInventorySellPrice(
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

export default function TradeScreen() {
  const player = usePlayerStore(s => s.player);
  const spendCredits = usePlayerStore(s => s.spendCredits);
  const addCredits = usePlayerStore(s => s.addCredits);
  const addHangarShipFromNpcPurchase = usePlayerStore(s => s.addHangarShipFromNpcPurchase);
  const removeHangarShipByNpcId = usePlayerStore(s => s.removeHangarShipByNpcId);
  const persist = usePlayerStore(s => s.persist);
  const setPlayer = usePlayerStore(s => s.setPlayer);
  const getSystem = useWorldStore(s => s.getSystem);
  const completeObjective = useMissionStore(s => s.completeObjective);
  const getActiveMission = useMissionStore(s => s.getActiveMission);
  const appendItemTxn = useItemLedgerStore(s => s.appendTxn);
  const hasEverPurchasedItem = useItemLedgerStore(s => s.hasEverPurchasedItem);
  const persistItemLedger = useItemLedgerStore(s => s.persistItemLedger);
  const claimPlanetOwnershipByPurchase = useClanWarFoundationStore(s => s.claimPlanetOwnershipByPurchase);
  const dissolvePlayerClanByPurchase = useClanWarFoundationStore(s => s.dissolvePlayerClanByPurchase);

  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [buySubTab, setBuySubTab] = useState<TradeBuySubTabId>('weapon');
  const [marketTick, setMarketTick] = useState(0);
  const safeBack = useSafeRouterBack();
  const stageFrameReady = useStageFirstFrameReady();
  usePlanetSubStageMemory('trade', () => {
    setTab('buy');
    setBuySubTab('weapon');
  });

  const system = player ? getSystem(player.currentSystemId) : undefined;
  const planet = system?.planets.find(p => p.id === player?.currentPlanetId) ?? system?.planets[0];

  const market = useMemo(
    () =>
      planet && player
        ? generateMarketByItemIds(
            filterTradePortCatalogForPlayer(getPlanetTradePortItemIds(planet.id), player.level),
            planet.id.length * 37,
            resolvePlayerLifetimeCredits(player),
            planet.id,
          )
        : [],
    [planet?.id, player?.level, player?.lifetimeCreditsEarned, player?.credits, marketTick],
  );
  const inventorySellAgg = useMemo(() => {
    if (!player) return [];
    const normalizedSlots = normalizeInventorySlots(player.inventorySlots);
    const invAgg = aggregateInventoryForTrade(normalizedSlots);
    const map = new Map(invAgg.map((row) => [row.goodId, { ...row }]));
    // 채굴 광물(은하 풀)은 인벤 실수량 기준으로 판매 탭에 항상 반영한다.
    for (const mineralId of listArcCoreGalacticMineralItemIds()) {
      const miningRewardQty = countGoodInInventory(normalizedSlots, mineralId);
      if (miningRewardQty <= 0) continue;
      const prev = map.get(mineralId);
      if (prev) prev.quantity = miningRewardQty;
      else {
        map.set(mineralId, {
          goodId: mineralId,
          quantity: miningRewardQty,
          buyPrice: 0,
        });
      }
    }
    // 레거시 ore_mineral_1 인벤
    const legacyOreQty = countGoodInInventory(normalizedSlots, 'ore_mineral_1');
    if (legacyOreQty > 0) {
      const prev = map.get('ore_mineral_1');
      if (prev) prev.quantity = legacyOreQty;
      else {
        map.set('ore_mineral_1', {
          goodId: 'ore_mineral_1',
          quantity: legacyOreQty,
          buyPrice: 0,
        });
      }
    }
    const hangarCountByItemId = new Map<string, number>();
    player.shipHangar.forEach((h) => {
      const itemId = `capital_ship_${h.npcCapitalShipId}`;
      hangarCountByItemId.set(itemId, (hangarCountByItemId.get(itemId) ?? 0) + 1);
    });
    hangarCountByItemId.forEach((qty, itemId) => {
      const prev = map.get(itemId);
      if (prev) {
        prev.quantity = qty;
        return;
      }
      const good = TRADE_GOODS[itemId];
      map.set(itemId, {
        goodId: itemId,
        quantity: qty,
        buyPrice: good?.basePrice ?? 0,
      });
    });
    return [...map.values()];
  }, [player]);

  const filteredBuyMarket = useMemo(
    () => market.filter(m => inferTradeBuySubTabFromGoodId(m.goodId) === buySubTab),
    [market, buySubTab],
  );

  const sortedInventorySellAgg = useMemo(() => {
    return [...inventorySellAgg].sort((a, b) => {
      const listingA = market.find(m => m.goodId === a.goodId);
      const listingB = market.find(m => m.goodId === b.goodId);
      const goodA = resolveTradeGoodById(a.goodId);
      const goodB = resolveTradeGoodById(b.goodId);
      const priceA = planet
        ? resolveInventorySellPrice(planet.id, a.goodId, goodA?.basePrice ?? 0, listingA, a.buyPrice)
        : Math.floor((goodA?.basePrice ?? 0) * 0.7);
      const priceB = planet
        ? resolveInventorySellPrice(planet.id, b.goodId, goodB?.basePrice ?? 0, listingB, b.buyPrice)
        : Math.floor((goodB?.basePrice ?? 0) * 0.7);
      return priceA - priceB;
    });
  }, [inventorySellAgg, market, planet?.id]);

  const tradeMainTabs = useMemo(
    () => [
      { id: 'buy', label: '구매' },
      {
        id: 'sell',
        label: inventorySellAgg.length > 0 ? `판매 (${inventorySellAgg.length})` : '판매',
      },
    ],
    [inventorySellAgg.length],
  );

  const tradeBuyCategoryTabs = useMemo(
    () => TRADE_BUY_SUB_TAB_ORDER.map((id) => ({ id, label: TRADE_BUY_SUB_TAB_LABELS[id] })),
    [],
  );

  const tradePlanetIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!planet?.id) return;
    runTradeRouteMarketPass(false);
    setMarketTick((t) => t + 1);
  }, [planet?.id]);

  useEffect(() => {
    if (!player || !planet) return;
    if (tradePlanetIdRef.current === planet.id) return;
    tradePlanetIdRef.current = planet.id;
    if (market.length === 0) return;
    const counts = TRADE_BUY_SUB_TAB_ORDER.map((id) => ({
      id,
      n: market.filter((m) => inferTradeBuySubTabFromGoodId(m.goodId) === id).length,
    }));
    const best = counts.reduce(
      (a, b) => (b.n > a.n ? b : a),
      { id: 'item' as TradeBuySubTabId, n: 0 },
    );
    if (best.n > 0) setBuySubTab(best.id);
  }, [player, planet, market]);

  if (!player || !planet) return null;

  const tradePortMiningDelivered = player.orbitalMiningDeliveredByPlanet?.[planet.id] ?? {};
  const deliveredSum = Object.values(tradePortMiningDelivered).reduce((s, n) => s + n, 0);
  const tradePortMiningTotal = deliveredSum > 0
    ? deliveredSum
    : (player.orbitalMiningOre1DeliveredByPlanet[planet.id] ?? 0);
  const inventoryMiningQty = listArcCoreGalacticMineralItemIds().reduce(
    (sum, mineralId) => sum + countGoodInInventory(normalizeInventorySlots(player.inventorySlots), mineralId),
    countGoodInInventory(normalizeInventorySlots(player.inventorySlots), 'ore_mineral_1'),
  );

  const handleBuy = (listing: MarketListing) => {
    const good = resolveTradeGoodById(listing.goodId);
    if (!good) return;
    const itemDef = resolveItemDefById(listing.goodId);
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
    const isNoInventoryPurchase =
      itemDef?.type === 'planet_ownership'
      || itemDef?.type === 'clan_disband'
      || itemDef?.type === 'capital_ship';
    const blockedByHistory = Boolean(
      (itemDef?.nonRepurchase || isCapitalShipItemType)
      && !isPlanetOwnershipItemType
      && player.uid
      && hasEverPurchasedItem(player.uid, listing.goodId),
    );
    if ((isCapitalShipItemType && alreadyOwnsCapitalShip) || (!isCapitalShipItemType && blockedByHistory)) {
      showArcAlert('재구매 불가', '이 아이템은 계정당 1회만 구매할 수 있습니다.');
      return;
    }
    if (!filterTradePortCatalogForPlayer([listing.goodId], player.level).includes(listing.goodId)) {
      showArcAlert('구매 불가', '파일럿 레벨이 이 상품의 요구 조건에 미달합니다.');
      return;
    }
    const price = getBuyPrice(listing);
    const invSlotsNow = normalizeInventorySlots(player.inventorySlots);
    const maxInv = maxAddableToInventory(invSlotsNow, listing.goodId, listing.stock);
    const maxQty = isNoInventoryPurchase
      ? Math.min(1, listing.stock, Math.floor(player.credits / price))
      : Math.min(listing.stock, maxInv, Math.floor(player.credits / price));

    if (maxQty <= 0) {
      showArcAlert(
        '구매 불가',
        isNoInventoryPurchase
          ? '크레딧이 부족하거나 재고가 없습니다.'
          : '크레딧이 부족하거나 인벤토리 공간이 부족합니다.',
      );
      return;
    }

    presentArcOverlayTradeQuantity({
      mode: 'buy',
      title: `${good.name} 구매`,
      unitPrice: price,
      maxQty,
      stock: listing.stock,
      demandLabel: DEMAND_LABELS[listing.demand],
      tips: listTradeResellProfitTips(
        planet.id,
        listing.goodId,
        price,
        resolvePlayerLifetimeCredits(player),
      ),
      onConfirm: (qty) => executeBuyQuantity(listing, qty, itemDef, price, capitalShipNpcId),
    });
  };

  const executeBuyQuantity = async (
    listing: MarketListing,
    buyQty: number,
    itemDef: ItemDef | null | undefined,
    unitPrice: number,
    capitalShipNpcId: string | null,
  ) => {
    if (!player || !planet) return;
    const qty = Math.max(1, Math.floor(buyQty));
    const totalCost = unitPrice * qty;
    const ok = spendCredits(totalCost);
    if (!ok) {
      showArcAlert('구매 실패', '크레딧이 부족합니다.');
      return;
    }

    const ownershipPlanetId = typeof itemDef?.attrs?.planetId === 'string'
      ? String(itemDef.attrs.planetId)
      : null;
    const isPlanetOwnershipItem = itemDef?.type === 'planet_ownership' && ownershipPlanetId != null;
    const isClanDisbandItem = itemDef?.type === 'clan_disband';
    const isCapitalShipItem = itemDef?.type === 'capital_ship';
    let purchaseNote = 'inventory';
    let capitalShipIdForRollback: string | null = null;

    if (isPlanetOwnershipItem && ownershipPlanetId) {
      const claim = claimPlanetOwnershipByPurchase({
        uid: player.uid,
        planetId: ownershipPlanetId,
        systemId: player.currentSystemId,
        nickname: player.nickname,
        megaFactionId: player.political.megaFactionId,
      });
      if (!claim.ok) {
        addCredits(totalCost);
        showArcAlert('소유권 획득 실패', '이미 다른 클랜이 점유한 행성입니다.');
        return;
      }
      if (player.uid) {
        appendItemTxn({
          uid: player.uid,
          itemId: listing.goodId,
          deltaQty: 1,
          txnType: 'trade_buy',
          unitPrice,
          systemId: player.currentSystemId,
          planetId: player.currentPlanetId,
          note: `planet_ownership_claim:${ownershipPlanetId}`,
        });
        await persistItemLedger();
      }
      await persist();
      showArcAlert('소유권 획득', `${planet.name} 소유권을 구매해 현재 클랜이 행성을 점유했습니다.`);
      return;
    }
    if (isClanDisbandItem) {
      const dissolve = dissolvePlayerClanByPurchase({ uid: player.uid });
      if (!dissolve.ok) {
        addCredits(totalCost);
        showArcAlert('클랜 해산 실패', '현재 해산 가능한 클랜이 없습니다.');
        return;
      }
      if (player.uid) {
        appendItemTxn({
          uid: player.uid,
          itemId: listing.goodId,
          deltaQty: 1,
          txnType: 'trade_buy',
          unitPrice,
          systemId: player.currentSystemId,
          planetId: player.currentPlanetId,
          note: `clan_disband:${dissolve.dissolvedClanId ?? 'unknown'}:${dissolve.releasedPlanetCount ?? 0}`,
        });
        await persistItemLedger();
      }
      await persist();
      showArcAlert('클랜 해산 완료', `클랜이 해산되었고 점유 행성 ${dissolve.releasedPlanetCount ?? 0}개가 중립 상태로 복귀했습니다.`);
      return;
    }
    if (isCapitalShipItem) {
      if (player.shipHangar.length >= 30) {
        addCredits(totalCost);
        showArcAlert('인도 실패', '격납고 보유 한도(30대)에 도달했습니다.');
        return;
      }
      const npcCapitalShipId = typeof itemDef?.attrs?.npcCapitalShipId === 'string'
        ? String(itemDef.attrs.npcCapitalShipId)
        : '';
      if (!npcCapitalShipId) {
        addCredits(totalCost);
        showArcAlert('인도 실패', '전함 데이터가 올바르지 않습니다.');
        return;
      }
      const hangarOk = addHangarShipFromNpcPurchase(npcCapitalShipId);
      if (!hangarOk) {
        addCredits(totalCost);
        showArcAlert('인도 실패', '등록되지 않은 전함입니다.');
        return;
      }
      purchaseNote = `capital_ship_hangar:${npcCapitalShipId}`;
      capitalShipIdForRollback = npcCapitalShipId;
    }

    const slots0 = normalizeInventorySlots(player.inventorySlots);
    const invTry = addToInventorySlotsMax(slots0, listing.goodId, qty, unitPrice);
    const inventoryAdded = invTry.added > 0;
    const shouldAllowWithoutInventory = isCapitalShipItem;
    if (!inventoryAdded && !shouldAllowWithoutInventory) {
      if (capitalShipIdForRollback) {
        removeHangarShipByNpcId(capitalShipIdForRollback);
      }
      addCredits(totalCost);
      showArcAlert('구매 실패', '인벤토리 공간이 부족합니다.');
      return;
    }
    if (inventoryAdded) {
      const latestPlayerAfterSideEffects = usePlayerStore.getState().player ?? player;
      setPlayer({ ...latestPlayerAfterSideEffects, inventorySlots: invTry.slots });
    }
    if (player.uid && inventoryAdded) {
      appendItemTxn({
        uid: player.uid,
        itemId: listing.goodId,
        deltaQty: invTry.added,
        txnType: 'trade_buy',
        unitPrice,
        systemId: player.currentSystemId,
        planetId: player.currentPlanetId,
        note: purchaseNote,
      });
      await persistItemLedger();
    }

    const active = getActiveMission();
    if (active) {
      const invAfter = inventoryAdded ? invTry.slots : normalizeInventorySlots(player.inventorySlots);
      const owned = isCapitalShipItem && capitalShipNpcId
        ? player.shipHangar.filter((h) => h.npcCapitalShipId === capitalShipNpcId).length
        : countGoodInInventory(invAfter, listing.goodId);
      active.mission.objectives.forEach(obj => {
        if (obj.type === 'buy_goods' && obj.targetId === listing.goodId) {
          if (!obj.quantity || owned >= obj.quantity) {
            completeObjective(active.mission.id, obj.id);
          }
        }
      });
    }
    if (itemDef?.type === 'trade_route' && player.currentPlanetId && inventoryAdded) {
      adjustPlanetTradeMarketStock(player.currentPlanetId, listing.goodId, -invTry.added);
      setMarketTick((t) => t + 1);
    }
    await persist();
  };

  const handleSell = (item: CargoItem) => {
    const sellListing = market.find(m => m.goodId === item.goodId);
    const itemDef = resolveItemDefById(item.goodId);
    const good = resolveTradeGoodById(item.goodId) ?? (
      itemDef
        ? {
            id: itemDef.id,
            name: itemDef.name,
            description: itemDef.description,
            basePrice: itemDef.basePrice,
            priceVariance: itemDef.priceVariance,
            volume: itemDef.volume,
            category: itemDef.category,
          }
        : null
    );
    if (!good) return;
    if (!isSellableByTable(itemDef)) {
      showArcAlert('판매 불가', '이 아이템은 재판매할 수 없습니다.');
      return;
    }

    const price = resolveInventorySellPrice(
      planet.id,
      item.goodId,
      good.basePrice,
      sellListing,
      item.buyPrice,
    );

    const shipHangarOwnedCount = itemDef?.type === 'capital_ship'
      ? (() => {
          const npcCapitalShipId = typeof itemDef.attrs?.npcCapitalShipId === 'string'
            ? String(itemDef.attrs.npcCapitalShipId)
            : '';
          if (!npcCapitalShipId) return 0;
          return player.shipHangar.filter((h) => h.npcCapitalShipId === npcCapitalShipId).length;
        })()
      : item.quantity;
    const sellQty = itemDef?.type === 'capital_ship'
      ? Math.min(item.quantity, shipHangarOwnedCount)
      : item.quantity;
    if (sellQty <= 0) {
      showArcAlert('판매 실패', '격납고 보유 전함이 없어 판매할 수 없습니다.');
      return;
    }
    if (itemDef?.type === 'capital_ship') {
      const currentShipNpcId = player.ship.portraitNpcCapitalShipId ?? null;
      const targetNpcId = typeof itemDef.attrs?.npcCapitalShipId === 'string'
        ? String(itemDef.attrs.npcCapitalShipId)
        : null;
      if (currentShipNpcId && targetNpcId && currentShipNpcId === targetNpcId) {
        showArcAlert('판매 불가', '현재 탑승 중인 전함은 판매할 수 없습니다. 다른 전함으로 교체 후 판매하세요.');
        return;
      }
    }

    presentArcOverlayTradeQuantity({
      mode: 'sell',
      title: `${good.name} 판매 (인벤토리)`,
      unitPrice: price,
      maxQty: sellQty,
      ownedQty: item.quantity,
      onConfirm: (qty) => executeSellQuantity(item, qty, itemDef, price),
    });
  };

  const executeSellQuantity = async (
    item: CargoItem,
    sellQtyInput: number,
    itemDef: ItemDef | null | undefined,
    unitPrice: number,
  ) => {
    if (!player || !planet) return;
    const sellQty = Math.max(1, Math.min(Math.floor(sellQtyInput), item.quantity));

    let workingPlayer = usePlayerStore.getState().player ?? player;
    if (itemDef?.type === 'capital_ship') {
      const npcCapitalShipId = typeof itemDef.attrs?.npcCapitalShipId === 'string'
        ? String(itemDef.attrs.npcCapitalShipId)
        : '';
      if (!npcCapitalShipId) {
        showArcAlert('판매 실패', '전함 아이템 데이터가 올바르지 않습니다.');
        return;
      }
      const ownedCount = workingPlayer.shipHangar.filter((h) => h.npcCapitalShipId === npcCapitalShipId).length;
      if (ownedCount < sellQty) {
        showArcAlert('판매 실패', '격납고 보유 전함이 없어 판매할 수 없습니다.');
        return;
      }
      for (let i = 0; i < sellQty; i += 1) {
        removeHangarShipByNpcId(npcCapitalShipId);
      }
      workingPlayer = usePlayerStore.getState().player ?? workingPlayer;
    }
    addCredits(unitPrice * sellQty);
    const next = removeGoodFromInventorySlots(
      normalizeInventorySlots(workingPlayer.inventorySlots),
      item.goodId,
      sellQty,
    );
    if (!next) {
      showArcAlert('판매 실패', '인벤토리 수량을 확인할 수 없습니다.');
      return;
    }
    const latestPlayerBeforeSellSync = usePlayerStore.getState().player ?? workingPlayer;
    setPlayer({ ...latestPlayerBeforeSellSync, inventorySlots: next });
    if (player.uid) {
      appendItemTxn({
        uid: player.uid,
        itemId: item.goodId,
        deltaQty: -sellQty,
        txnType: 'trade_sell',
        unitPrice,
        systemId: player.currentSystemId,
        planetId: player.currentPlanetId,
        note: 'inventory',
      });
      await persistItemLedger();
    }
    if (itemDef?.type === 'trade_route' && player.currentPlanetId) {
      adjustPlanetTradeMarketStock(player.currentPlanetId, item.goodId, sellQty, 'player');
      setMarketTick((t) => t + 1);
    }
    await persist();
  };

  return (
    <StageShell routeName="trade" background="none" edges={['bottom']}>
      <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <ArcStageBackButton onPress={safeBack} style={styles.backBtn} />
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>무역소</Text>
          {(tradePortMiningTotal > 0 || inventoryMiningQty > 0) && (
            <Text style={styles.headerMiningLine} numberOfLines={1}>
              채굴 광물 무역소 누적 입고 {tradePortMiningTotal.toLocaleString()} · 인벤 보유 {inventoryMiningQty.toLocaleString()}
            </Text>
          )}
        </View>
        <Text style={styles.cargoText}>인벤 슬롯 {inventorySellAgg.length}</Text>
      </View>

      <PlanetFacilityTabBar
        tabs={tradeMainTabs}
        activeId={tab}
        onSelect={(id) => setTab(id as 'buy' | 'sell')}
      />

      {tab === 'buy' && market.length > 0 ? (
        <PlanetFacilityTabBar
          tabs={tradeBuyCategoryTabs}
          activeId={buySubTab}
          onSelect={(id) => setBuySubTab(id as TradeBuySubTabId)}
        />
      ) : null}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'buy' ? (
          market.length === 0 ? (
            <Text style={styles.empty}>거래 가능한 상품이 없습니다.</Text>
          ) : (
            <>
              {filteredBuyMarket.length === 0 ? (
                <Text style={styles.empty}>이 하위 구분에 거래 가능한 상품이 없습니다.</Text>
              ) : null}
              {filteredBuyMarket.map(listing => {
              const good = resolveTradeGoodById(listing.goodId);
              if (!good) return null;
              const price = getBuyPrice(listing);
              const canAfford = player.credits >= price;
              const rowItemDef = resolveItemDefById(listing.goodId);
              const purchaseIgnoresCargo =
                rowItemDef?.type === 'planet_ownership'
                || rowItemDef?.type === 'clan_disband'
                || rowItemDef?.type === 'capital_ship';
              const hasInv = inventoryHasRoomFor(
                normalizeInventorySlots(player.inventorySlots),
                listing.goodId,
              );
              const hasSpace = purchaseIgnoresCargo || hasInv;

              return (
                <TouchableOpacity
                  key={listing.goodId}
                  style={[styles.listingCard, (!canAfford || !hasSpace) && styles.listingDisabled]}
                  onPress={() => handleBuy(listing)}
                  disabled={!canAfford || !hasSpace}
                >
                  <View style={styles.listingLeft}>
                    <TradeListingIcon
                      goodId={listing.goodId}
                      category={good.category}
                      buySubTab={buySubTab}
                    />
                    <View style={styles.listingTextBlock}>
                      <Text style={styles.goodName}>{good.name}</Text>
                      <Text style={styles.goodDesc} numberOfLines={1}>{good.description}</Text>
                    </View>
                  </View>
                  <View style={styles.listingRight}>
                    <Text style={styles.goodPrice}>{formatCredits(price)}</Text>
                    <Text style={[styles.goodDemand, { color: DEMAND_COLORS[listing.demand] }]}>
                      수요 {DEMAND_LABELS[listing.demand]}
                    </Text>
                    <Text style={styles.goodStock}>재고 {listing.stock}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            </>
          )
        ) : inventorySellAgg.length === 0 ? (
          <Text style={styles.empty}>인벤토리가 비어 있습니다.</Text>
        ) : (
          <>
            <Text style={styles.sellSectionTitle}>— 인벤토리 —</Text>
            {sortedInventorySellAgg.map(item => {
              const rowItemDef = resolveItemDefById(item.goodId);
              const good = resolveTradeGoodById(item.goodId) ?? (
                rowItemDef
                  ? {
                      id: rowItemDef.id,
                      name: rowItemDef.name,
                      description: rowItemDef.description,
                      basePrice: rowItemDef.basePrice,
                      priceVariance: rowItemDef.priceVariance,
                      volume: rowItemDef.volume,
                      category: rowItemDef.category,
                    }
                  : null
              );
              if (!good) return null;
              const sellable = isSellableByTable(rowItemDef);
              const sellListing = market.find(m => m.goodId === item.goodId);
              const sellPrice = resolveInventorySellPrice(
                planet.id,
                item.goodId,
                good.basePrice,
                sellListing,
                item.buyPrice,
              );
              const profit = (sellPrice - item.buyPrice) * item.quantity;
              return (
                <TouchableOpacity
                  key={`sell-${item.goodId}`}
                  style={[styles.listingCard, !sellable && styles.listingDisabled]}
                  onPress={() => handleSell(item)}
                  disabled={!sellable}
                >
                  <View style={styles.listingLeft}>
                    <TradeListingIcon
                      goodId={item.goodId}
                      category={good.category}
                      buySubTab={inferTradeBuySubTabFromGoodId(item.goodId)}
                    />
                    <View style={styles.listingTextBlock}>
                      <Text style={styles.goodName}>{good.name}</Text>
                      <Text style={styles.goodDesc}>
                        평균 구매가: {formatCredits(item.buyPrice)} · 보유: {item.quantity}개
                      </Text>
                    </View>
                  </View>
                  <View style={styles.listingRight}>
                    <Text style={styles.goodPrice}>{sellable ? formatCredits(sellPrice) : '판매 불가'}</Text>
                    {!sellable ? <Text style={styles.unsellableBadge}>[판매불가]</Text> : null}
                    <Text style={[styles.goodDemand, { color: profit >= 0 ? COLORS.exp : COLORS.danger }]}>
                      {profit >= 0 ? '▲' : '▼'} {formatCredits(Math.abs(profit))}
                    </Text>
                    <Text style={styles.goodStock}>전량 판매</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
        <View style={{ height: TRADE_BOTTOM_STAGE_RESERVE_PX }} />
      </ScrollView>
      <StageLoadingOverlay visible={!stageFrameReady} overlayId="stage-loading-trade" />
      </View>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg_panel,
  },
  backBtn: { marginRight: SPACING.sm },
  headerTitleBlock: { flex: 1, minWidth: 0 },
  headerTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  headerMiningLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginTop: 2,
  },
  cargoText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
  },
  scroll: { flex: 1, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingDisabled: { opacity: 0.4 },
  listingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, rowGap: SPACING.sm, columnGap: SPACING.sm },
  listingTextBlock: { flex: 1, minWidth: 0 },
  listingRight: { alignItems: 'flex-end', minWidth: 90 },
  goodName: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  goodDesc: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginTop: 1,
  },
  goodPrice: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.gold,
  },
  goodDemand: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  goodStock: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_faint,
    marginTop: 1,
  },
  unsellableBadge: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.danger,
    marginTop: 2,
  },
  sellSectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  empty: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_light,
    textAlign: 'center',
    marginTop: 60,
  },
});
