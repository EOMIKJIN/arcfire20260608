// ============================================================
// 아크파이어 온라인 - 무역소 화면
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { FONTS, SPACING } from '../../src/utils/theme';
import { TACTICAL_FACILITY as TF } from '../../src/ui/tactical/tacticalFacilityScreenTokens';
import { useT, t as tStatic } from '../../src/i18n';
import {
  resolveItemDescription,
  resolveItemName,
} from '../../src/i18n/itemText';
import { useAppSettingsStore } from '../../src/store/appSettingsStore';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { presentArcOverlayTradeQuantity } from '../../src/ui/overlay/presentArcTradeQuantity';
import { listTradeResellProfitTips } from '../../src/game/tradeProfitTips';
import { formatCredits } from '../../src/utils/formatCredits';
import { usePlayerStore } from '../../src/store/playerStore';
import { useWorldStore } from '../../src/store/worldStore';
import { useMissionStore } from '../../src/store/missionStore';
import { listActiveMissionBundles } from '../../src/missions/missionActiveBundles';
import {
  applyQuestMarketListingOverrides,
  mergeQuestTradePortItemIds,
} from '../../src/missions/questItemOpsRegistry';
import { useItemLedgerStore } from '../../src/store/itemLedgerStore';
import { useClanWarFoundationStore } from '../../src/store/clanWarFoundationStore';
import { generateMarketByItemIds, getBuyPrice, getSellPrice } from '../../src/engine/TradeEngine';
import { TRADE_GOODS, getItemDef } from '../../src/data/goods';
import {
  applyPlanetTradeTransactionFee,
  reversePlanetTradeTransactionFee,
} from '../../src/arcCore/economy/applyPlanetTradeTransactionFee';
import { recordPlanetEconomyPlayerTrade } from '../../src/arcCore/economy/planetEconomyFabric';
import {
  listArcCoreGalacticMineralItemIds,
  resolveMineralCatalogSellPrice,
} from '../../src/arcCore/economy/mineralTradePricing';
import {
  addToInventorySlotsMax,
  aggregateInventoryForTrade,
  countGoodInInventory,
  maxAddableToInventory,
  normalizeInventorySlots,
  removeGoodFromInventorySlots,
} from '../../src/game/playerInventory';
import { MarketListing, CargoItem, ItemDef, Player, MissionProgress } from '../../src/types';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import { usePlanetSubStageMemory } from '../../src/hooks/usePlanetSubStageMemory';
import { usePlanetHubFacilityAccessGate } from '../../src/hooks/usePlanetHubFacilityAccessGate';
import {
  computeTradeFeeForPlanetGross,
} from '../../src/game/planetDevelopment/planetTradePortRuntimeBridge';
import { useLocaleRenderKey } from '../../src/hooks/useLocaleRenderKey';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { PlanetFacilityTabBar } from '../../src/ui/planetFacility/PlanetFacilityTabBar';
import {
  PlanetFacilityListingTextBlock,
  PlanetFacilityTitleHeader,
  planetFacilityScreenStyles as fs,
} from '../../src/ui/planetFacility/PlanetFacilityTitleHeader';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import { getPlanetTradePortItemIds } from '../../src/world/planetTradePortDb';
import { adjustPlanetTradeMarketStock } from '../../src/world/planetTradeMarketStore';
import { resolveTradeRoutePlayerSellUnit } from '../../src/arcCore/economy/tradeRouteCommercePolicy';
import { resolveTradeMineralSinkTotalQty } from '../../src/arcCore/economy/tradeMineralSinkPolicy';
import {
  filterTradePortCatalogForBuyMarket,
  filterTradePortCatalogForPlayer,
} from '../../src/arcCore/balance/tradePortCatalogPolicy';
import { isSurvivalPodCapitalShipItemId, isSurvivalPodNpcShipId } from '../../src/game/playerSurvivalPod';
import { resolvePlayerLifetimeCredits } from '../../src/game/resolvePlayerLifetimeCredits';
import {
  TRADE_BUY_SUB_TAB_ORDER,
  inferTradeBuySubTabFromGoodId,
  type TradeBuySubTabId,
} from '../../src/game/tradeBuySubTab';
import { TradeListingIcon } from '../../src/ui/trade/TradeListingIcon';
import { resolveTradePortPurchaseDescription } from '../../src/game/tradePortPurchaseDescription';
import {
  formatShipEquipmentListingSuffix,
  formatShipEquipmentStatSummary,
} from '../../src/game/shipEquipment';
import {
  isPlanetTradeShipTabEnabled,
  PLANET_DEV_MODULE_ORBIT_SHIPYARD,
} from '../../src/game/planetDevelopment/planetOrbitShipyardDevelopment';
import { usePlanetCoreRuntimeStore } from '../../src/store/planetCoreRuntimeStore';
import {
  createTradeScreenSession,
  HeavyUiStageErrorPanel,
  useHeavyUiDataSession,
} from '../../src/ui/heavyUiDataSession';

const DEMAND_LABEL_KEYS: Record<string, string> = {
  low: 'trade.demand.low', normal: 'trade.demand.normal', high: 'trade.demand.high',
};
function demandLabel(demand: string): string {
  return tStatic(DEMAND_LABEL_KEYS[demand] ?? 'trade.demand.normal');
}

const DEMAND_COLORS: Record<string, string> = {
  low: TF.mutedInk,
  normal: TF.midInk,
  high: TF.danger,
};
/** 메인스테이지 기준 하단 공백과 동기 */
const TRADE_BOTTOM_STAGE_RESERVE_PX = PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX;

const arcTradeDialogButtons = () => [
  { text: tStatic('trade.btn.cancel'), style: 'cancel' as const },
  { text: tStatic('trade.btn.confirm') },
];

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

type TradeBuyBlock = { title: string; message: string };

function resolveTradePortListedItemIds(
  planetId: string,
  playerLevel: number,
  progresses: Record<string, MissionProgress>,
): string[] {
  const base = filterTradePortCatalogForBuyMarket(getPlanetTradePortItemIds(planetId), playerLevel);
  return mergeQuestTradePortItemIds(planetId, base, progresses);
}

function resolveTradeBuyBlock(input: {
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

function refundTradeMineralSink(
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

function rollbackTradeBuyFailure(input: {
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

function resolveFreshTradeBuyUnitPrice(
  listing: MarketListing,
  planetId: string,
  player: Player,
): number {
  const freshListing = generateMarketByItemIds(
    resolveTradePortListedItemIds(planetId, player.level, useMissionStore.getState().progresses),
    planetId.length * 37,
    resolvePlayerLifetimeCredits(player),
    planetId,
  ).find((m) => m.goodId === listing.goodId);
  return getBuyPrice(freshListing ?? listing);
}

/** 수량 선택 UI 상한 — 진열 재고 기준(0이면 1). 구매 가능 여부는 구매 버튼에서 검증 */
function resolveTradeBuyPickerMaxQty(listing: MarketListing): number {
  return Math.max(1, listing.stock);
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
  const t = useT();
  const localeRenderKey = useLocaleRenderKey();
  const locale = useAppSettingsStore((s) => s.locale);
  const player = usePlayerStore(s => s.player);
  const spendCredits = usePlayerStore(s => s.spendCredits);
  const addCredits = usePlayerStore(s => s.addCredits);
  const addHangarShipFromNpcPurchase = usePlayerStore(s => s.addHangarShipFromNpcPurchase);
  const removeHangarShipByNpcId = usePlayerStore(s => s.removeHangarShipByNpcId);
  const persist = usePlayerStore(s => s.persist);
  const setPlayer = usePlayerStore(s => s.setPlayer);
  const getSystem = useWorldStore(s => s.getSystem);
  const completeObjective = useMissionStore(s => s.completeObjective);
  const missionProgresses = useMissionStore(s => s.progresses);
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
  usePlanetHubFacilityAccessGate('trade');

  const system = player ? getSystem(player.currentSystemId) : undefined;
  const planet = system?.planets.find(p => p.id === player?.currentPlanetId) ?? system?.planets[0];

  const tradeSessionConfig = useMemo(
    () => (planet?.id ? createTradeScreenSession(planet.id) : null),
    [planet?.id],
  );
  const tradeSession = useHeavyUiDataSession(tradeSessionConfig, marketTick);
  const screenReady = tradeSession.phase === 'ready' && stageFrameReady;

  const shipyardCatalogRev = usePlanetCoreRuntimeStore(
    useCallback((s) => {
      const pid = planet?.id;
      if (!pid) return '';
      const dev = s.byPlanetId[pid]?.detail?.development?.byModuleId?.[PLANET_DEV_MODULE_ORBIT_SHIPYARD];
      return JSON.stringify(dev ?? null);
    }, [planet?.id]),
  );

  const tradePortDevRev = usePlanetCoreRuntimeStore(
    useCallback((s) => {
      const pid = planet?.id;
      if (!pid) return '';
      const dev = s.byPlanetId[pid]?.detail?.development?.byModuleId?.dev_trade_port;
      return JSON.stringify(dev ?? null);
    }, [planet?.id]),
  );

  const market = useMemo(
    () => {
      if (!planet || !player) return [];
      const base = generateMarketByItemIds(
        resolveTradePortListedItemIds(planet.id, player.level, missionProgresses),
        planet.id.length * 37,
        resolvePlayerLifetimeCredits(player),
        planet.id,
      );
      return applyQuestMarketListingOverrides(base, planet.id, missionProgresses);
    },
    [planet?.id, player?.level, player?.lifetimeCreditsEarned, player?.credits, marketTick, shipyardCatalogRev, tradePortDevRev, missionProgresses],
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
      { id: 'buy', label: t('trade.tab.buy') },
      {
        id: 'sell',
        label: inventorySellAgg.length > 0 ? t('trade.tab.sellCount', { n: inventorySellAgg.length }) : t('trade.tab.sell'),
      },
    ],
    [inventorySellAgg.length, t],
  );

  const tradeBuyCategoryTabs = useMemo(() => {
    const shipEnabled = planet?.id ? isPlanetTradeShipTabEnabled(planet.id) : true;
    return TRADE_BUY_SUB_TAB_ORDER
      .filter((id) => (id === 'ship' ? shipEnabled : true))
      .map((id) => ({ id, label: t(`trade.subTab.${id}`) }));
  }, [planet?.id, t]);

  useEffect(() => {
    if (!planet?.id) return;
    if (!isPlanetTradeShipTabEnabled(planet.id) && buySubTab === 'ship') {
      setBuySubTab('weapon');
    }
  }, [planet?.id, buySubTab]);

  const tradePlanetIdRef = useRef<string | undefined>(undefined);

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
    const price = getBuyPrice(listing);
    const playerCredits = player.credits;

    presentArcOverlayTradeQuantity({
      mode: 'buy',
      title: resolveItemName(itemDef ?? good, locale),
      unitPrice: price,
      maxQty: resolveTradeBuyPickerMaxQty(listing),
      playerCredits,
      itemDescription: resolveTradePortPurchaseDescription(itemDef, locale) ?? undefined,
      stock: listing.stock,
      demandLabel: demandLabel(listing.demand),
      tips: listTradeResellProfitTips(
        planet.id,
        listing.goodId,
        price,
        resolvePlayerLifetimeCredits(player),
      ),
      onConfirm: (qty) => {
        const buyQty = Math.max(1, Math.floor(qty));
        const latestPlayer = usePlayerStore.getState().player;
        if (!latestPlayer || !planet) return;
        const freshUnitPrice = resolveFreshTradeBuyUnitPrice(listing, planet.id, latestPlayer);
        if (freshUnitPrice !== price) {
          setMarketTick((tick) => tick + 1);
          showArcAlert(
            t('trade.buy.priceChangedTitle'),
            t('trade.buy.priceChangedMsg'),
            arcTradeDialogButtons(),
          );
          return;
        }
        const block = resolveTradeBuyBlock({
          listing,
          qty: buyQty,
          itemDef,
          player: latestPlayer,
          unitPrice: freshUnitPrice,
          hasEverPurchasedItem,
          planetId: planet.id,
        });
        if (block) {
          showArcAlert(block.title, block.message, arcTradeDialogButtons());
          return;
        }
        const capitalShipNpcId = itemDef?.type === 'capital_ship'
          && typeof itemDef?.attrs?.npcCapitalShipId === 'string'
          ? String(itemDef.attrs.npcCapitalShipId)
          : null;
        showArcAlert(t('trade.buy.confirmAsk'), undefined, [
          { text: t('trade.btn.cancel'), style: 'cancel' },
          {
            text: t('trade.btn.confirm'),
            onPress: () => executeBuyQuantity(listing, buyQty, itemDef, freshUnitPrice, capitalShipNpcId),
          },
        ]);
      },
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
    const gross = unitPrice * qty;
    const feeBreakdown = computeTradeFeeForPlanetGross(planet.id, gross);
    const totalCharged = gross + feeBreakdown.totalFee;
    const ok = spendCredits(totalCharged);
    if (!ok) {
      showArcAlert(t('trade.buy.notEnough'), undefined, arcTradeDialogButtons());
      return;
    }
    applyPlanetTradeTransactionFee(player.currentPlanetId ?? planet.id, gross);

    const mineralSink = resolveTradeMineralSinkTotalQty(itemDef, qty);
    if (mineralSink) {
      const slotsBefore = normalizeInventorySlots(player.inventorySlots);
      const slotsAfter = removeGoodFromInventorySlots(
        slotsBefore,
        mineralSink.mineralItemId,
        mineralSink.totalQty,
      );
      if (!slotsAfter) {
        rollbackTradeBuyFailure({
          itemDef,
          buyQty: qty,
          totalCharged,
          planetId: player.currentPlanetId,
          grossCredits: gross,
        });
        showArcAlert(t('trade.buy.failTitle'), t('trade.buy.mineralShort'), arcTradeDialogButtons());
        return;
      }
      setPlayer({ ...player, inventorySlots: slotsAfter });
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
        rollbackTradeBuyFailure({
          itemDef,
          buyQty: qty,
          totalCharged,
          planetId: player.currentPlanetId,
          grossCredits: gross,
        });
        showArcAlert(t('trade.own.claimFailTitle'), t('trade.own.claimFailMsg'));
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
          note: `planet_holds:${ownershipPlanetId}`,
        });
        await persistItemLedger();
      }
      await persist();
      showArcAlert(t('trade.own.claimDoneTitle'), t('trade.own.claimDoneMsg', { planet: planet.name }));
      return;
    }
    if (isClanDisbandItem) {
      const dissolve = dissolvePlayerClanByPurchase({ uid: player.uid });
      if (!dissolve.ok) {
        rollbackTradeBuyFailure({
          itemDef,
          buyQty: qty,
          totalCharged,
          planetId: player.currentPlanetId,
          grossCredits: gross,
        });
        showArcAlert(t('trade.clan.disbandFailTitle'), t('trade.clan.disbandFailMsg'));
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
      showArcAlert(t('trade.clan.disbandDoneTitle'), t('trade.clan.disbandDoneMsg', { count: dissolve.releasedPlanetCount ?? 0 }));
      return;
    }
    if (isCapitalShipItem) {
      if (player.shipHangar.length >= 30) {
        rollbackTradeBuyFailure({
          itemDef,
          buyQty: qty,
          totalCharged,
          planetId: player.currentPlanetId,
          grossCredits: gross,
        });
        showArcAlert(t('trade.ship.deliverFailTitle'), t('trade.ship.hangarLimit'));
        return;
      }
      const npcCapitalShipId = typeof itemDef?.attrs?.npcCapitalShipId === 'string'
        ? String(itemDef.attrs.npcCapitalShipId)
        : '';
      if (!npcCapitalShipId) {
        rollbackTradeBuyFailure({
          itemDef,
          buyQty: qty,
          totalCharged,
          planetId: player.currentPlanetId,
          grossCredits: gross,
        });
        showArcAlert(t('trade.ship.deliverFailTitle'), t('trade.ship.badData'));
        return;
      }
      const hangarOk = addHangarShipFromNpcPurchase(npcCapitalShipId);
      if (!hangarOk) {
        rollbackTradeBuyFailure({
          itemDef,
          buyQty: qty,
          totalCharged,
          planetId: player.currentPlanetId,
          grossCredits: gross,
        });
        showArcAlert(t('trade.ship.deliverFailTitle'), t('trade.ship.unregistered'));
        return;
      }
      purchaseNote = `capital_ship_hangar:${npcCapitalShipId}`;
      capitalShipIdForRollback = npcCapitalShipId;
    }

    const slots0 = normalizeInventorySlots(
      (usePlayerStore.getState().player ?? player).inventorySlots,
    );
    const invTry = addToInventorySlotsMax(slots0, listing.goodId, qty, unitPrice);
    const inventoryAdded = invTry.added > 0;
    const shouldAllowWithoutInventory = isCapitalShipItem;
    if (!inventoryAdded && !shouldAllowWithoutInventory) {
      rollbackTradeBuyFailure({
        itemDef,
        buyQty: qty,
        totalCharged,
        planetId: player.currentPlanetId,
        grossCredits: gross,
        capitalShipNpcId: capitalShipIdForRollback,
      });
      showArcAlert(t('trade.buy.failTitle'), t('trade.buy.invShort'));
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

    const activeBundles = listActiveMissionBundles(useMissionStore.getState().progresses);
    for (const active of activeBundles) {
      const invAfter = inventoryAdded ? invTry.slots : normalizeInventorySlots(player.inventorySlots);
      const owned = isCapitalShipItem && capitalShipNpcId
        ? player.shipHangar.filter((h) => h.npcCapitalShipId === capitalShipNpcId).length
        : countGoodInInventory(invAfter, listing.goodId);
      active.mission.objectives.forEach((obj) => {
        if (obj.type === 'buy_goods' && obj.targetId === listing.goodId) {
          if (!obj.quantity || owned >= obj.quantity) {
            completeObjective(active.mission.id, obj.id);
          }
        }
      });
    }
    if (itemDef?.type === 'trade_route' && player.currentPlanetId && inventoryAdded) {
      adjustPlanetTradeMarketStock(player.currentPlanetId, listing.goodId, -invTry.added);
      setMarketTick((tick) => tick + 1);
    }
    const fabricPlanetId = player.currentPlanetId ?? planet.id;
    const fabricQty = inventoryAdded ? invTry.added : qty;
    recordPlanetEconomyPlayerTrade(fabricPlanetId, 'buy', fabricQty, gross);
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
      showArcAlert(t('trade.sell.failTitle'), t('trade.sell.noHangarShip'));
      return;
    }

    presentArcOverlayTradeQuantity({
      mode: 'sell',
      title: resolveItemName(itemDef ?? good, locale),
      unitPrice: price,
      maxQty: sellQty,
      ownedQty: item.quantity,
      onConfirm: (qty) => {
        const qtyToSell = Math.max(1, Math.floor(qty));
        if (!isSellableByTable(itemDef)) {
          showArcAlert(t('trade.sell.notResellable'), undefined, arcTradeDialogButtons());
          return;
        }
        if (itemDef?.type === 'capital_ship') {
          const targetNpcId = typeof itemDef.attrs?.npcCapitalShipId === 'string'
            ? String(itemDef.attrs.npcCapitalShipId)
            : null;
          if (isSurvivalPodCapitalShipItemId(item.goodId) || isSurvivalPodNpcShipId(targetNpcId)) {
            showArcAlert(t('trade.sell.podNotSellable'), undefined, arcTradeDialogButtons());
            return;
          }
          const currentShipNpcId = player.ship.portraitNpcCapitalShipId ?? null;
          if (currentShipNpcId && targetNpcId && currentShipNpcId === targetNpcId) {
            showArcAlert(
              t('trade.sell.currentShip'),
              undefined,
              arcTradeDialogButtons(),
            );
            return;
          }
          const npcCapitalShipId = typeof itemDef.attrs?.npcCapitalShipId === 'string'
            ? String(itemDef.attrs.npcCapitalShipId)
            : '';
          const ownedCount = npcCapitalShipId
            ? (usePlayerStore.getState().player ?? player).shipHangar
              .filter((h) => h.npcCapitalShipId === npcCapitalShipId).length
            : 0;
          if (ownedCount < qtyToSell) {
            showArcAlert(t('trade.sell.noHangarShip'), undefined, arcTradeDialogButtons());
            return;
          }
        } else if (qtyToSell > item.quantity) {
          showArcAlert(t('trade.sell.invQtyUnknown'), undefined, arcTradeDialogButtons());
          return;
        }
        showArcAlert(t('trade.sell.confirmAsk'), undefined, [
          { text: t('trade.btn.cancel'), style: 'cancel' },
          {
            text: t('trade.btn.confirm'),
            onPress: () => executeSellQuantity(item, qtyToSell, itemDef, price),
          },
        ]);
      },
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
        showArcAlert(t('trade.sell.shipBadData'), undefined, arcTradeDialogButtons());
        return;
      }
      const ownedCount = workingPlayer.shipHangar.filter((h) => h.npcCapitalShipId === npcCapitalShipId).length;
      if (ownedCount < sellQty) {
        showArcAlert(t('trade.sell.noHangarShip'), undefined, arcTradeDialogButtons());
        return;
      }
      for (let i = 0; i < sellQty; i += 1) {
        removeHangarShipByNpcId(npcCapitalShipId);
      }
      workingPlayer = usePlayerStore.getState().player ?? workingPlayer;
    }
    const sellGross = unitPrice * sellQty;
    const sellFee = computeTradeFeeForPlanetGross(planet.id, sellGross);
    applyPlanetTradeTransactionFee(player.currentPlanetId ?? planet.id, sellGross);
    addCredits(sellGross - sellFee.totalFee);
    const next = removeGoodFromInventorySlots(
      normalizeInventorySlots(workingPlayer.inventorySlots),
      item.goodId,
      sellQty,
    );
    if (!next) {
      showArcAlert(t('trade.sell.invQtyUnknown'), undefined, arcTradeDialogButtons());
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
      setMarketTick((tick) => tick + 1);
    }
    recordPlanetEconomyPlayerTrade(
      player.currentPlanetId ?? planet.id,
      'sell',
      sellQty,
      sellGross,
    );
    await persist();
  };

  return (
    <StageShell key={localeRenderKey} routeName="trade" background="none" edges={['bottom']} safeAreaBackgroundColor={TF.headerBg}>
      <View style={fs.root}>
      <PlanetFacilityTitleHeader
        title={t('trade.title')}
        subtitle={
          (tradePortMiningTotal > 0 || inventoryMiningQty > 0)
            ? t('trade.header.mining', { delivered: tradePortMiningTotal.toLocaleString(), inv: inventoryMiningQty.toLocaleString() })
            : undefined
        }
        onBack={safeBack}
        backLabel="◀ 나가기"
        trailing={(
          <Text style={fs.headerTrailingInk}>
            {t('trade.header.invSlots', { n: inventorySellAgg.length })}
          </Text>
        )}
      />

      <View style={fs.bodyPanel}>
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

      <ScrollView style={fs.scroll} contentContainerStyle={fs.scrollContent} showsVerticalScrollIndicator>
        {tab === 'buy' ? (
          market.length === 0 ? (
            <Text style={fs.empty}>{t('trade.empty.noGoods')}</Text>
          ) : (
            <>
              {filteredBuyMarket.length === 0 ? (
                <Text style={fs.empty}>{t('trade.empty.noSubGoods')}</Text>
              ) : null}
              {filteredBuyMarket.map(listing => {
              const good = resolveTradeGoodById(listing.goodId);
              if (!good) return null;
              const rowItemDef = resolveItemDefById(listing.goodId);
              const price = getBuyPrice(listing);
              const equipPendingSuffix = rowItemDef
                ? formatShipEquipmentListingSuffix(rowItemDef, ` ${t('equipment.effectPendingSuffix')}`)
                : '';
              const equipStatSummary = rowItemDef
                ? formatShipEquipmentStatSummary(rowItemDef, locale === 'en' ? 'en' : 'ko')
                : null;

              return (
                <TouchableOpacity
                  key={listing.goodId}
                  style={fs.listingCard}
                  onPress={() => handleBuy(listing)}
                >
                  <View style={fs.listingLeft}>
                    <TradeListingIcon
                      goodId={listing.goodId}
                      category={good.category}
                      buySubTab={buySubTab}
                    />
                    <PlanetFacilityListingTextBlock
                      title={`${resolveItemName(rowItemDef ?? good, locale)}${equipPendingSuffix}`}
                      description={equipStatSummary ?? resolveItemDescription(rowItemDef ?? good, locale)}
                    />
                  </View>
                  <View style={fs.listingRight}>
                    <Text style={fs.itemPrice}>{formatCredits(price)}</Text>
                    <Text style={[fs.itemMeta, { color: DEMAND_COLORS[listing.demand] }]}>
                      {t('trade.row.demand', { label: demandLabel(listing.demand) })}
                    </Text>
                    <Text style={fs.itemMeta}>{t('trade.row.stock', { n: listing.stock })}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            </>
          )
        ) : inventorySellAgg.length === 0 ? (
          <Text style={fs.empty}>{t('trade.empty.inventory')}</Text>
        ) : (
          <>
            <Text style={fs.sectionBar}>{t('trade.sell.section')}</Text>
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
                  style={fs.listingCard}
                  onPress={() => handleSell(item)}
                >
                  <View style={fs.listingLeft}>
                    <TradeListingIcon
                      goodId={item.goodId}
                      category={good.category}
                      buySubTab={inferTradeBuySubTabFromGoodId(item.goodId)}
                    />
                    <PlanetFacilityListingTextBlock
                      title={resolveItemName(rowItemDef ?? good, locale)}
                      description={t('trade.row.sellMeta', {
                        price: formatCredits(item.buyPrice),
                        qty: item.quantity,
                      })}
                      descriptionLines={0}
                    />
                  </View>
                  <View style={fs.listingRight}>
                    <Text style={fs.itemPrice}>{sellable ? formatCredits(sellPrice) : t('trade.row.unsellable')}</Text>
                    {!sellable ? <Text style={styles.unsellableBadge}>{t('trade.row.unsellableBadge')}</Text> : null}
                    <Text style={[fs.itemMeta, { color: profit >= 0 ? TF.safeInk : TF.danger }]}>
                      {profit >= 0 ? '▲' : '▼'} {formatCredits(Math.abs(profit))}
                    </Text>
                    <Text style={fs.itemMeta}>{t('trade.row.sellAll')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
        <View style={{ height: TRADE_BOTTOM_STAGE_RESERVE_PX }} />
      </ScrollView>
      <StageLoadingOverlay visible={!screenReady && tradeSession.phase !== 'error'} overlayId="stage-loading-trade" />
      {tradeSession.phase === 'error' ? (
        <HeavyUiStageErrorPanel
          preflightCode={tradeSession.preflightCode}
          error={tradeSession.error}
          facilityKind="trade"
          onRetry={tradeSession.retry}
          onBack={safeBack}
        />
      ) : null}
      </View>
      </View>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  unsellableBadge: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.danger,
    marginTop: 2,
  },
});
