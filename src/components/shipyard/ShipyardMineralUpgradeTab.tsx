// ============================================================
// 조선소 > 현황 탭 — 광물 기반 전함 강화 (G-ARCHIVE infoPanel · stackCard)
// ============================================================
import React, { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../../store/playerStore';
import { countGoodInInventory, normalizeInventorySlots } from '../../game/playerInventory';
import { normalizePlayerCombatProficiency } from '../../combat/playerCombatProficiency';
import {
  getHullUpgradeTier,
  getMineralUpgradeCost,
  getFinalMineralUpgradeCap,
  listMineralUpgradeStats,
  resolveMineralUpgradeMaxLevel,
  resolveMineralUpgradeJobProgressPct,
  type MineralUpgradeGroup,
} from '../../game/shipyardMineralUpgrade/mineralUpgradeModel';
import {
  getActiveShipMineralUpgradeJobs,
  getActiveShipMineralUpgrades,
} from '../../game/shipyardMineralUpgrade/shipMineralUpgradeState';
import { findHullTierKeyForListedShip } from '../../arcCore/balance/capitalShipTradeListingPolicy';
import { PLANET_DEV_ACTIVE_JOB_UI_POLL_MS } from '../../game/planetDevelopment/planetDevUiPollPolicy';
import { resolvePlanetShipyardLevelForMineralCap } from '../../game/planetDevelopment/planetOrbitShipyardMineralCap';
import { showArcAlert } from '../../utils/showArcAlert';
import { useT } from '../../i18n';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_FACILITY as TF } from '../../ui/tactical/tacticalFacilityScreenTokens';
import { planetFacilityScreenStyles as fs, PlanetFacilityCardTitleBlock } from '../../ui/planetFacility/PlanetFacilityTitleHeader';
import { ArcButton } from '../../ui/overlay/ArcButton';
import { PlanetHubDigitalGauge } from '../planet/PlanetHubActionGaugeSlot';

/** 등급별 레벨당 효과(%) 문구 값 */
function hintPct(kind: string, tier: ReturnType<typeof getHullUpgradeTier>): string {
  if (!tier) return '0';
  const pct = kind === 'ship_hp_pct' ? tier.hpPctPerLevel
    : kind === 'ship_shield_pct' ? tier.shieldPctPerLevel
      : kind === 'weapon_damage_pct' ? tier.damagePctPerLevel
        : kind === 'ship_turn_rate_mul_per_level' ? tier.turnPctPerLevel
          : kind === 'weapon_fire_rate_cooldown' ? 1 - tier.fireRateCooldownMulPerLevel
            : 0;
  return (pct * 100).toFixed(1);
}

export const ShipyardMineralUpgradeTab = memo(function ShipyardMineralUpgradeTab() {
  const t = useT();
  const player = usePlayerStore((s) => s.player);
  const applyMineralUpgrade = usePlayerStore((s) => s.applyMineralUpgrade);
  const settleMineralUpgradeJobs = usePlayerStore((s) => s.settleMineralUpgradeJobs);
  const [, setNowTick] = useState(0);

  // 강화는 탑승 함선 전용(함선별 저장 · 다른 함선으로 넘기지 않음)
  const jobs = getActiveShipMineralUpgradeJobs(player);
  const hasActiveJob = !!jobs && Object.keys(jobs).length > 0;

  // 활성 강화 job이 있을 때만 폴링(게이지 진행·완료 정산). 주기는 행성개발과 동일(2s).
  useEffect(() => {
    // 진입 시 만료된 job 즉시 정산(이탈 중 완료분 반영)
    settleMineralUpgradeJobs();
    if (!hasActiveJob) return;
    const id = setInterval(() => {
      const changed = settleMineralUpgradeJobs();
      // 완료 정산이 없으면 게이지 진행만 갱신(리렌더 트리거)
      if (!changed) setNowTick((n) => (n + 1) % 1_000_000);
    }, PLANET_DEV_ACTIVE_JOB_UI_POLL_MS);
    return () => clearInterval(id);
  }, [hasActiveJob, settleMineralUpgradeJobs]);

  const combatProficiency = useMemo(
    () => (player ? normalizePlayerCombatProficiency(player.combatProficiency, player.level) : null),
    [player],
  );
  const shipyardLevel = useMemo(
    () => (player?.currentPlanetId ? resolvePlanetShipyardLevelForMineralCap(player.currentPlanetId) : 0),
    [player?.currentPlanetId],
  );
  const combatCap = combatProficiency ? resolveMineralUpgradeMaxLevel(combatProficiency.combatLevel) : 0;
  // 함선 등급별 상한·효과·비용(hull_upgrade_tier_policy · hull_upgrade_cost)
  const hullTierKey = findHullTierKeyForListedShip(player?.ship?.portraitNpcCapitalShipId);
  const tier = getHullUpgradeTier(hullTierKey);
  const cap = combatProficiency ? getFinalMineralUpgradeCap(combatProficiency.combatLevel, shipyardLevel, hullTierKey) : 0;
  const slots = useMemo(() => normalizeInventorySlots(player?.inventorySlots), [player?.inventorySlots]);
  const upgrades = getActiveShipMineralUpgrades(player) ?? {};

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
      <Text style={fs.sectionMeta}>{t('shipyard.up.perShipNote', { ship: player.ship.name })}</Text>

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
              const cost = atCap ? null : getMineralUpgradeCost(hullTierKey, stat.statId, nextLv);
              const ores = cost?.ores ?? [];
              const creditsOk = (cost?.credits ?? 0) <= player.credits;
              const affordable = !atCap && cost != null && creditsOk && ores.every((c) => countGoodInInventory(slots, c.oreId) >= c.qty);
              const job = jobs?.[stat.statId];
              const upgrading = !!job;
              const jobProgressPct = upgrading ? resolveMineralUpgradeJobProgressPct(job) : 0;

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
                        {t(`mineralStat.hint.${stat.statId}`, { pct: hintPct(stat.effectKind, tier) })}
                        {atCap ? '' : t('shipyard.up.nextHint', { lv, next: nextLv })}
                      </>
                    }
                    descriptionLines={0}
                  >
                    {!atCap && !upgrading ? (
                      <View style={styles.costRow}>
                        {cost && cost.credits > 0 ? (
                          <View style={[fs.insetSlot, styles.costChip, !creditsOk && styles.costChipBad]}>
                            <Text style={[styles.costChipText, creditsOk ? styles.costOk : styles.costBad]}>
                              {t('shipyard.up.costCredits', { credits: cost.credits.toLocaleString(), mark: creditsOk ? ' ✓' : ' ✗' })}
                            </Text>
                          </View>
                        ) : null}
                        {ores.map((c) => {
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

                    {upgrading ? (
                      <View style={styles.gaugeRow}>
                        <PlanetHubDigitalGauge
                          progressPct={jobProgressPct}
                          accessibilityLabel={t('shipyard.up.upgradingLabel', { next: job!.targetLevel })}
                        />
                      </View>
                    ) : null}

                    <ArcButton
                      label={
                        atCap
                          ? t('shipyard.up.btnMax')
                          : upgrading
                            ? t('shipyard.up.btnUpgrading', { next: job!.targetLevel })
                            : affordable
                              ? t('shipyard.up.btnDo', { lv, next: nextLv })
                              : t('shipyard.up.btnPoor')
                      }
                      variant={affordable && !atCap && !upgrading ? 'tacticalPrimary' : 'tacticalSecondary'}
                      disabled={atCap || upgrading || !affordable}
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
  gaugeRow: {
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
