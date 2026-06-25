// ============================================================
// 조선소 > 현황 탭 — 광물 기반 전함 강화 (G-ARCHIVE infoPanel · stackCard)
// ============================================================
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../../store/playerStore';
import { countGoodInInventory, normalizeInventorySlots } from '../../game/playerInventory';
import { normalizePlayerCombatProficiency } from '../../combat/playerCombatProficiency';
import {
  getMineralUpgradeOreCost,
  getFinalMineralUpgradeCap,
  listMineralUpgradeStats,
  resolveMineralUpgradeMaxLevel,
  type MineralUpgradeGroup,
} from '../../game/shipyardMineralUpgrade/mineralUpgradeModel';
import { resolvePlanetShipyardLevelForMineralCap } from '../../game/planetDevelopment/planetOrbitShipyardMineralCap';
import { showArcAlert } from '../../utils/showArcAlert';
import { useT } from '../../i18n';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_FACILITY as TF } from '../../ui/tactical/tacticalFacilityScreenTokens';
import { planetFacilityScreenStyles as fs, PlanetFacilityCardTitleBlock } from '../../ui/planetFacility/PlanetFacilityTitleHeader';
import { ArcButton } from '../../ui/overlay/ArcButton';

export const ShipyardMineralUpgradeTab = memo(function ShipyardMineralUpgradeTab() {
  const t = useT();
  const player = usePlayerStore((s) => s.player);
  const applyMineralUpgrade = usePlayerStore((s) => s.applyMineralUpgrade);

  const combatProficiency = useMemo(
    () => (player ? normalizePlayerCombatProficiency(player.combatProficiency, player.level) : null),
    [player],
  );
  const shipyardLevel = useMemo(
    () => (player?.currentPlanetId ? resolvePlanetShipyardLevelForMineralCap(player.currentPlanetId) : 0),
    [player?.currentPlanetId],
  );
  const combatCap = combatProficiency ? resolveMineralUpgradeMaxLevel(combatProficiency.combatLevel) : 0;
  const cap = combatProficiency ? getFinalMineralUpgradeCap(combatProficiency.combatLevel, shipyardLevel) : 0;
  const slots = useMemo(() => normalizeInventorySlots(player?.inventorySlots), [player?.inventorySlots]);
  const upgrades = player?.mineralUpgrades ?? {};

  if (!player) return null;

  const stats = listMineralUpgradeStats();
  const groups = Array.from(new Set(stats.map((s) => s.upgradeGroup))) as MineralUpgradeGroup[];

  const handleUpgrade = (statId: string) => {
    const res = applyMineralUpgrade(statId, shipyardLevel);
    if (!res.ok) {
      const reasonKey = `shipyard.up.fail.${res.reason ?? 'default'}`;
      const reasonText = res.reason ? t(reasonKey) : t('shipyard.up.fail.default');
      showArcAlert(t('shipyard.up.failTitle'), reasonText);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={fs.sectionMeta}>
        {t('shipyard.up.capLine', {
          lv: combatProficiency?.combatLevel ?? 1,
          cap,
          shipyardLv: shipyardLevel,
          combatCap,
        })}
      </Text>
      <Text style={[fs.sectionMeta, styles.introGap]}>{t('shipyard.up.intro')}</Text>

      {groups.map((group) => (
        <View key={group} style={fs.stackCard}>
          <Text style={[fs.sectionBar, fs.sectionBarFirst]}>
            {t(`shipyard.up.group.${group}`)}
          </Text>
          {stats
            .filter((s) => s.upgradeGroup === group)
            .map((stat, statIdx) => {
              const lv = Math.max(0, Math.floor(upgrades[stat.statId] ?? 0));
              const atCap = lv >= cap;
              const nextLv = lv + 1;
              const cost = atCap ? [] : getMineralUpgradeOreCost(stat.statId, nextLv);
              const affordable = !atCap && cost.every((c) => countGoodInInventory(slots, c.oreId) >= c.qty);

              return (
                <View key={stat.statId} style={[styles.statRow, statIdx === 0 && styles.statRowFirst]}>
                  <PlanetFacilityCardTitleBlock
                    title={t(`mineralStat.label.${stat.statId}`)}
                    meta={
                      <>
                        {lv > 0 ? t('shipyard.up.level', { lv }) : t('shipyard.up.unupgraded')}
                        {atCap ? t('shipyard.up.maxSuffix') : ''}
                      </>
                    }
                    metaStyle={lv > 0 ? styles.levelOn : undefined}
                    description={
                      <>
                        {t(`mineralStat.hint.${stat.statId}`)}
                        {atCap ? '' : t('shipyard.up.nextHint', { lv, next: nextLv })}
                      </>
                    }
                    descriptionLines={0}
                  >
                    {!atCap ? (
                      <View style={styles.costRow}>
                        {cost.map((c) => {
                          const own = countGoodInInventory(slots, c.oreId);
                          const ok = own >= c.qty;
                          return (
                            <View
                              key={c.oreId}
                              style={[fs.insetSlot, styles.costChip, !ok && styles.costChipBad]}
                            >
                              <Text style={[styles.costChipText, ok ? styles.costOk : styles.costBad]}>
                                {t('shipyard.up.cost', {
                                  ore: t(`shipyard.up.ore.${c.oreId}`),
                                  own,
                                  qty: c.qty,
                                  mark: ok ? ' ✓' : ' ✗',
                                })}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}

                    <ArcButton
                      label={
                        atCap
                          ? t('shipyard.up.btnMax')
                          : affordable
                            ? t('shipyard.up.btnDo', { lv, next: nextLv })
                            : t('shipyard.up.btnPoor')
                      }
                      variant={affordable && !atCap ? 'tacticalPrimary' : 'tacticalSecondary'}
                      disabled={atCap || !affordable}
                      onPress={() => handleUpgrade(stat.statId)}
                      style={styles.upgBtn}
                    />
                  </PlanetFacilityCardTitleBlock>
                </View>
              );
            })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { paddingBottom: SPACING.xs },
  introGap: { marginBottom: SPACING.sm },
  statRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TF.divider,
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statRowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
    marginTop: 0,
  },
  levelOn: { color: TF.goldInk, fontWeight: FONTS.weight.bold },
  costRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  costChip: {
    marginBottom: 0,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  costChipBad: {
    borderColor: TF.danger,
  },
  costChipText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
  },
  costOk: { color: TF.safeInk },
  costBad: { color: TF.danger },
  upgBtn: {
    alignSelf: 'stretch',
    minHeight: 36,
    marginTop: SPACING.xs,
  },
});
