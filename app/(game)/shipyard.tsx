// ============================================================
// 아크파이어 온라인 - 조선소 화면
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image,
} from 'react-native';
import { FONTS, SPACING } from '../../src/utils/theme';
import { TACTICAL_FACILITY as TF } from '../../src/ui/tactical/tacticalFacilityScreenTokens';
import { useT, t as tStatic, intlTag } from '../../src/i18n';
import { useAppSettingsStore } from '../../src/store/appSettingsStore';
import { resolveNpcCapitalShipDisplayName, resolveShipTemplateDescription } from '../../src/i18n/shipText';
import { resolveItemName } from '../../src/i18n/itemText';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { formatCredits } from '../../src/utils/formatCredits';
import { ShipGridPlaceholder } from '../../src/components/ShipGridPlaceholder';
import { usePlayerStore } from '../../src/store/playerStore';
import { SHIP_TEMPLATES } from '../../src/data/ships';
import {
  CAPITAL_WEAPON_LIST_FROM_CSV,
  NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV,
} from '../../src/data/generated';
import { getNpcCapitalShip } from '../../src/npc/npcFleetRegistry';
import { resolveNpcCapitalShipPortraitSource } from '../../src/game/npcCapitalShipPortraitAssets';
import { applyNpcCapitalShipToPlayerShip } from '../../src/game/applyNpcCapitalShipPurchase';
import { isSurvivalPodNpcShipId } from '../../src/game/playerSurvivalPod';
import { buildWeaponDataFromCapitalRow } from '../../src/game/capitalWeaponRange';
import { resolveEquipSlotDisplayName } from '../../src/game/equipSlotDisplayName';
import { PLAYER_INVENTORY_SLOT_COUNT } from '../../src/game/playerInventory';
import { computeCapitalWeaponDps } from '../../src/game/capitalWeaponRegistry';
import {
  COMBAT_WEAPON_SLOT_IDS,
  isCombatWeaponEquipSlot,
  isEquipSlotFilled,
  isShipyardEquipSlotLockedByCapacity,
  resolveCombatWeaponSlotForWeaponId,
  UNEQUIPPED_WEAPON_ITEM_ID,
} from '../../src/game/combatWeaponSlots';
import { SHIPYARD_EQUIP_SLOT_DEFS } from '../../src/game/shipyardEquipSlots';
import { TRADE_GOODS } from '../../src/data/goods';
import type {
  Player,
  PlayerShip,
  ShipyardEquipSlotId,
} from '../../src/types';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import {
  createShipyardScreenSession,
  HeavyUiStageErrorPanel,
  useHeavyUiDataSession,
} from '../../src/ui/heavyUiDataSession';
import { usePlanetSubStageMemory } from '../../src/hooks/usePlanetSubStageMemory';
import { usePlanetHubFacilityAccessGate } from '../../src/hooks/usePlanetHubFacilityAccessGate';
import { useLocaleRenderKey } from '../../src/hooks/useLocaleRenderKey';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { PlanetFacilityTabBar } from '../../src/ui/planetFacility/PlanetFacilityTabBar';
import {
  PlanetFacilityCardTitleBlock,
  PlanetFacilityTitleHeader,
  planetFacilityScreenStyles as fs,
} from '../../src/ui/planetFacility/PlanetFacilityTitleHeader';
import { ArcOverlayInfoRow } from '../../src/ui/overlay/ArcOverlayInfoRow';
import { ArcButton } from '../../src/ui/overlay/ArcButton';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import {
  resolveCapitalShipClassification,
  formatCapitalShipIdentityBlock,
} from '../../src/arcCore/balance/capitalShipClassification';
import { resolveShipFinalStatResult } from '../../src/ship/shipStatPipeline';
import { ShipyardMineralUpgradeTab } from '../../src/components/shipyard/ShipyardMineralUpgradeTab';
import { TradeListingEmptySlot, TradeListingIcon } from '../../src/ui/trade/TradeListingIcon';
import { normalizePlayerCombatProficiency } from '../../src/combat/playerCombatProficiency';
import {
  normalizeInventorySlots,
} from '../../src/game/playerInventory';
import {
  isWeaponItemId,
  resolveWeaponItemDef,
  weaponIdFromWeaponItemId,
} from '../../src/game/weaponItemBridge';
import {
  formatInventoryDurabilityMeta,
  resolveCapitalShipRepairCost,
  resolveDurabilityPct,
  resolveHangarShipDurabilityPct,
  resolvePlayerShipDurabilityPct,
  syncCurrentShipDurabilityToHangar,
} from '../../src/game/durability';
import {
  isShipEquipmentItemId,
  resolveShipEquipmentSlotForItemDef,
  formatShipEquipmentListingSuffix,
} from '../../src/game/shipEquipment';
/** 메인스테이지 기준 하단 공백과 동기 */
const SHIPYARD_BOTTOM_STAGE_RESERVE_PX = PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX;
function weaponIdFromSlotItemDef(itemDefId: string | null | undefined): string {
  const raw = String(itemDefId ?? '').trim();
  if (!raw || raw === UNEQUIPPED_WEAPON_ITEM_ID) return '';
  return raw.replace(/^weapon_item_/, '').trim();
}

function sumEquippedWeaponTableDamage(
  equipSlots: PlayerShip['equipSlots'] | undefined,
): number {
  let sum = 0;
  for (const slotId of COMBAT_WEAPON_SLOT_IDS) {
    const weaponId = weaponIdFromSlotItemDef(equipSlots?.[slotId]?.itemDefId);
    if (!weaponId) continue;
    const damage = CAPITAL_WEAPON_LIST_FROM_CSV[weaponId]?.damage;
    if (typeof damage === 'number' && Number.isFinite(damage)) sum += damage;
  }
  return sum;
}

export default function ShipyardScreen() {
  const t = useT();
  const localeRenderKey = useLocaleRenderKey();
  const locale = useAppSettingsStore((s) => s.locale);
  const player = usePlayerStore(s => s.player);
  const updateShip = usePlayerStore(s => s.updateShip);
  const setPlayer = usePlayerStore(s => s.setPlayer);
  const persist = usePlayerStore(s => s.persist);
  const repairActiveShipHull = usePlayerStore(s => s.repairActiveShipHull);
  const [tab, setTab] = useState<'status' | 'capital' | 'hangar'>('status');
  const safeBack = useSafeRouterBack();
  const stageFrameReady = useStageFirstFrameReady();

  const shipyardSessionConfig = useMemo(
    () => (player?.currentPlanetId ? createShipyardScreenSession(player.currentPlanetId) : null),
    [player?.currentPlanetId],
  );
  const shipyardSession = useHeavyUiDataSession(shipyardSessionConfig);
  const screenReady = shipyardSession.phase === 'ready' && stageFrameReady;

  const hangarSorted = useMemo(() => {
    if (!player) return [];
    return [...player.shipHangar].sort((a, b) => b.acquiredAt - a.acquiredAt);
  }, [player?.shipHangar]);

  /** `player` 유무에 따라 훅 개수가 바뀌면 안 됨 — 빠른 화면 전환 시 React 훅 불일치 크래시 방지 */
  const shipFinal = useMemo(() => {
    if (!player) return null;
    return resolveShipFinalStatResult(player.ship);
  }, [player]);
  const combatProficiency = useMemo(
    () => (player ? normalizePlayerCombatProficiency(player.combatProficiency, player.level) : null),
    [player],
  );
  usePlanetSubStageMemory('shipyard', () => {
    setTab('status');
  });
  usePlanetHubFacilityAccessGate('shipyard');

  if (!player || !shipFinal) return null;

  const { ship, credits } = player;
  const inventorySlots = player.inventorySlots;
  const finalStats = shipFinal.finalStats;
  const showServiceComingSoon = (labelKey: 'shipyard.repair.btn' | 'shipyard.shield.btn') => {
    showArcAlert(
      t('shipyard.service.comingSoonTitle'),
      t('shipyard.service.comingSoonBody', { label: t(labelKey) }),
    );
  };

  const handleSelectHangarShip = async (npcCapitalShipId: string) => {
    const syncedHangar = syncCurrentShipDurabilityToHangar(ship, player.shipHangar);
    const applied = applyNpcCapitalShipToPlayerShip(ship, npcCapitalShipId);
    if (!applied.ok) {
      showArcAlert(t('shipyard.select.failTitle'), t('shipyard.select.failBody'));
      return;
    }
    const nextShip: PlayerShip = {
      ...applied.ship,
      durabilityPct: resolveHangarShipDurabilityPct(syncedHangar, npcCapitalShipId),
    };
    setPlayer({ ...player, shipHangar: syncedHangar, ship: nextShip });
    await persist();
    showArcAlert(t('shipyard.select.doneTitle'), t('shipyard.select.doneBody'));
  };

  const shipDurabilityPct = Math.round(resolvePlayerShipDurabilityPct(ship));
  const hullRepairCost = resolveCapitalShipRepairCost(ship, normalizeInventorySlots(inventorySlots));
  const hullRepairNeeded = shipDurabilityPct < 100 && !isSurvivalPodNpcShipId(ship.portraitNpcCapitalShipId);

  const handleRepairHull = () => {
    if (!hullRepairNeeded) {
      showArcAlert(t('shipyard.repair.noneTitle'), t('shipyard.repair.noneBody'));
      return;
    }
    if (credits < hullRepairCost) {
      showArcAlert(t('shipyard.creditShortTitle'), t('shipyard.creditShortBody'));
      return;
    }
    showArcAlert(
      t('shipyard.repair.confirmTitle'),
      t('shipyard.repair.confirmBody', { pct: shipDurabilityPct, cost: formatCredits(hullRepairCost) }),
      [
        { text: t('shipyard.btn.cancel'), style: 'cancel' },
        {
          text: t('shipyard.repair.doConfirm'),
          onPress: () => {
            void repairActiveShipHull().then((result) => {
              if (result.ok) {
                showArcAlert(t('shipyard.repair.doneTitle'), t('shipyard.repair.doneBody'));
                return;
              }
              if (result.reason === 'insufficient_credits') {
                showArcAlert(t('shipyard.creditShortTitle'), t('shipyard.creditShortBody'));
              }
            });
          },
        },
      ],
    );
  };

  const handleReleaseCurrentShip = async () => {
    if (isSurvivalPodNpcShipId(ship.portraitNpcCapitalShipId)) {
      showArcAlert(t('shipyard.release.podTitle'), t('shipyard.release.podBody'));
      return;
    }
    const baseTemplate = SHIP_TEMPLATES[player.shipId];
    if (!baseTemplate) {
      showArcAlert(t('shipyard.release.failTitle'), t('shipyard.release.failBody'));
      return;
    }
    const portraitNpcId = baseTemplate.portraitNpcCapitalShipId ?? '';
    const released = applyNpcCapitalShipToPlayerShip(
      {
        ...ship,
        templateId: baseTemplate.id,
        portraitNpcCapitalShipId: portraitNpcId,
        name: baseTemplate.name,
        maxHp: baseTemplate.maxHp,
        hp: baseTemplate.maxHp,
        maxShield: baseTemplate.maxShield,
        shield: baseTemplate.maxShield,
        armor: baseTemplate.armor,
        speed: baseTemplate.speed,
        equipCapacity: Math.max(0, Math.floor(baseTemplate.equipSlots ?? 0)),
        weapons: ship.weapons.length > 0 ? [...ship.weapons] : [{ ...baseTemplate.baseWeapon }],
      },
      portraitNpcId,
    );
    updateShip(released.ok ? released.ship : ship);
    await persist();
    showArcAlert(t('shipyard.release.doneTitle'), t('shipyard.release.doneBody'));
  };

  const template = SHIP_TEMPLATES[ship.templateId];
  const portraitNpcId = ship.portraitNpcCapitalShipId ?? template?.portraitNpcCapitalShipId;
  const portraitRow = portraitNpcId
    ? getNpcCapitalShip(portraitNpcId)
    : undefined;
  const combatStats = portraitRow?.combat;
  const shipClassification = portraitNpcId
    ? resolveCapitalShipClassification(portraitNpcId)
    : null;
  const displayShipName = resolveNpcCapitalShipDisplayName(
    portraitNpcId,
    ship.name,
    locale,
  );
  const strStat = combatStats?.strStat ?? 14;
  const dexStat = combatStats?.dexStat ?? 14;
  const sizeClass = combatStats?.sizeClass ?? 0;
  const totalWeaponDamage = sumEquippedWeaponTableDamage(ship.equipSlots);
  const formatEquippedWeaponStatValue = (
    slot: { itemDefId?: string; name?: string } | null | undefined,
  ): string => {
    const weaponId = weaponIdFromSlotItemDef(slot?.itemDefId);
    if (!weaponId) return t('shipyard.weapon.empty');
    const name = resolveEquipSlotDisplayName(slot?.itemDefId, slot?.name, locale);
    const dps = computeCapitalWeaponDps(weaponId);
    const dpsText = dps != null
      ? t('shipyard.weapon.dps', { value: dps.toFixed(1) })
      : t('shipyard.weapon.dpsNull');
    return t('shipyard.weapon.stat', { name, dps: dpsText });
  };
  const shipSubtitle = shipClassification
    ? (locale !== 'ko' ? shipClassification.roleSummaryEn : shipClassification.roleSummaryKo)
    : resolveShipTemplateDescription(ship.templateId, template?.description, locale);
  const weaponStatLines = {
    WEAPON_1: formatEquippedWeaponStatValue(ship.equipSlots?.WEAPON_1),
    WEAPON_2: formatEquippedWeaponStatValue(ship.equipSlots?.WEAPON_2),
    WEAPON_3: formatEquippedWeaponStatValue(ship.equipSlots?.WEAPON_3),
    WEAPON_4: formatEquippedWeaponStatValue(ship.equipSlots?.WEAPON_4),
  };
  const shipPortraitSource = resolveNpcCapitalShipPortraitSource(portraitRow?.portraitImageAssetKey);

  const renderShipOverview = (showEquipScaffold = false) => (
    <>
      <View style={[fs.stackCard, styles.shipHeroCard]}>
        <View style={styles.shipHeroImageStage}>
          {shipPortraitSource ? (
            <Image
              source={shipPortraitSource}
              style={styles.shipHeroImage}
              resizeMode="cover"
              accessibilityLabel={displayShipName}
            />
          ) : (
            <View style={styles.shipHeroPlaceholder}>
              <ShipGridPlaceholder cellSize={10} tone="player" />
            </View>
          )}
          {showEquipScaffold ? (
            <View style={styles.shipEquipOverlay} pointerEvents="none">
              <View style={styles.shipEquipOverlayMidRow}>
                <View style={styles.sideSlotCol}>
                  {[1, 2, 3].map((n) => (
                    <View key={`left-slot-${n}`} style={styles.sideEquipSlot}>
                      <Text style={styles.sideEquipSlotText}>{`L${n}`}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.shipEquipOverlayCenterSpacer} />
                <View style={styles.sideSlotCol}>
                  {[1, 2, 3].map((n) => (
                    <View key={`right-slot-${n}`} style={styles.sideEquipSlot}>
                      <Text style={styles.sideEquipSlotText}>{`R${n}`}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.bottomEquipSlotRow}>
                {[1, 2, 3, 4].map((n) => (
                  <View key={`bottom-slot-${n}`} style={styles.bottomEquipSlot}>
                    <Text style={styles.bottomEquipSlotText}>{`S${n}`}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
        <View style={styles.shipHeroBody}>
          <Text style={styles.shipName}>{displayShipName}</Text>
          <Text style={styles.shipClass}>{shipSubtitle}</Text>
        </View>
      </View>

      <View style={fs.infoPanel}>
        <Text style={[fs.sectionBar, fs.sectionBarFirst]}>{t('shipyard.stats.title')}</Text>
        {isSurvivalPodNpcShipId(ship.portraitNpcCapitalShipId) ? (
          <Text style={styles.survivalPodNotice}>
            {t('shipyard.stats.survivalPod')}
          </Text>
        ) : null}
        <StatRow label={t('shipyard.stats.shipName')} value={displayShipName} />
        {shipClassification ? (
          <>
            <StatDescRow
              label={t('shipyard.stats.classification')}
              value={formatCapitalShipIdentityBlock(shipClassification, locale).split('\n')[0] ?? ''}
            />
            <StatDescRow
              label={t('shipyard.stats.role')}
              value={locale !== 'ko' ? shipClassification.roleSummaryEn : shipClassification.roleSummaryKo}
            />
          </>
        ) : null}
        {combatProficiency ? (
          <>
            <StatRow label={t('shipyard.stats.combatGrade')} value={`Lv.${combatProficiency.combatLevel}`} />
            <StatRow label={t('shipyard.stats.efficiency')} value={`${combatProficiency.operatingEfficiencyPct}%`} />
            <StatRow
              label={t('shipyard.stats.proficiency')}
              value={`×${combatProficiency.proficiencyMultiplier.toFixed(3)}`}
            />
          </>
        ) : null}
        <StatRow label={t('shipyard.stats.hull')} value={`${finalStats.maxHp}`} />
        <StatRow label={t('shipyard.stats.durability')} value={`${shipDurabilityPct}%`} />
        <StatRow label={t('shipyard.stats.shield')} value={`${finalStats.maxShield}`} />
        <StatRow label={t('shipyard.stats.speed')} value={`${finalStats.speed}`} />

        <StatRow label={t('shipyard.stats.str')} value={`${strStat}`} />
        <StatRow label={t('shipyard.stats.dex')} value={`${dexStat}`} />
        <StatRow label={t('shipyard.stats.size')} value={`${sizeClass}`} />
        <StatRow label={t('shipyard.stats.accuracy')} value={`${combatStats?.attackBonus ?? 0}`} />
        <StatRow label={t('shipyard.stats.attack')} value={`${totalWeaponDamage}`} />
        <StatRow label={t('shipyard.stats.weapon1')} value={weaponStatLines.WEAPON_1} />
        <StatRow label={t('shipyard.stats.weapon2')} value={weaponStatLines.WEAPON_2} />
        <StatRow label={t('shipyard.stats.weapon3')} value={weaponStatLines.WEAPON_3} />
        <StatRow label={t('shipyard.stats.weapon4')} value={weaponStatLines.WEAPON_4} />
        <StatRow label={t('shipyard.stats.inventory')} value={`${inventorySlots.length}`} />
      </View>

    </>
  );

  return (
    <StageShell key={localeRenderKey} routeName="shipyard" background="none" edges={['bottom']} safeAreaBackgroundColor={TF.headerBg}>
      <View style={fs.root}>
      <PlanetFacilityTitleHeader
        title={t('shipyard.title')}
        onBack={safeBack}
        backLabel={t('common.back')}
        trailing={<Text style={fs.headerTrailingInk}>{formatCredits(credits)}</Text>}
      />

      <View style={fs.bodyPanel}>
      <PlanetFacilityTabBar
        tabs={[
          { id: 'status', label: t('shipyard.tab.status') },
          { id: 'capital', label: t('shipyard.tab.capital') },
          { id: 'hangar', label: t('shipyard.tab.hangar') },
        ]}
        activeId={tab}
        onSelect={(id) => setTab(id as 'status' | 'capital' | 'hangar')}
      />

      <ScrollView style={fs.scroll} contentContainerStyle={fs.scrollContent} showsVerticalScrollIndicator={false}>

        {tab === 'status' && (
          <>
            {renderShipOverview(false)}
            <View style={fs.infoPanel}>
              <Text style={[fs.sectionBar, fs.sectionBarFirst]}>{t('shipyard.service.title')}</Text>

              <TouchableOpacity
                style={[styles.serviceBtn, !hullRepairNeeded && styles.serviceBtnDisabled]}
                onPress={handleRepairHull}
                disabled={!hullRepairNeeded}
              >
                <View style={styles.serviceBtnLeft}>
                  <Text style={styles.serviceBtnTitle}>{t('shipyard.repair.btn')}</Text>
                  <Text style={styles.serviceBtnSub}>
                    {hullRepairNeeded
                      ? t('shipyard.repair.sub', { pct: shipDurabilityPct, cost: formatCredits(hullRepairCost) })
                      : t('shipyard.repair.fullSub', { pct: shipDurabilityPct })}
                  </Text>
                </View>
                <Text style={hullRepairNeeded ? styles.serviceBtnAction : styles.serviceBtnActionMuted}>
                  {hullRepairNeeded ? t('shipyard.repair.action') : t('shipyard.repair.fullAction')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceBtn, styles.serviceBtnDisabled]}
                onPress={() => showServiceComingSoon('shipyard.shield.btn')}
              >
                <View style={styles.serviceBtnLeft}>
                  <Text style={styles.serviceBtnTitle}>{t('shipyard.shield.btn')}</Text>
                  <Text style={styles.serviceBtnSub}>{t('shipyard.service.unimplementedSub')}</Text>
                </View>
                <Text style={styles.serviceBtnActionMuted}>{t('shipyard.service.unimplementedAction')}</Text>
              </TouchableOpacity>
            </View>

            <View style={fs.infoPanel}>
              <Text style={[fs.sectionBar, fs.sectionBarFirst]}>{t('shipyard.upgrade.sectionTitle')}</Text>
              <ShipyardMineralUpgradeTab />
            </View>
          </>
        )}

        {tab === 'capital' && (
          <>
            {renderShipOverview(true)}
            <ShipyardEquipSlotsBlock ship={ship} updateShip={updateShip} persist={persist} />
            <ShipyardInventoryGrid player={player} ship={ship} updateShip={updateShip} persist={persist} />
          </>
        )}

        {tab === 'hangar' && (
          hangarSorted.length === 0 ? (
            <View style={styles.hangarEmpty}>
              <Text style={styles.hangarEmptyIcon}>🚢</Text>
              <Text style={fs.empty}>{t('shipyard.hangar.emptyTitle')}</Text>
              <Text style={fs.sectionMeta}>{t('shipyard.hangar.emptySub')}</Text>
            </View>
          ) : (
            <>
              <Text style={fs.sectionBar}>{t('shipyard.hangar.stored')}</Text>
              <Text style={[fs.sectionMeta, styles.hangarLeadMeta]}>
                {t('shipyard.hangar.current', { name: displayShipName })}
              </Text>
              {hangarSorted.map(entry => {
                const row = getNpcCapitalShip(entry.npcCapitalShipId);
                const hangarShipName = resolveNpcCapitalShipDisplayName(
                  entry.npcCapitalShipId,
                  row?.name ?? entry.npcCapitalShipId,
                  locale,
                );
                const thumbSrc = row?.portraitImageAssetKey
                  ? resolveNpcCapitalShipPortraitSource(row.portraitImageAssetKey)
                  : undefined;
                const isCurrentShip = ship.portraitNpcCapitalShipId === entry.npcCapitalShipId;
                const isSurvivalPodEntry = isSurvivalPodNpcShipId(entry.npcCapitalShipId);
                const hullDurabilityPct = Math.round(
                  isCurrentShip
                    ? resolvePlayerShipDurabilityPct(ship)
                    : resolveDurabilityPct(entry.durabilityPct),
                );
                return (
                  <View key={entry.id} style={[fs.stackCard, styles.hangarRowCard]}>
                    <View style={styles.hangarRowLayout}>
                      {thumbSrc ? (
                        <View style={styles.hangarThumbFrame}>
                          <Image
                            source={thumbSrc}
                            style={styles.hangarThumbImage}
                            resizeMode="cover"
                            accessibilityLabel={hangarShipName}
                          />
                        </View>
                      ) : (
                        <View style={styles.hangarThumbPlaceholder} accessibilityLabel={t('shipyard.hangar.noImage')}>
                          <Text style={styles.hangarThumbPhText}>⋯</Text>
                        </View>
                      )}
                      <View style={styles.hangarRowContent}>
                        <View style={styles.hangarMeta}>
                          <PlanetFacilityCardTitleBlock title={hangarShipName} titleNumberOfLines={1}>
                            {isSurvivalPodEntry ? (
                              <Text style={fs.cardBadge}>{t('shipyard.hangar.badgePod')}</Text>
                            ) : null}
                            {isCurrentShip ? (
                              <Text style={fs.cardBadge}>{t('shipyard.hangar.badgeCurrent')}</Text>
                            ) : null}
                            {!isSurvivalPodEntry ? (
                              <Text style={fs.cardMeta} numberOfLines={1}>
                                {t('shipyard.hangar.hullDurability', { pct: hullDurabilityPct })}
                              </Text>
                            ) : null}
                            <Text style={fs.cardBody} numberOfLines={2}>
                              {t('shipyard.hangar.delivered', { date: new Date(entry.acquiredAt).toLocaleString(intlTag()) })}
                            </Text>
                          </PlanetFacilityCardTitleBlock>
                        </View>
                        <View style={styles.hangarActions}>
                          <ArcButton
                            label={t('shipyard.btn.select')}
                            variant="tacticalPrimary"
                            disabled={isSurvivalPodEntry}
                            onPress={() => {
                              if (isSurvivalPodEntry) return;
                              void handleSelectHangarShip(entry.npcCapitalShipId);
                            }}
                            style={styles.hangarActionBtn}
                          />
                          <ArcButton
                            label={t('shipyard.btn.release')}
                            variant="tacticalSecondary"
                            disabled={isSurvivalPodEntry || !isCurrentShip}
                            onPress={() => {
                              if (isSurvivalPodEntry || !isCurrentShip) return;
                              void handleReleaseCurrentShip();
                            }}
                            style={styles.hangarActionBtn}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )
        )}

        <View style={{ height: SHIPYARD_BOTTOM_STAGE_RESERVE_PX }} />
      </ScrollView>
      <StageLoadingOverlay visible={!screenReady && shipyardSession.phase !== 'error'} overlayId="stage-loading-shipyard" />
      {shipyardSession.phase === 'error' ? (
        <HeavyUiStageErrorPanel
          preflightCode={shipyardSession.preflightCode}
          error={shipyardSession.error}
          facilityKind="shipyard"
          onRetry={shipyardSession.retry}
          onBack={safeBack}
        />
      ) : null}
      </View>
      </View>
    </StageShell>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return <ArcOverlayInfoRow label={label} value={value} visualTheme="tactical" />;
}

/** 함급 분류·역할 등 긴 설명 — 라벨 아래 최대 2줄 */
function StatDescRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRowStacked}>
      <Text style={fs.statLabel}>{label}</Text>
      <Text style={styles.statStackedValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function isInventoryCellEquipped(
  ship: PlayerShip,
  cellIndex: number,
  goodId: string,
): boolean {
  const slotIds: ShipyardEquipSlotId[] = [
    ...COMBAT_WEAPON_SLOT_IDS,
    ...SHIPYARD_EQUIP_SLOT_DEFS.map((d) => d.id),
  ];
  for (const slotId of slotIds) {
    const slot = ship.equipSlots?.[slotId];
    if (!slot || slot.itemDefId !== goodId) continue;
    if (typeof slot.sourceInventoryIndex === 'number') {
      return slot.sourceInventoryIndex === cellIndex;
    }
    return true;
  }
  return false;
}

function ShipyardInventoryGrid({
  player,
  ship,
  updateShip,
  persist,
}: {
  player: Player;
  ship: PlayerShip;
  updateShip: (s: PlayerShip) => void;
  persist: () => Promise<void>;
}) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const slots = normalizeInventorySlots(player.inventorySlots);
  const used = slots.filter(Boolean).length;
  const rebuildWeaponsFromSlots = (
    nextSlots: Partial<Record<ShipyardEquipSlotId, { itemDefId: string; name: string } | null>>,
  ) => {
    return COMBAT_WEAPON_SLOT_IDS
      .map((slotId) => nextSlots[slotId]?.itemDefId ?? '')
      .map((itemDefId) => weaponIdFromSlotItemDef(itemDefId))
      .map((weaponId) => CAPITAL_WEAPON_LIST_FROM_CSV[weaponId])
      .filter((w): w is NonNullable<typeof w> => Boolean(w))
      .map((w) => buildWeaponDataFromCapitalRow(w));
  };

  const equipWeaponFromInventory = async (itemId: string, inventoryIndex: number) => {
    if (isSurvivalPodNpcShipId(ship.portraitNpcCapitalShipId)) {
      showArcAlert(t('shipyard.inventory.equipPodTitle'), t('shipyard.inventory.equipPodBody'));
      return;
    }
    const weaponId = weaponIdFromWeaponItemId(itemId);
    if (!weaponId) return;
    const row = CAPITAL_WEAPON_LIST_FROM_CSV[weaponId];
    const weapon = ship.weapons.find((w) => w.id === weaponId)
      ?? (row ? buildWeaponDataFromCapitalRow(row) : null);
    if (!weapon) {
      showArcAlert(t('shipyard.inventory.equipFailTitle'), t('shipyard.inventory.equipFailNoTable'));
      return;
    }
    const slotId = resolveCombatWeaponSlotForWeaponId(weaponId);
    if (!slotId) {
      showArcAlert(t('shipyard.inventory.equipFailTitle'), t('shipyard.inventory.equipFailNoSlot'));
      return;
    }
    const nextSlots = { ...(ship.equipSlots ?? {}) };
    nextSlots[slotId] = {
      itemDefId: itemId,
      name: resolveEquipSlotDisplayName(itemId, row?.name ?? weapon.name, locale),
      sourceInventoryIndex: inventoryIndex,
    };
    const nextWeapons = rebuildWeaponsFromSlots(nextSlots);
    updateShip({ ...ship, equipSlots: nextSlots, weapons: nextWeapons });
    await persist();
  };

  const unequipWeaponToInventory = async (itemId: string) => {
    const slotId =
      COMBAT_WEAPON_SLOT_IDS.find((id) => ship.equipSlots?.[id]?.itemDefId === itemId) ?? null;
    if (!slotId) return;
    const nextSlots = { ...(ship.equipSlots ?? {}) };
    nextSlots[slotId] = { itemDefId: UNEQUIPPED_WEAPON_ITEM_ID, name: tStatic('shipyard.unequipped') };
    const nextWeapons = rebuildWeaponsFromSlots(nextSlots);
    updateShip({ ...ship, equipSlots: nextSlots, weapons: nextWeapons });
    await persist();
  };

  const equipEquipmentFromInventory = async (itemId: string, inventoryIndex: number) => {
    if (isSurvivalPodNpcShipId(ship.portraitNpcCapitalShipId)) {
      showArcAlert(t('shipyard.inventory.equipPodTitle'), t('shipyard.inventory.equipPodBody'));
      return;
    }
    const slotId = resolveShipEquipmentSlotForItemDef(itemId);
    if (!slotId) {
      showArcAlert(t('shipyard.inventory.equipFailTitle'), t('shipyard.inventory.equipFailNoSlot'));
      return;
    }
    const slotDef = SHIPYARD_EQUIP_SLOT_DEFS.find((d) => d.id === slotId);
    const order = slotDef?.order ?? 99;
    if (isShipyardEquipSlotLockedByCapacity(order, slotId, ship.equipCapacity ?? 0)) {
      showArcAlert(t('shipyard.equip.lockTitle'), t('shipyard.equip.lockBody', { n: ship.equipCapacity ?? 0 }));
      return;
    }
    const nextSlots = { ...(ship.equipSlots ?? {}) };
    nextSlots[slotId] = {
      itemDefId: itemId,
      name: resolveEquipSlotDisplayName(itemId, itemId, locale),
      sourceInventoryIndex: inventoryIndex,
    };
    updateShip({ ...ship, equipSlots: nextSlots });
    await persist();
  };

  const unequipEquipmentFromInventory = async (itemId: string) => {
    const slotId = SHIPYARD_EQUIP_SLOT_DEFS.find(
      (d) => ship.equipSlots?.[d.id]?.itemDefId === itemId,
    )?.id ?? null;
    if (!slotId) return;
    const nextSlots = { ...(ship.equipSlots ?? {}) };
    delete nextSlots[slotId];
    updateShip({ ...ship, equipSlots: nextSlots });
    await persist();
  };

  return (
    <View style={fs.infoPanel}>
      <Text style={[fs.sectionBar, fs.sectionBarFirst]}>{t('shipyard.inventory.title')}</Text>
      <Text style={[fs.sectionMeta, styles.hangarLeadMeta]}>
        {t('shipyard.inventory.slotLine', { slots: PLAYER_INVENTORY_SLOT_COUNT, used })}
      </Text>
      <View style={styles.inventoryList}>
        {slots.map((cell, i) => {
          const good = cell ? TRADE_GOODS[cell.goodId] : undefined;
          const weaponDef = cell ? resolveWeaponItemDef(cell.goodId) : null;
          const isWeaponModule = Boolean(cell && isWeaponItemId(cell.goodId));
          const isEquipmentModule = Boolean(cell && isShipEquipmentItemId(cell.goodId));
          const isEquipped = Boolean(cell && isInventoryCellEquipped(ship, i, cell.goodId));
          const itemName = cell
            ? (() => {
              const base = good
                ? resolveItemName(good, locale)
                : weaponDef
                  ? resolveEquipSlotDisplayName(cell.goodId, weaponDef.name, locale)
                  : cell.goodId;
              const pendingSuffix = isEquipmentModule
                ? formatShipEquipmentListingSuffix(cell.goodId, ` ${t('equipment.effectPendingSuffix')}`)
                : '';
              return `${base}${pendingSuffix}`;
            })()
            : t('shipyard.inventory.emptyCell');
          return (
            <View
              key={`inv-${i}`}
              style={[fs.listingCard, !cell && styles.inventoryRowEmpty]}
              accessibilityLabel={`${i + 1} ${cell ? cell.goodId : ''}`}
            >
              <View style={fs.listingLeft}>
                {cell ? (
                  <TradeListingIcon
                    goodId={cell.goodId}
                    category={good?.category ?? 'tech'}
                  />
                ) : (
                  <TradeListingEmptySlot />
                )}
                {cell ? (
                  <PlanetFacilityCardTitleBlock
                    title={itemName}
                    titleNumberOfLines={2}
                    description={formatInventoryDurabilityMeta({
                      cell,
                      isEquipped,
                      equippedSuffix: t('shipyard.inventory.equippedSuffix'),
                      qtyLabel: (qty, equipped) => t('shipyard.inventory.qty', { qty, equipped }),
                      durabilityLabel: (qty, equipped, pct) =>
                        t('shipyard.inventory.durabilityMeta', { qty, equipped, pct }),
                    })}
                    descriptionLines={1}
                  />
                ) : (
                  <View style={fs.listingTextBlock}>
                    <Text style={fs.itemDesc}>{t('shipyard.inventory.emptyCell')}</Text>
                  </View>
                )}
              </View>
              {cell && isWeaponModule ? (
                <View style={styles.inventoryItemActions}>
                  <ArcButton
                    label={t('shipyard.btn.equip')}
                    variant="tacticalPrimary"
                    onPress={() => {
                      void equipWeaponFromInventory(cell.goodId, i);
                    }}
                    style={styles.inventoryActionBtn}
                  />
                  <ArcButton
                    label={t('shipyard.btn.unequip')}
                    variant="tacticalSecondary"
                    disabled={!isEquipped}
                    onPress={() => {
                      void unequipWeaponToInventory(cell.goodId);
                    }}
                    style={styles.inventoryActionBtn}
                  />
                </View>
              ) : null}
              {cell && isEquipmentModule ? (
                <View style={styles.inventoryItemActions}>
                  <ArcButton
                    label={t('shipyard.btn.equip')}
                    variant="tacticalPrimary"
                    onPress={() => {
                      void equipEquipmentFromInventory(cell.goodId, i);
                    }}
                    style={styles.inventoryActionBtn}
                  />
                  <ArcButton
                    label={t('shipyard.btn.unequip')}
                    variant="tacticalSecondary"
                    disabled={!isEquipped}
                    onPress={() => {
                      void unequipEquipmentFromInventory(cell.goodId);
                    }}
                    style={styles.inventoryActionBtn}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ShipyardEquipSlotsBlock({
  ship,
  updateShip,
  persist,
}: {
  ship: PlayerShip;
  updateShip: (s: PlayerShip) => void;
  persist: () => Promise<void>;
}) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const map = ship.equipSlots ?? {};
  const rebuildWeaponsFromSlots = (
    nextSlots: Partial<Record<ShipyardEquipSlotId, { itemDefId: string; name: string } | null>>,
  ) => {
    return COMBAT_WEAPON_SLOT_IDS
      .map((slotId) => nextSlots[slotId]?.itemDefId ?? '')
      .map((itemDefId) => weaponIdFromSlotItemDef(itemDefId))
      .map((weaponId) => CAPITAL_WEAPON_LIST_FROM_CSV[weaponId])
      .filter((w): w is NonNullable<typeof w> => Boolean(w))
      .map((w) => buildWeaponDataFromCapitalRow(w));
  };
  const equipCapacity = Math.max(
    0,
    Math.floor(
      ship.equipCapacity
      ?? SHIP_TEMPLATES[ship.templateId]?.equipSlots
      ?? SHIPYARD_EQUIP_SLOT_DEFS.length,
    ),
  );

  const openSlot = (slotId: ShipyardEquipSlotId, order: number) => {
    if (order > equipCapacity) {
      showArcAlert(t('shipyard.equip.lockTitle'), t('shipyard.equip.lockBody', { n: equipCapacity }));
      return;
    }
    const cur = map[slotId] ?? null;
    if (isEquipSlotFilled(cur)) {
      const displayName = resolveEquipSlotDisplayName(cur!.itemDefId, cur!.name, locale);
      showArcAlert(`[${order}.${slotId}]`, t('shipyard.equip.unequipBody', { name: displayName }), [
        { text: t('shipyard.btn.close'), style: 'cancel' },
        {
          text: t('shipyard.equip.doUnequip'),
          onPress: async () => {
            const nextSlots = { ...map };
            if (isCombatWeaponEquipSlot(slotId)) {
              nextSlots[slotId] = { itemDefId: UNEQUIPPED_WEAPON_ITEM_ID, name: tStatic('shipyard.unequipped') };
            } else {
              delete nextSlots[slotId];
            }
            const nextWeapons = rebuildWeaponsFromSlots(nextSlots);
            updateShip({ ...ship, equipSlots: nextSlots, weapons: nextWeapons });
            await persist();
          },
        },
      ]);
      return;
    }
    showArcAlert(`[${order}.${slotId}]`, t('shipyard.equip.emptyBody'), [
      { text: t('shipyard.btn.close'), style: 'cancel' },
    ]);
  };

  return (
    <View style={fs.infoPanel}>
      <Text style={[fs.sectionBar, fs.sectionBarFirst]}>{t('shipyard.equip.title')}</Text>
      <Text style={styles.equipCapacityLine}>{t('shipyard.equip.capacity', { n: equipCapacity })}</Text>
      <View style={styles.equipSlotsGrid}>
        {SHIPYARD_EQUIP_SLOT_DEFS.map(({ order, id }) => {
          const cur = map[id];
          const filled = isEquipSlotFilled(cur);
          const locked = isShipyardEquipSlotLockedByCapacity(order, id, equipCapacity);
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.equipSlotCell,
                filled ? styles.equipSlotFilled : styles.equipSlotEmpty,
                locked && styles.equipSlotLocked,
              ]}
              onPress={() => openSlot(id, order)}
              accessibilityLabel={`${order} ${id}`}
            >
              <Text style={styles.equipSlotTag}>{`[${order}.${id}]`}</Text>
              <Text style={styles.equipSlotItem} numberOfLines={2}>
                {locked
                  ? t('shipyard.equip.slotLocked')
                  : filled
                    ? resolveEquipSlotDisplayName(cur!.itemDefId, cur!.name, locale)
                    : t('shipyard.equip.slotEmpty')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shipHeroCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  shipHeroImageStage: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    backgroundColor: TF.insetBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TF.insetBorder,
  },
  shipHeroImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  shipHeroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipEquipOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  shipEquipOverlayMidRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: SPACING.sm,
  },
  shipEquipOverlayCenterSpacer: {
    flex: 1,
  },
  shipHeroBody: {
    padding: SPACING.md,
    alignItems: 'center',
    rowGap: SPACING.xs,
  },
  bottomEquipSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: SPACING.sm,
  },
  bottomEquipSlot: {
    width: 40,
    height: 30,
    borderWidth: 1,
    borderRadius: 2,
    borderColor: TF.insetBorder,
    backgroundColor: TF.insetBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomEquipSlotText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: TF.mutedInk,
    fontWeight: FONTS.weight.bold,
  },
  sideSlotCol: {
    width: 44,
    rowGap: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sideEquipSlot: {
    width: 36,
    height: 28,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: TF.equipSlotBorder,
    backgroundColor: TF.equipSlotBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideEquipSlotText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: TF.slotInk,
    fontWeight: FONTS.weight.bold,
  },
  shipName: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: TF.titleInk,
  },
  shipClass: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.midInk,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },

  survivalPodNotice: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.danger,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  statRowStacked: {
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: TF.divider,
  },
  statStackedValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.titleInk,
    fontWeight: FONTS.weight.bold,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  serviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: TF.divider,
  },
  serviceBtnDisabled: { opacity: 0.35 },
  serviceBtnLeft: { flex: 1 },
  serviceBtnTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: TF.titleInk,
    fontWeight: FONTS.weight.bold,
  },
  serviceBtnSub: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.mutedInk,
    marginTop: 2,
  },
  serviceBtnAction: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.safeInk,
    fontWeight: FONTS.weight.bold,
  },
  serviceBtnActionMuted: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.mutedInk,
    fontWeight: FONTS.weight.bold,
  },

  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    rowGap: SPACING.md, columnGap: SPACING.md,
  },
  comingSoonIcon: { fontSize: 48 },
  comingSoonText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: TF.midInk,
    fontWeight: FONTS.weight.bold,
  },
  comingSoonSub: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.mutedInk,
  },

  hangarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 72,
    paddingHorizontal: SPACING.lg,
    rowGap: SPACING.md,
    columnGap: SPACING.md,
  },
  hangarEmptyIcon: { fontSize: 44 },
  hangarLeadMeta: {
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  hangarRowCard: {
    padding: 0,
    overflow: 'hidden',
  },
  hangarRowLayout: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  hangarRowContent: {
    padding: SPACING.md,
    rowGap: SPACING.sm,
  },
  hangarThumbFrame: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    backgroundColor: TF.insetBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TF.insetBorder,
  },
  hangarThumbImage: {
    width: '100%',
    height: '100%',
  },
  hangarThumbPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: TF.insetBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TF.insetBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangarThumbPhText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: TF.mutedInk,
  },
  hangarMeta: { width: '100%' },
  hangarActions: {
    flexDirection: 'row',
    columnGap: SPACING.sm,
    width: '100%',
  },
  hangarActionBtn: {
    flex: 1,
    minHeight: 34,
    paddingVertical: 4,
    paddingHorizontal: SPACING.xs,
  },

  inventoryItemActions: {
    rowGap: 6,
    marginLeft: SPACING.sm,
    minWidth: 72,
    justifyContent: 'center',
    flexShrink: 0,
  },
  inventoryActionBtn: {
    minHeight: 34,
    paddingVertical: 4,
    paddingHorizontal: SPACING.xs,
  },

  equipSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  equipCapacityLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.mutedInk,
    marginTop: SPACING.xs,
  },
  equipSlotCell: {
    width: '48%',
    minHeight: 76,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderRadius: 6,
    borderColor: TF.cardBorder,
    backgroundColor: TF.cardBg,
  },
  equipSlotFilled: {
    borderColor: TF.safeInk,
    backgroundColor: TF.cardBg,
  },
  equipSlotLocked: {
    opacity: 0.35,
  },
  equipSlotEmpty: {},
  equipSlotTag: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: TF.mutedInk,
  },
  equipSlotItem: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.titleInk,
    fontWeight: FONTS.weight.bold,
    marginTop: 6,
  },
  inventorySlotCell: {
    width: '100%',
    minHeight: 64,
  },
  inventoryList: {
    marginTop: SPACING.xs,
  },
  inventoryRowEmpty: {
    opacity: 0.6,
  },
  inventoryWeaponHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  inventoryWeaponHint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.mutedInk,
    flex: 1,
  },
  weaponItemActions: {
    flexDirection: 'row',
    columnGap: 6,
  },
  weaponBtn: {
    borderWidth: 1,
    borderColor: TF.insetBorder,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: TF.insetBg,
  },
  weaponBtnActive: {
    borderColor: TF.safeInk,
    backgroundColor: TF.insetBg,
  },
  weaponBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: TF.titleInk,
    fontWeight: FONTS.weight.bold,
  },
  inventoryDetailLink: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: TF.safeInk,
    marginTop: 6,
  },

});
