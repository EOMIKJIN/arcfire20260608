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
import { showArcAlert } from '../../src/utils/showArcAlert';
import { formatCredits } from '../../src/utils/formatCredits';
import { ShipGridPlaceholder } from '../../src/components/ShipGridPlaceholder';
import { usePlayerStore } from '../../src/store/playerStore';
import { SHIP_TEMPLATES } from '../../src/data/ships';
import {
  CAPITAL_WEAPON_LIST_FROM_CSV,
  NPC_CAPITAL_SHIPS_FROM_CSV,
  NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV,
} from '../../src/data/generated';
import { resolveNpcCapitalShipPortraitSource } from '../../src/game/npcCapitalShipPortraitAssets';
import { applyNpcCapitalShipToPlayerShip } from '../../src/game/applyNpcCapitalShipPurchase';
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
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { ArcStageBackButton } from '../../src/ui/overlay/ArcStageBackButton';
import { PlanetFacilityTabBar } from '../../src/ui/planetFacility/PlanetFacilityTabBar';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import { resolveShipFinalStatResult } from '../../src/ship/shipStatPipeline';
import { resolveMineralUpgradeMaxLevel } from '../../src/game/shipyardMineralUpgrade/mineralUpgradeModel';
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
  checkCapitalHullPurchase,
  listCapitalHullPurchasePolicyRows,
  resolveNpcShipIdForHullTier,
} from '../../src/arcCore/balance/capitalHullPurchaseFromBalance';

const REPAIR_COST_PER_HP = 5;
const SHIELD_RECHARGE_COST = 200;
/** 메인스테이지 기준 하단 공백과 동기 */
const SHIPYARD_BOTTOM_STAGE_RESERVE_PX = PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX;
function weaponIdFromSlotItemDef(itemDefId: string | null | undefined): string {
  const raw = String(itemDefId ?? '').trim();
  if (!raw || raw === UNEQUIPPED_WEAPON_ITEM_ID) return '';
  return raw.replace(/^weapon_item_/, '').trim();
}

function formatEquippedWeaponStatValue(
  slot: { itemDefId?: string; name?: string } | null | undefined,
): string {
  const weaponId = weaponIdFromSlotItemDef(slot?.itemDefId);
  if (!weaponId) return 'NULL - DPS NULL';
  const name = resolveEquipSlotDisplayName(slot?.itemDefId, slot?.name);
  const dps = computeCapitalWeaponDps(weaponId);
  const dpsText = dps != null ? `${dps.toFixed(1)}/초` : 'NULL';
  return `${name} - DPS ${dpsText}`;
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
  const player = usePlayerStore(s => s.player);
  const loadLocalPlayer = usePlayerStore(s => s.loadLocalPlayer);
  const updateShip = usePlayerStore(s => s.updateShip);
  const spendCredits = usePlayerStore(s => s.spendCredits);
  const addHangarShipFromNpcPurchase = usePlayerStore(s => s.addHangarShipFromNpcPurchase);
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
  const mineralUpgradeCap = useMemo(
    () => (combatProficiency ? resolveMineralUpgradeMaxLevel(combatProficiency.combatLevel) : 0),
    [combatProficiency],
  );
  const safeBack = useSafeRouterBack();
  usePlanetSubStageMemory('shipyard', () => {
    setTab('status');
  });
  const stageFrameReady = useStageFirstFrameReady();

  if (!player || !shipFinal) return null;

  const { ship, credits } = player;
  const inventorySlots = player.inventorySlots;
  const finalStats = shipFinal.finalStats;
  const missingHp = finalStats.maxHp - finalStats.hp;
  const repairCost = missingHp * REPAIR_COST_PER_HP;

  const handleRepair = () => {
    if (missingHp <= 0) {
      showArcAlert('수리 불필요', '함선이 완전한 상태입니다.');
      return;
    }
    showArcAlert(
      '함선 수리',
      `손상: ${missingHp}HP\n수리 비용: ${formatCredits(repairCost)}`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '수리',
          onPress: async () => {
            if (!spendCredits(repairCost)) {
              showArcAlert('크레딧 부족', '크레딧이 부족합니다.');
              return;
            }
            updateShip({ ...ship, hp: finalStats.maxHp });
            await persist();
            showArcAlert('수리 완료', '함선이 완전히 수리되었습니다.');
          },
        },
      ],
    );
  };

  const handleShieldRecharge = () => {
    if (finalStats.shield >= finalStats.maxShield) {
      showArcAlert('충전 불필요', '실드가 완전한 상태입니다.');
      return;
    }
    showArcAlert(
      '실드 충전',
      `충전 비용: ${formatCredits(SHIELD_RECHARGE_COST)}`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '충전',
          onPress: async () => {
            if (!spendCredits(SHIELD_RECHARGE_COST)) {
              showArcAlert('크레딧 부족', '크레딧이 부족합니다.');
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
      showArcAlert('선택 실패', '전함 전환 데이터를 찾을 수 없습니다.');
      return;
    }
    updateShip(applied.ship);
    await persist();
    showArcAlert('전함 선택', '현재 운항 전함으로 설정했습니다.');
  };

  const handlePurchaseHullTier = async (hullTierKey: string) => {
    const row = listCapitalHullPurchasePolicyRows().find((r) => r.hullTierKey === hullTierKey);
    if (!row) return;
    const price = Number(row.purchaseCredits) || 0;
    const check = checkCapitalHullPurchase(hullTierKey, player.level, credits);
    if (!check.ok) {
      showArcAlert('구매 불가', check.reasonKo ?? '조건을 충족하지 못했습니다.');
      return;
    }
    const npcShipId = resolveNpcShipIdForHullTier(hullTierKey);
    if (!npcShipId) {
      showArcAlert('구매 불가', '해당 등급 전함 데이터가 없습니다.');
      return;
    }
    showArcAlert(
      '함선 구매',
      `${row.labelKo}\n가격: ${formatCredits(price)}`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매',
          onPress: async () => {
            if (price > 0 && !spendCredits(price)) {
              showArcAlert('크레딧 부족', '크레딧이 부족합니다.');
              return;
            }
            if (!addHangarShipFromNpcPurchase(npcShipId)) {
              showArcAlert('격납고 가득참', '격납고 슬롯이 부족합니다.');
              return;
            }
            const applied = applyNpcCapitalShipToPlayerShip(ship, npcShipId);
            if (applied.ok) updateShip(applied.ship);
            await persist();
            showArcAlert('구매 완료', `${row.labelKo}이(가) 격납고에 인도되었습니다.`);
          },
        },
      ],
    );
  };

  const handleReleaseCurrentShip = async () => {
    const baseTemplate = SHIP_TEMPLATES[player.shipId];
    if (!baseTemplate) {
      showArcAlert('해제 실패', '기본 전함 템플릿을 찾을 수 없습니다.');
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
    showArcAlert('전함 해제', '기본 운항 전함으로 전환했습니다.');
  };

  const template = SHIP_TEMPLATES[ship.templateId];
  const portraitNpcId = ship.portraitNpcCapitalShipId ?? template?.portraitNpcCapitalShipId;
  const portraitRow = portraitNpcId
    ? NPC_CAPITAL_SHIPS_FROM_CSV.find((s) => s.id === portraitNpcId)
    : undefined;
  const combatStats = portraitRow?.combat;
  const strStat = combatStats?.strStat ?? 14;
  const dexStat = combatStats?.dexStat ?? 14;
  const sizeClass = combatStats?.sizeClass ?? 0;
  const totalWeaponDamage = sumEquippedWeaponTableDamage(ship.equipSlots);
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
                accessibilityLabel={`${ship.name} 함선 이미지`}
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
        <Text style={styles.shipName}>{ship.name}</Text>
        <Text style={styles.shipClass}>{template?.description ?? ''}</Text>
      </View>

      <View style={styles.statsBox}>
        {/* 임시 개발 기준: 첫 탭 현황은 항상 현재 탑승 전함(player.ship) 기준으로 표시한다. */}
        <Text style={styles.statsTitle}>— [현재탑승전함] 함선 제원 —</Text>
        <StatRow label="함선명" value={ship.name} />
        {combatProficiency ? (
          <>
            <StatRow label="전투 등급" value={`Lv.${combatProficiency.combatLevel}`} />
            <StatRow label="운용 효율" value={`${combatProficiency.operatingEfficiencyPct}%`} />
            <StatRow
              label="숙련 계수"
              value={`×${combatProficiency.proficiencyMultiplier.toFixed(3)}`}
            />
          </>
        ) : null}
        <StatRow label="내구도" value={`${finalStats.maxHp}`} />
        <StatRow label="실드" value={`${finalStats.maxShield}`} />
        <StatRow label="속도" value={`${finalStats.speed}`} />

        <StatRow label="출력(STR)" value={`${strStat}`} />
        <StatRow label="기동력(DEX)" value={`${dexStat}`} />
        <StatRow label="중량(SIZE)" value={`${sizeClass}`} />
        <StatRow label="명중 보너스" value={`${combatStats?.attackBonus ?? 0}`} />
        <StatRow label="공격력" value={`${totalWeaponDamage}`} />
        <StatRow label="장착무기1" value={weaponStatLines.WEAPON_1} />
        <StatRow label="장착무기2" value={weaponStatLines.WEAPON_2} />
        <StatRow label="장착무기3" value={weaponStatLines.WEAPON_3} />
        <StatRow label="장착무기4" value={weaponStatLines.WEAPON_4} />
        <StatRow label="인벤토리" value={`${inventorySlots.length}`} />
      </View>

    </>
  );

  return (
    <StageShell routeName="shipyard" background="none" edges={['bottom']}>
      <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <ArcStageBackButton onPress={safeBack} style={styles.backBtn} />
        <Text style={styles.headerTitle}>조선소</Text>
        <Text style={styles.creditsText}>{formatCredits(credits)}</Text>
      </View>

      <PlanetFacilityTabBar
        tabs={[
          { id: 'status', label: '현황' },
          { id: 'capital', label: '전함' },
          { id: 'upgrade', label: '업그레이드' },
          { id: 'hangar', label: '격납고' },
        ]}
        activeId={tab}
        onSelect={(id) => setTab(id as 'status' | 'capital' | 'upgrade' | 'hangar')}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {tab === 'status' && <>{renderShipOverview(false)}</>}
        {tab === 'status' && (
          <View style={styles.serviceBox}>
            <Text style={styles.statsTitle}>— 정비 서비스 —</Text>

            <TouchableOpacity
              style={[styles.serviceBtn, missingHp <= 0 && styles.serviceBtnDisabled]}
              onPress={handleRepair}
            >
              <View style={styles.serviceBtnLeft}>
                <Text style={styles.serviceBtnTitle}>🔧 선체 수리</Text>
                <Text style={styles.serviceBtnSub}>
                  손상: {missingHp}HP → {formatCredits(repairCost)}
                </Text>
              </View>
              <Text style={styles.serviceBtnAction}>[ 수리 ]</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.serviceBtn, finalStats.shield >= finalStats.maxShield && styles.serviceBtnDisabled]}
              onPress={handleShieldRecharge}
            >
              <View style={styles.serviceBtnLeft}>
                <Text style={styles.serviceBtnTitle}>⚡ 실드 충전</Text>
                <Text style={styles.serviceBtnSub}>{formatCredits(SHIELD_RECHARGE_COST)}</Text>
              </View>
              <Text style={styles.serviceBtnAction}>[ 충전 ]</Text>
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
            <Text style={styles.hangarCapLine}>
              전투 Lv.{combatProficiency?.combatLevel ?? 1} · 상한 Lv.{mineralUpgradeCap}
            </Text>
            <Text style={styles.hangarHeading}>— 함선 체급 구매 —</Text>
            <Text style={styles.hangarEmptySub}>
              `capital_hull_purchase_policy.csv` 기준 · 파일럿 Lv·크레딧 충족 시 구매
            </Text>
            {listCapitalHullPurchasePolicyRows()
              .filter((row) => row.hullTierKey !== 'frigate_default')
              .map((row) => {
                const price = Number(row.purchaseCredits) || 0;
                const minLv = Number(row.requiredPilotLevelMin) || 1;
                const canBuy = checkCapitalHullPurchase(row.hullTierKey, player.level, credits).ok;
                return (
                  <TouchableOpacity
                    key={row.hullTierKey}
                    style={[styles.hangarRow, !canBuy && styles.serviceBtnDisabled]}
                    onPress={() => void handlePurchaseHullTier(row.hullTierKey)}
                    disabled={!canBuy}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceBtnTitle}>{row.labelKo}</Text>
                      <Text style={styles.serviceBtnSub}>
                        Lv.{minLv}+ · {formatCredits(price)}
                      </Text>
                    </View>
                    <Text style={styles.serviceBtnAction}>{canBuy ? '[ 구매 ]' : '[ 잠김 ]'}</Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        )}

        {tab === 'hangar' && (
          hangarSorted.length === 0 ? (
            <View style={styles.hangarEmpty}>
              <Text style={styles.hangarEmptyIcon}>🚢</Text>
              <Text style={styles.hangarEmptyTitle}>격납고가 비어 있습니다</Text>
              <Text style={styles.hangarEmptySub}>무역소에서 전함을 구매하면 이곳에 인도됩니다.</Text>
            </View>
          ) : (
            <View style={styles.hangarSection}>
              <Text style={styles.hangarHeading}>— 보관 중인 전함 —</Text>
              <Text style={styles.hangarCurrentLine}>[현재탑승전함] {ship.name}</Text>
              {hangarSorted.map(entry => {
                const row = NPC_CAPITAL_SHIPS_FROM_CSV.find(s => s.id === entry.npcCapitalShipId);
                const thumbSrc = row?.portraitImageAssetKey
                  ? resolveNpcCapitalShipPortraitSource(row.portraitImageAssetKey)
                  : undefined;
                const isCurrentShip = ship.portraitNpcCapitalShipId === entry.npcCapitalShipId;
                return (
                  <View key={entry.id} style={styles.hangarRow}>
                    {thumbSrc ? (
                      <Image
                        source={thumbSrc}
                        style={styles.hangarThumb}
                        resizeMode="contain"
                        accessibilityLabel={`${row?.name ?? entry.npcCapitalShipId} 썸네일`}
                      />
                    ) : (
                      <View style={styles.hangarThumbPlaceholder} accessibilityLabel="이미지 없음">
                        <Text style={styles.hangarThumbPhText}>⋯</Text>
                      </View>
                    )}
                    <View style={styles.hangarMeta}>
                      <Text style={styles.hangarName}>{row?.name ?? entry.npcCapitalShipId}</Text>
                      {isCurrentShip ? <Text style={styles.hangarCurrentBadge}>[현재탑승전함]</Text> : null}
                      <Text style={styles.hangarSub} numberOfLines={2}>
                        인도 {new Date(entry.acquiredAt).toLocaleString('ko-KR')}
                      </Text>
                    </View>
                    <View style={styles.hangarActions}>
                      <TouchableOpacity
                        style={[styles.hangarActionBtn, styles.hangarSelectBtn]}
                        onPress={() => {
                          void handleSelectHangarShip(entry.npcCapitalShipId);
                        }}
                      >
                        <Text style={styles.hangarActionText}>[선택]</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.hangarActionBtn, styles.hangarReleaseBtn, !isCurrentShip && styles.hangarActionDisabled]}
                        onPress={() => {
                          void handleReleaseCurrentShip();
                        }}
                        disabled={!isCurrentShip}
                      >
                        <Text style={styles.hangarActionText}>[해제]</Text>
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
    const weaponId = weaponIdFromWeaponItemId(itemId);
    if (!weaponId) return;
    const row = CAPITAL_WEAPON_LIST_FROM_CSV[weaponId];
    const weapon = ship.weapons.find((w) => w.id === weaponId)
      ?? (row ? buildWeaponDataFromCapitalRow(row) : null);
    if (!weapon) {
      showArcAlert('장착 실패', '무기 테이블 데이터를 찾을 수 없습니다.');
      return;
    }
    const slotId = resolveCombatWeaponSlotForWeaponId(weaponId);
    if (!slotId) {
      showArcAlert('장착 실패', '이 무기는 장착 슬롯을 결정할 수 없습니다.');
      return;
    }
    const nextSlots = { ...(ship.equipSlots ?? {}) };
    nextSlots[slotId] = {
      itemDefId: itemId,
      name: resolveEquipSlotDisplayName(itemId, row?.name ?? weapon.name),
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
    nextSlots[slotId] = { itemDefId: UNEQUIPPED_WEAPON_ITEM_ID, name: '미장착' };
    const nextWeapons = rebuildWeaponsFromSlots(nextSlots);
    updateShip({ ...ship, equipSlots: nextSlots, weapons: nextWeapons });
    await persist();
  };

  return (
    <View style={styles.equipSlotsBox}>
      <Text style={styles.statsTitle}>— 인벤토리 —</Text>
      <Text style={styles.hangarCurrentLine}>슬롯 {PLAYER_INVENTORY_SLOT_COUNT} · 사용 {used}</Text>
      <View style={styles.inventoryList}>
        {slots.map((cell, i) => {
          const good = cell ? TRADE_GOODS[cell.goodId] : undefined;
          const weaponDef = cell ? resolveWeaponItemDef(cell.goodId) : null;
          const isWeaponModule = Boolean(cell && isWeaponItemId(cell.goodId));
          const isEquipped = Boolean(
            cell
            && COMBAT_WEAPON_SLOT_IDS.some((id) => ship.equipSlots?.[id]?.itemDefId === cell.goodId),
          );
          const itemName = cell ? (good?.name ?? weaponDef?.name ?? cell.goodId) : '— 빈 슬롯 —';
          return (
            <View
              key={`inv-${i}`}
              style={[styles.hangarRow, !cell && styles.inventoryRowEmpty]}
              accessibilityLabel={cell ? `인벤 슬롯 ${i + 1} ${cell.goodId}` : `인벤 슬롯 ${i + 1} 빈칸`}
            >
              <View style={styles.inventoryThumbPlaceholder} accessibilityLabel="아이템 아이콘">
                <Text style={styles.inventoryThumbIcon}>{cell ? '📦' : '·'}</Text>
              </View>
              <View style={styles.hangarMeta}>
                <Text style={styles.hangarName} numberOfLines={1}>{itemName}</Text>
                <Text style={styles.hangarSub} numberOfLines={1}>
                  {cell ? `수량 ${cell.quantity}${isEquipped ? ' · 장착중' : ''}` : '빈 슬롯'}
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
                    <Text style={styles.hangarActionText}>[장착]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.hangarActionBtn, styles.hangarReleaseBtn, !isEquipped && styles.hangarActionDisabled]}
                    disabled={!isEquipped}
                    onPress={() => {
                      void unequipWeaponToInventory(cell.goodId);
                    }}
                  >
                    <Text style={styles.hangarActionText}>[해제]</Text>
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
      showArcAlert('잠금 슬롯', `이 함선의 장착 허용량은 ${equipCapacity}칸입니다.`);
      return;
    }
    const cur = map[slotId] ?? null;
    if (isEquipSlotFilled(cur)) {
      const displayName = resolveEquipSlotDisplayName(cur!.itemDefId, cur!.name);
      showArcAlert(`[${order}.${slotId}]`, `${displayName}\n\n슬롯에서 해제할까요?`, [
        { text: '닫기', style: 'cancel' },
        {
          text: '해제',
          onPress: async () => {
            const nextSlots = { ...map };
            if (isCombatWeaponEquipSlot(slotId)) {
              nextSlots[slotId] = { itemDefId: UNEQUIPPED_WEAPON_ITEM_ID, name: '미장착' };
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
    showArcAlert(`[${order}.${slotId}]`, '비어 있는 슬롯입니다. 인벤토리에서 아이템을 선택해 장착하세요.', [
      { text: '닫기', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.equipSlotsBox}>
      <Text style={styles.statsTitle}>— 장비 및 아이템 장착 슬롯 —</Text>
      <Text style={styles.equipCapacityLine}>장착 허용량: {equipCapacity}칸</Text>
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
              accessibilityLabel={`슬롯 ${order} ${id}`}
            >
              <Text style={styles.equipSlotTag}>{`[${order}.${id}]`}</Text>
              <Text style={styles.equipSlotItem} numberOfLines={2}>
                {locked
                  ? '— 잠금 —'
                  : filled
                    ? resolveEquipSlotDisplayName(cur!.itemDefId, cur!.name)
                    : '— 빈 슬롯 —'}
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
