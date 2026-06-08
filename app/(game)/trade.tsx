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
import { usePlayerStore } from '../../src/store/playerStore';
import { useWorldStore } from '../../src/store/worldStore';
import { useMissionStore } from '../../src/store/missionStore';
import { useItemLedgerStore } from '../../src/store/itemLedgerStore';
import { useClanWarFoundationStore } from '../../src/store/clanWarFoundationStore';
import { generateMarketByItemIds, getBuyPrice, getSellPrice } from '../../src/engine/TradeEngine';
import { TRADE_GOODS, getItemDef } from '../../src/data/goods';
import { ORBIT_MINING_REWARD_GOOD_ID } from '../../src/game/miningConfig';
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
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import { getPlanetTradePortItemIds } from '../../src/world/planetTradePortDb';
import { adjustPlanetTradeMarketStock } from '../../src/world/planetTradeMarketStore';
import { filterTradePortCatalogForPlayer } from '../../src/arcCore/balance/tradePortCatalogPolicy';
import {
  TRADE_BUY_SUB_TAB_LABELS,
  TRADE_BUY_SUB_TAB_ORDER,
  inferTradeBuySubTabFromGoodId,
  type TradeBuySubTabId,
} from '../../src/game/tradeBuySubTab';

const CATEGORY_ICONS: Record<string, string> = {
  food: '🌾', mineral: '⛏', tech: '⚙', weapon: '⚔', luxury: '💎', contraband: '🚫',
};

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
            filterTradePortCatalogForPlayer(
              getPlanetTradePortItemIds(planet.id),
              player.level,
            ),
            planet.id.length * 37,
            player.credits,
            planet.id,
          )
        : [],
    [planet?.id, player?.credits, player?.level, marketTick],
  );
  const inventorySellAgg = useMemo(() => {
    if (!player) return [];
    const normalizedSlots = normalizeInventorySlots(player.inventorySlots);
    const invAgg = aggregateInventoryForTrade(normalizedSlots);
    const map = new Map(invAgg.map((row) => [row.goodId, { ...row }]));
    // 채굴 보상(광물1)은 인벤 실수량을 기준으로 판매 리스트에 항상 반영한다.
    const miningRewardQty = countGoodInInventory(normalizedSlots, ORBIT_MINING_REWARD_GOOD_ID);
    if (miningRewardQty > 0) {
      const prev = map.get(ORBIT_MINING_REWARD_GOOD_ID);
      if (prev) prev.quantity = miningRewardQty;
      else {
        map.set(ORBIT_MINING_REWARD_GOOD_ID, {
          goodId: ORBIT_MINING_REWARD_GOOD_ID,
          quantity: miningRewardQty,
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
      const priceA = listingA ? getSellPrice(listingA) : Math.floor((goodA?.basePrice ?? 0) * 0.7);
      const priceB = listingB ? getSellPrice(listingB) : Math.floor((goodB?.basePrice ?? 0) * 0.7);
      return priceA - priceB;
    });
  }, [inventorySellAgg, market]);

  const tradePlanetIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!player || !planet) return;
    if (tradePlanetIdRef.current === planet.id) return;
    tradePlanetIdRef.current = planet.id;
    if (market.length === 0) return;
    const first = TRADE_BUY_SUB_TAB_ORDER.find(t =>
      market.some(m => inferTradeBuySubTabFromGoodId(m.goodId) === t),
    );
    if (first) setBuySubTab(first);
  }, [player, planet, market]);

  if (!player || !planet) return null;

  const tradePortOre1Total =
    player.orbitalMiningOre1DeliveredByPlanet[planet.id] ?? 0;
  const inventoryOre1Qty =
    countGoodInInventory(normalizeInventorySlots(player.inventorySlots), ORBIT_MINING_REWARD_GOOD_ID);

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
      ? Math.min(listing.stock, Math.floor(player.credits / price))
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

    showArcAlert(
      `${good.name} 구매`,
      `단가: ${price.toLocaleString()} cr\n최대 ${maxQty}개 구매 가능\n1개 구매하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '1개 구매',
          onPress: async () => {
            const ok = spendCredits(price);
            if (!ok) return;
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
                addCredits(price);
                showArcAlert('소유권 획득 실패', '이미 다른 클랜이 점유한 행성입니다.');
                return;
              }
              if (player.uid) {
                appendItemTxn({
                  uid: player.uid,
                  itemId: listing.goodId,
                  deltaQty: 1,
                  txnType: 'trade_buy',
                  unitPrice: price,
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
                addCredits(price);
                showArcAlert('클랜 해산 실패', '현재 해산 가능한 클랜이 없습니다.');
                return;
              }
              if (player.uid) {
                appendItemTxn({
                  uid: player.uid,
                  itemId: listing.goodId,
                  deltaQty: 1,
                  txnType: 'trade_buy',
                  unitPrice: price,
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
                addCredits(price);
                showArcAlert('인도 실패', '격납고 보유 한도(30대)에 도달했습니다.');
                return;
              }
              const npcCapitalShipId = typeof itemDef?.attrs?.npcCapitalShipId === 'string'
                ? String(itemDef.attrs.npcCapitalShipId)
                : '';
              if (!npcCapitalShipId) {
                addCredits(price);
                showArcAlert('인도 실패', '전함 데이터가 올바르지 않습니다.');
                return;
              }
              const hangarOk = addHangarShipFromNpcPurchase(npcCapitalShipId);
              if (!hangarOk) {
                addCredits(price);
                showArcAlert('인도 실패', '등록되지 않은 전함입니다.');
                return;
              }
              purchaseNote = `capital_ship_hangar:${npcCapitalShipId}`;
              capitalShipIdForRollback = npcCapitalShipId;
            }
            const slots0 = normalizeInventorySlots(player.inventorySlots);
            const invTry = addToInventorySlotsMax(slots0, listing.goodId, 1, price);
            const inventoryAdded = invTry.added > 0;
            const shouldAllowWithoutInventory = isCapitalShipItem;
            if (!inventoryAdded && !shouldAllowWithoutInventory) {
              if (capitalShipIdForRollback) {
                removeHangarShipByNpcId(capitalShipIdForRollback);
              }
              addCredits(price);
              showArcAlert('구매 실패', '인벤토리 공간이 부족합니다.');
              return;
            }
            if (inventoryAdded) {
              const latestPlayerAfterSideEffects = usePlayerStore.getState().player ?? player;
              setPlayer({ ...latestPlayerAfterSideEffects, inventorySlots: invTry.slots });
            }
            if (player.uid) {
              appendItemTxn({
                uid: player.uid,
                itemId: listing.goodId,
                deltaQty: 1,
                txnType: 'trade_buy',
                unitPrice: price,
                systemId: player.currentSystemId,
                planetId: player.currentPlanetId,
                note: purchaseNote,
              });
              await persistItemLedger();
            }

            const active = getActiveMission();
            if (active) {
              const invAfter = inventoryAdded ? invTry.slots : normalizeInventorySlots(player.inventorySlots);
              const owned = isCapitalShipItem
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
            if (itemDef?.type === 'trade_route' && player.currentPlanetId) {
              adjustPlanetTradeMarketStock(player.currentPlanetId, listing.goodId, -1);
              setMarketTick((t) => t + 1);
            }
            await persist();
          },
        },
      ],
    );
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

    const price = sellListing ? getSellPrice(sellListing) : Math.floor(good.basePrice * 0.7);

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

    showArcAlert(
      `${good.name} 판매 (인벤토리)`,
      `보유: ${item.quantity}개\n판매 가능: ${sellQty}개\n판매가: ${price.toLocaleString()} cr/개`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: `[${sellQty}]개 판매`,
          onPress: async () => {
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
            addCredits(price * sellQty);
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
                unitPrice: price,
                systemId: player.currentSystemId,
                planetId: player.currentPlanetId,
                note: 'inventory',
              });
              await persistItemLedger();
            }
            if (itemDef?.type === 'trade_route' && player.currentPlanetId) {
              adjustPlanetTradeMarketStock(player.currentPlanetId, item.goodId, sellQty);
              setMarketTick((t) => t + 1);
            }
            await persist();
          },
        },
      ],
    );
  };

  return (
    <StageShell routeName="trade" background="none" edges={['bottom']}>
      <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={safeBack} style={styles.backBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={styles.backText}>◀ 나가기</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>무역소</Text>
          {(tradePortOre1Total > 0 || inventoryOre1Qty > 0) && (
            <Text style={styles.headerMiningLine} numberOfLines={1}>
              광물1 무역소 누적 입고 {tradePortOre1Total.toLocaleString()} · 인벤 보유 {inventoryOre1Qty.toLocaleString()}
            </Text>
          )}
        </View>
        <Text style={styles.cargoText}>인벤 슬롯 {inventorySellAgg.length}</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'buy' && styles.tabActive]} onPress={() => setTab('buy')}>
          <Text style={[styles.tabText, tab === 'buy' && styles.tabTextActive]}>[ 구매 ]</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'sell' && styles.tabActive]} onPress={() => setTab('sell')}>
          <Text style={[styles.tabText, tab === 'sell' && styles.tabTextActive]}>
            [ 판매 ]{' '}
            {inventorySellAgg.length > 0 && `(${inventorySellAgg.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'buy' ? (
          market.length === 0 ? (
            <Text style={styles.empty}>거래 가능한 상품이 없습니다.</Text>
          ) : (
            <>
              <View style={styles.subTabsWrap}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subTabsRow}
                >
                  {TRADE_BUY_SUB_TAB_ORDER.map(id => (
                    <TouchableOpacity
                      key={id}
                      style={[styles.subTab, buySubTab === id && styles.subTabActive]}
                      onPress={() => setBuySubTab(id)}
                      accessibilityLabel={`구매 구분 ${TRADE_BUY_SUB_TAB_LABELS[id]}`}
                    >
                      <Text style={[styles.subTabText, buySubTab === id && styles.subTabTextActive]}>
                        [{TRADE_BUY_SUB_TAB_LABELS[id]}]
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
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
                    <Text style={styles.goodIcon}>{CATEGORY_ICONS[good.category] ?? '📦'}</Text>
                    <View>
                      <Text style={styles.goodName}>{good.name}</Text>
                      <Text style={styles.goodDesc} numberOfLines={1}>{good.description}</Text>
                    </View>
                  </View>
                  <View style={styles.listingRight}>
                    <Text style={styles.goodPrice}>{price.toLocaleString()} cr</Text>
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
              const sellPrice = sellListing ? getSellPrice(sellListing) : Math.floor(good.basePrice * 0.7);
              const profit = (sellPrice - item.buyPrice) * item.quantity;
              return (
                <TouchableOpacity
                  key={`sell-${item.goodId}`}
                  style={[styles.listingCard, !sellable && styles.listingDisabled]}
                  onPress={() => handleSell(item)}
                  disabled={!sellable}
                >
                  <View style={styles.listingLeft}>
                    <Text style={styles.goodIcon}>{CATEGORY_ICONS[good.category] ?? '📦'}</Text>
                    <View>
                      <Text style={styles.goodName}>{good.name}</Text>
                      <Text style={styles.goodDesc}>
                        평균 구매가: {item.buyPrice.toLocaleString()} cr · 보유: {item.quantity}개
                      </Text>
                    </View>
                  </View>
                  <View style={styles.listingRight}>
                    <Text style={styles.goodPrice}>{sellable ? `${sellPrice.toLocaleString()} cr` : '판매 불가'}</Text>
                    {!sellable ? <Text style={styles.unsellableBadge}>[판매불가]</Text> : null}
                    <Text style={[styles.goodDemand, { color: profit >= 0 ? COLORS.exp : COLORS.danger }]}>
                      {profit >= 0 ? '▲' : '▼'} {Math.abs(profit).toLocaleString()}
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
      <StageLoadingOverlay visible={!stageFrameReady} />
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
  backBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, marginRight: SPACING.sm },
  backText: { fontFamily: FONTS.mono, fontSize: FONTS.size.md, color: COLORS.ink_mid },
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg_secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.ink_dark,
    backgroundColor: COLORS.bg_panel,
  },
  tabText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_light,
  },
  tabTextActive: {
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
  },
  subTabsWrap: {
    marginBottom: SPACING.sm,
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg_secondary,
  },
  subTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    columnGap: SPACING.xs,
  },
  subTab: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg_panel,
  },
  subTabActive: {
    borderColor: COLORS.ink_dark,
    backgroundColor: COLORS.bg_panel,
  },
  subTabText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
  },
  subTabTextActive: {
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
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
  listingRight: { alignItems: 'flex-end', minWidth: 90 },
  goodIcon: { fontSize: 24 },
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
