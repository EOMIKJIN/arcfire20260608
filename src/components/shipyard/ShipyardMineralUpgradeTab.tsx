// ============================================================
// 조선소 > 업그레이드 탭 — 광물 기반 전함 강화 (기존 테이블 정본 + 기획안 v1 참고)
// 정본: src/game/shipyardMineralUpgrade/mineralUpgradeModel.ts
// 스탯 적용: ShipPerformanceCalculator.applyMineralUpgradeToShipPerformance (플레이어 전투 반영)
// 소비: usePlayerStore.applyMineralUpgrade (ore 차감·레벨+1·저장)
// ============================================================
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { COLORS, FONTS, SPACING } from '../../utils/theme';

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
      <Text style={styles.capLine}>
        {t('shipyard.up.capLine', {
          lv: combatProficiency?.combatLevel ?? 1,
          cap,
          shipyardLv: shipyardLevel,
          combatCap,
        })}
      </Text>
      <Text style={styles.intro}>{t('shipyard.up.intro')}</Text>

      {groups.map((group) => (
        <View key={group} style={styles.groupBox}>
          <Text style={styles.groupTitle}>— {t(`shipyard.up.group.${group}`)} —</Text>
          {stats
            .filter((s) => s.upgradeGroup === group)
            .map((stat) => {
              const lv = Math.max(0, Math.floor(upgrades[stat.statId] ?? 0));
              const atCap = lv >= cap;
              const nextLv = lv + 1;
              const cost = atCap ? [] : getMineralUpgradeOreCost(stat.statId, nextLv);
              const affordable = !atCap && cost.every((c) => countGoodInInventory(slots, c.oreId) >= c.qty);

              return (
                <View key={stat.statId} style={styles.statRow}>
                  <View style={styles.statHead}>
                    <Text style={styles.statLabel}>{t(`mineralStat.label.${stat.statId}`)}</Text>
                    <Text style={[styles.statLevel, lv > 0 && styles.statLevelOn]}>
                      {lv > 0 ? t('shipyard.up.level', { lv }) : t('shipyard.up.unupgraded')}{atCap ? t('shipyard.up.maxSuffix') : ''}
                    </Text>
                  </View>
                  <Text style={styles.statHint}>
                    {t(`mineralStat.hint.${stat.statId}`)}{atCap ? '' : t('shipyard.up.nextHint', { lv, next: nextLv })}
                  </Text>

                  {!atCap ? (
                    <View style={styles.costRow}>
                      {cost.map((c) => {
                        const own = countGoodInInventory(slots, c.oreId);
                        const ok = own >= c.qty;
                        return (
                          <Text
                            key={c.oreId}
                            style={[styles.costChip, ok ? styles.costOk : styles.costBad]}
                          >
                            {t('shipyard.up.cost', { ore: t(`shipyard.up.ore.${c.oreId}`), own, qty: c.qty, mark: ok ? ' ✓' : ' ✗' })}
                          </Text>
                        );
                      })}
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.upgBtn, (atCap || !affordable) && styles.upgBtnDisabled]}
                    onPress={() => handleUpgrade(stat.statId)}
                    disabled={atCap || !affordable}
                  >
                    <Text style={[styles.upgBtnText, (atCap || !affordable) && styles.upgBtnTextDisabled]}>
                      {atCap
                        ? t('shipyard.up.btnMax')
                        : affordable
                          ? t('shipyard.up.btnDo', { lv, next: nextLv })
                          : t('shipyard.up.btnPoor')}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { paddingBottom: SPACING.lg },
  capLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.gold,
    marginBottom: SPACING.xs,
  },
  intro: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginBottom: SPACING.md,
  },
  groupBox: {
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: SPACING.sm,
    backgroundColor: COLORS.bg_secondary,
  },
  groupTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_light,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  statRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  statHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontFamily: FONTS.mono, fontSize: FONTS.size.md, color: COLORS.ink_dark },
  statLevel: { fontFamily: FONTS.mono, fontSize: FONTS.size.sm, color: COLORS.ink_light },
  statLevelOn: { color: COLORS.gold, fontWeight: FONTS.weight.bold },
  statHint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginTop: 2,
  },
  costRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.xs },
  costChip: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  costOk: { color: '#9AE6B4', backgroundColor: 'rgba(72,187,120,0.14)' },
  costBad: { color: COLORS.danger, backgroundColor: 'rgba(227,107,107,0.14)' },
  upgBtn: {
    marginTop: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border_dark,
    backgroundColor: COLORS.bg_panel,
    borderRadius: 4,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  upgBtnDisabled: { opacity: 0.5 },
  upgBtnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  upgBtnTextDisabled: { color: COLORS.ink_light },
});
