// ============================================================
// 아크파이어 온라인 - 조선소 화면
// ============================================================

import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
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
import { usePlanetSubStageMemory } from '../../src/hooks/usePlanetSubStageMemory';
import { usePlanetHubFacilityAccessGate } from '../../src/hooks/usePlanetHubFacilityAccessGate';
import { useLocaleRenderKey } from '../../src/hooks/useLocaleRenderKey';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { ArcStageBackButton } from '../../src/ui/overlay/ArcStageBackButton';
import { PlanetFacilityTabBar } from '../../src/ui/planetFacility/PlanetFacilityTabBar';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import {
  resolveCapitalShipClassification,
  formatCapitalShipIdentityBlock,
} from '../../src/arcCore/balance/capitalShipClassification';
import { resolveShipFinalStatResult } from '../../src/ship/shipStatPipeline';
import { ShipyardMineralUpgradeTab } from '../../src/components/shipyard/ShipyardMineralUpgradeTab';
import { normalizePlayerCombatProficiency } from '../../src/combat/playerCombatProficiency';
import {
  normalizeInventorySlots,
} from '../../src/game/playerInventory';
import {
  isWeaponItemId,
  resolveWeaponItemDef,
  weaponIdFromWeaponItemId,
} from '../../src/game/weaponItemBridge';
const REPAIR_COST_PER_HP = 5;
const SHIELD_RECHARGE_COST = 200;
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
  const loadLocalPlayer = usePlayerStore(s => s.loadLocalPlayer);
  const updateShip = usePlayerStore(s => s.updateShip);
  const spendCredits = usePlayerStore(s => s.spendCredits);
  const persist = usePlayerStore(s => s.persist);
  const [tab, setTab] = useState<'status' | 'capital' | 'upgrade' | 'hangar'>('status');

  useFocusEffect(
    React.useCallback(() => {
      void loadLocalPlayer();
    }, [loadLocalPlayer]),
  );
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
  const safeBack = useSafeRouterBack();
  usePlanetSubStageMemory('shipyard', () => {
    setTab('status');
  });
  usePlanetHubFacilityAccessGate('shipyard');
  const stageFrameReady = useStageFirstFrameReady();

  if (!player || !shipFinal) return null;

  const { ship, credits } = player;
  const inventorySlots = player.inventorySlots;
  const finalStats = shipFinal.finalStats;
  const missingHp = finalStats.maxHp - finalStats.hp;
  const repairCost = missingHp * REPAIR_COST_PER_HP;

  const handleRepair = () => {
    if (missingHp <= 0) {
      showArcAlert(t('shipyard.repair.noneTitle'), t('shipyard.repair.noneBody'));
      return;
    }
    showArcAlert(
      t('shipyard.repair.confirmTitle'),
      t('shipyard.repair.confirmBody', { hp: missingHp, cost: formatCredits(repairCost) }),
      [
        { text: t('shipyard.btn.cancel'), style: 'cancel' },
        {
          text: t('shipyard.repair.doConfirm'),
          onPress: async () => {
            if (!spendCredits(repairCost)) {
              showArcAlert(t('shipyard.creditShortTitle'), t('shipyard.creditShortBody'));
              return;
            }
            updateShip({ ...ship, hp: finalStats.maxHp });
            await persist();
            showArcAlert(t('shipyard.repair.doneTitle'), t('shipyard.repair.doneBody'));
          },
        },
      ],
    );
  };

  const handleShieldRecharge = () => {
    if (finalStats.shield >= finalStats.maxShield) {
      showArcAlert(t('shipyard.shield.noneTitle'), t('shipyard.shield.noneBody'));
      return;
    }
    showArcAlert(
      t('shipyard.shield.confirmTitle'),
      t('shipyard.shield.confirmBody', { cost: formatCredits(SHIELD_RECHARGE_COST) }),
      [
        { text: t('shipyard.btn.cancel'), style: 'cancel' },
        {
          text: t('shipyard.shield.doConfirm'),
          onPress: async () => {
            if (!spendCredits(SHIELD_RECHARGE_COST)) {
              showArcAlert(t('shipyard.creditShortTitle'), t('shipyard.creditShortBody'));
              return;
            }
            updateShip({ ...ship, shield: finalStats.maxShield });
            await persist();
          },
        },
      ],
    );
  };
  const handleSelectHangarShip = async (npcCapitalShipId: string) => {
    const applied = applyNpcCapitalShipToPlayerShip(ship, npcCapitalShipId);
    if (!applied.ok) {
      showArcAlert(t('shipyard.select.failTitle'), t('shipyard.select.failBody'));
      return;
    }
    updateShip(applied.ship);
    await persist();
    showArcAlert(t('shipyard.select.doneTitle'), t('shipyard.select.doneBody'));
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
      <View style={styles.shipDisplay}>
        <View style={styles.shipVisualDeck}>
          {showEquipScaffold ? (
            <View style={styles.sideSlotCol}>
              {[1, 2, 3].map((n) => (
                <View key={`left-slot-${n}`} style={styles.sideEquipSlot}>
                  <Text style={styles.sideEquipSlotText}>{`L${n}`}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.shipPortraitWrap}>
            {shipPortraitSource ? (
              <Image
                source={shipPortraitSource}
                style={styles.shipPortrait}
                resizeMode="contain"
                accessibilityLabel={displayShipName}
              />
            ) : (
              <ShipGridPlaceholder cellSize={10} tone="player" />
            )}
          </View>
          {showEquipScaffold ? (
            <View style={styles.sideSlotCol}>
              {[1, 2, 3].map((n) => (
                <View key={`right-slot-${n}`} style={styles.sideEquipSlot}>
                  <Text style={styles.sideEquipSlotText}>{`R${n}`}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {showEquipScaffold ? (
          <View style={styles.shipEquipBottomZone}>
            <View style={styles.bottomEquipSlotRow}>
              {[1, 2, 3, 4].map((n) => (
                <View key={`bottom-slot-${n}`} style={styles.bottomEquipSlot}>
                  <Text style={styles.bottomEquipSlotText}>{`S${n}`}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <Text style={styles.shipName}>{displayShipName}</Text>
        <Text style={styles.shipClass}>{shipSubtitle}</Text>
      </View>

      <View style={styles.statsBox}>
        {/* 임시 개발 기준: 첫 탭 현황은 항상 현재 탑승 전함(player.ship) 기준으로 표시한다. */}
        <Text style={styles.statsTitle}>{t('shipyard.stats.title')}</Text>
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
        <StatRow label={t('shipyard.stats.durability')} value={`${finalStats.maxHp}`} />
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
    <StageShell key={localeRenderKey} routeName="shipyard" background="none" edges={['bottom']}>
      <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <ArcStageBackButton onPress={safeBack} style={styles.backBtn} />
        <Text style={styles.headerTitle}>{t('shipyard.title')}</Text>
        <Text style={styles.creditsText}>{formatCredits(credits)}</Text>
      </View>

      <PlanetFacilityTabBar
        tabs={[
          { id: 'status', label: t('shipyard.tab.status') },
          { id: 'capital', label: t('shipyard.tab.capital') },
          { id: 'upgrade', label: t('shipyard.tab.upgrade') },
          { id: 'hangar', label: t('shipyard.tab.hangar') },
        ]}
        activeId={tab}
        onSelect={(id) => setTab(id as 'status' | 'capital' | 'upgrade' | 'hangar')}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {tab === 'status' && <>{renderShipOverview(false)}</>}
        {tab === 'status' && (
          <View style={styles.serviceBox}>
            <Text style={styles.statsTitle}>{t('shipyard.service.title')}</Text>

            <TouchableOpacity
              style={[styles.serviceBtn, missingHp <= 0 && styles.serviceBtnDisabled]}
              onPress={handleRepair}
            >
              <View style={styles.serviceBtnLeft}>
                <Text style={styles.serviceBtnTitle}>{t('shipyard.repair.btn')}</Text>
                <Text style={styles.serviceBtnSub}>
                  {t('shipyard.repair.sub', { hp: missingHp, cost: formatCredits(repairCost) })}
                </Text>
              </View>
              <Text style={styles.serviceBtnAction}>{t('shipyard.repair.action')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.serviceBtn, finalStats.shield >= finalStats.maxShield && styles.serviceBtnDisabled]}
              onPress={handleShieldRecharge}
            >
              <View style={styles.serviceBtnLeft}>
                <Text style={styles.serviceBtnTitle}>{t('shipyard.shield.btn')}</Text>
                <Text style={styles.serviceBtnSub}>{formatCredits(SHIELD_RECHARGE_COST)}</Text>
              </View>
              <Text style={styles.serviceBtnAction}>{t('shipyard.shield.action')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === 'capital' && (
          <>
            {renderShipOverview(true)}
            <ShipyardEquipSlotsBlock ship={ship} updateShip={updateShip} persist={persist} />
            <ShipyardInventoryGrid player={player} ship={ship} updateShip={updateShip} persist={persist} />
          </>
        )}

        {tab === 'upgrade' && (
          <View style={styles.hangarSection}>
            <ShipyardMineralUpgradeTab />
          </View>
        )}

        {tab === 'hangar' && (
          hangarSorted.length === 0 ? (
            <View style={styles.hangarEmpty}>
              <Text style={styles.hangarEmptyIcon}>🚢</Text>
              <Text style={styles.hangarEmptyTitle}>{t('shipyard.hangar.emptyTitle')}</Text>
              <Text style={styles.hangarEmptySub}>{t('shipyard.hangar.emptySub')}</Text>
            </View>
          ) : (
            <View style={styles.hangarSection}>
              <Text style={styles.hangarHeading}>{t('shipyard.hangar.stored')}</Text>
              <Text style={styles.hangarCurrentLine}>{t('shipyard.hangar.current', { name: displayShipName })}</Text>
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
                return (
                  <View key={entry.id} style={styles.hangarRow}>
                    {thumbSrc ? (
                      <Image
                        source={thumbSrc}
                        style={styles.hangarThumb}
                        resizeMode="contain"
                        accessibilityLabel={hangarShipName}
                      />
                    ) : (
                      <View style={styles.hangarThumbPlaceholder} accessibilityLabel={t('shipyard.hangar.noImage')}>
                        <Text style={styles.hangarThumbPhText}>⋯</Text>
                      </View>
                    )}
                    <View style={styles.hangarMeta}>
                      <Text style={styles.hangarName}>{hangarShipName}</Text>
                      {isSurvivalPodEntry ? (
                        <Text style={styles.hangarCurrentBadge}>{t('shipyard.hangar.badgePod')}</Text>
                      ) : null}
                      {isCurrentShip ? <Text style={styles.hangarCurrentBadge}>{t('shipyard.hangar.badgeCurrent')}</Text> : null}
                      <Text style={styles.hangarSub} numberOfLines={2}>
                        {t('shipyard.hangar.delivered', { date: new Date(entry.acquiredAt).toLocaleString(intlTag()) })}
                      </Text>
                    </View>
                    <View style={styles.hangarActions}>
                      <TouchableOpacity
                        style={[
                          styles.hangarActionBtn,
                          styles.hangarSelectBtn,
                          isSurvivalPodEntry && styles.hangarActionDisabled,
                        ]}
                        onPress={() => {
                          if (isSurvivalPodEntry) return;
                          void handleSelectHangarShip(entry.npcCapitalShipId);
                        }}
                        disabled={isSurvivalPodEntry}
                      >
                        <Text style={styles.hangarActionText}>{t('shipyard.btn.select')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.hangarActionBtn,
                          styles.hangarReleaseBtn,
                          (isSurvivalPodEntry || !isCurrentShip) && styles.hangarActionDisabled,
                        ]}
                        onPress={() => {
                          if (isSurvivalPodEntry || !isCurrentShip) return;
                          void handleReleaseCurrentShip();
                        }}
                        disabled={isSurvivalPodEntry || !isCurrentShip}
                      >
                        <Text style={styles.hangarActionText}>{t('shipyard.btn.release')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )
        )}

        <View style={{ height: SHIPYARD_BOTTOM_STAGE_RESERVE_PX }} />
      </ScrollView>
      <StageLoadingOverlay visible={!stageFrameReady} overlayId="stage-loading-shipyard" />
      </View>
    </StageShell>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

/** 함급 분류·역할 등 긴 설명 — 라벨 아래 최대 2줄 */
function StatDescRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRowStacked}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statStackedValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
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

  const equipWeaponFromInventory = async (itemId: string) => {
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

  return (
    <View style={styles.equipSlotsBox}>
      <Text style={styles.statsTitle}>{t('shipyard.inventory.title')}</Text>
      <Text style={styles.hangarCurrentLine}>{t('shipyard.inventory.slotLine', { slots: PLAYER_INVENTORY_SLOT_COUNT, used })}</Text>
      <View style={styles.inventoryList}>
        {slots.map((cell, i) => {
          const good = cell ? TRADE_GOODS[cell.goodId] : undefined;
          const weaponDef = cell ? resolveWeaponItemDef(cell.goodId) : null;
          const isWeaponModule = Boolean(cell && isWeaponItemId(cell.goodId));
          const isEquipped = Boolean(
            cell
            && COMBAT_WEAPON_SLOT_IDS.some((id) => ship.equipSlots?.[id]?.itemDefId === cell.goodId),
          );
          const itemName = cell
            ? good
              ? resolveItemName(good, locale)
              : weaponDef
                ? resolveEquipSlotDisplayName(cell.goodId, weaponDef.name, locale)
                : cell.goodId
            : t('shipyard.inventory.emptyCell');
          return (
            <View
              key={`inv-${i}`}
              style={[styles.hangarRow, !cell && styles.inventoryRowEmpty]}
              accessibilityLabel={`${i + 1} ${cell ? cell.goodId : ''}`}
            >
              <View style={styles.inventoryThumbPlaceholder}>
                <Text style={styles.inventoryThumbIcon}>{cell ? '📦' : '·'}</Text>
              </View>
              <View style={styles.hangarMeta}>
                <Text style={styles.hangarName} numberOfLines={1}>{itemName}</Text>
                <Text style={styles.hangarSub} numberOfLines={1}>
                  {cell ? t('shipyard.inventory.qty', { qty: cell.quantity, equipped: isEquipped ? t('shipyard.inventory.equippedSuffix') : '' }) : t('shipyard.inventory.emptySlot')}
                </Text>
              </View>
              {cell && isWeaponModule ? (
                <View style={styles.hangarActions}>
                  <TouchableOpacity
                    style={[styles.hangarActionBtn, styles.hangarSelectBtn]}
                    onPress={() => {
                      void equipWeaponFromInventory(cell.goodId);
                    }}
                  >
                    <Text style={styles.hangarActionText}>{t('shipyard.btn.equip')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.hangarActionBtn, styles.hangarReleaseBtn, !isEquipped && styles.hangarActionDisabled]}
                    disabled={!isEquipped}
                    onPress={() => {
                      void unequipWeaponToInventory(cell.goodId);
                    }}
                  >
                    <Text style={styles.hangarActionText}>{t('shipyard.btn.unequip')}</Text>
                  </TouchableOpacity>
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
    <View style={styles.equipSlotsBox}>
      <Text style={styles.statsTitle}>{t('shipyard.equip.title')}</Text>
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
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  creditsText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.gold,
    fontWeight: FONTS.weight.bold,
  },
  scroll: { flex: 1 },

  shipDisplay: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    rowGap: SPACING.sm, columnGap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  shipVisualDeck: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  shipEquipBottomZone: {
    width: '100%',
    maxWidth: 360,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: COLORS.divider,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomEquipSlotText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.ink_light,
    fontWeight: FONTS.weight.bold,
  },
  shipPortraitWrap: {
    flex: 1,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideSlotCol: {
    width: 44,
    rowGap: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideEquipSlot: {
    width: 36,
    height: 28,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: '#4E7AA8',
    backgroundColor: 'rgba(18, 31, 49, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideEquipSlotText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#9FCBFF',
    fontWeight: FONTS.weight.bold,
  },
  shipPortrait: {
    width: 220,
    height: 120,
    marginBottom: SPACING.xs,
  },
  shipName: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  shipClass: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },

  statsBox: {
    margin: SPACING.md,
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: SPACING.md,
  },
  statsTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  survivalPodNotice: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.pvp_zone,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  statRowStacked: {
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
  },
  statStackedValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  serviceBox: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: SPACING.md,
  },
  serviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  serviceBtnDisabled: { opacity: 0.35 },
  serviceBtnLeft: { flex: 1 },
  serviceBtnTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
  },
  serviceBtnSub: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginTop: 2,
  },
  serviceBtnAction: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.safe_zone,
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
    color: COLORS.ink_mid,
    fontWeight: FONTS.weight.bold,
  },
  comingSoonSub: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_light,
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
  hangarEmptyTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
  },
  hangarEmptySub: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_light,
    textAlign: 'center',
  },
  hangarSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  hangarCapLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.gold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  hangarHeading: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  hangarCurrentLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginBottom: SPACING.sm,
  },
  hangarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    columnGap: SPACING.md,
  },
  hangarThumb: {
    width: 104,
    height: 56,
    borderRadius: 2,
    backgroundColor: COLORS.bg_secondary,
  },
  hangarThumbPlaceholder: {
    width: 104,
    height: 56,
    borderRadius: 2,
    backgroundColor: COLORS.bg_secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangarThumbPhText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: COLORS.ink_light,
  },
  hangarMeta: { flex: 1, minWidth: 0 },
  hangarName: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  hangarCurrentBadge: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.safe_zone,
    marginTop: 2,
  },
  hangarSub: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_mid,
    marginTop: 4,
  },
  hangarActions: {
    rowGap: 6,
    marginLeft: SPACING.sm,
  },
  hangarActionBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.bg_secondary,
  },
  hangarSelectBtn: {
    borderColor: COLORS.safe_zone,
  },
  hangarReleaseBtn: {
    borderColor: COLORS.ink_light,
  },
  hangarActionDisabled: {
    opacity: 0.4,
  },
  hangarActionText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
  },

  equipSlotsBox: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: SPACING.md,
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
    color: COLORS.ink_light,
    marginTop: SPACING.xs,
  },
  equipSlotCell: {
    width: '48%',
    minHeight: 76,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg_secondary,
  },
  equipSlotFilled: {
    borderColor: COLORS.safe_zone,
    backgroundColor: 'rgba(80, 200, 120, 0.08)',
  },
  equipSlotLocked: {
    opacity: 0.35,
  },
  equipSlotEmpty: {},
  equipSlotTag: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.ink_light,
  },
  equipSlotItem: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_dark,
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
  inventoryThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 2,
    backgroundColor: COLORS.bg_secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryThumbIcon: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: COLORS.ink_light,
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
    color: COLORS.ink_light,
    flex: 1,
  },
  weaponItemActions: {
    flexDirection: 'row',
    columnGap: 6,
  },
  weaponBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: COLORS.bg_panel,
  },
  weaponBtnActive: {
    borderColor: COLORS.safe_zone,
    backgroundColor: 'rgba(80, 200, 120, 0.1)',
  },
  weaponBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
  },
  inventoryDetailLink: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.safe_zone,
    marginTop: 6,
  },

});
