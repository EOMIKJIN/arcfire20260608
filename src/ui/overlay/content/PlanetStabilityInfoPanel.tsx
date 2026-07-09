import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useT } from '../../../i18n';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import type { PlanetStabilityDisplay } from '../../../world/planetStabilityModel';
import {
  PLANET_STABILITY_TIER_INACTIVE_OPACITY,
  PLANET_STABILITY_TIER_ORDER,
  PLANET_STABILITY_TIER_VISUALS,
  resolvePlanetStabilityTierColor,
  resolvePlanetStabilityTierFillPct,
  resolvePlanetStabilityTierIndex,
} from '../../../world/planetStabilityModel';
import { TACTICAL_OVERLAY } from '../tacticalOverlayStyles';

const SEGMENTS_PER_CELL = 4;

type Props = {
  stability: PlanetStabilityDisplay;
  visualTheme?: 'default' | 'tactical';
};

export const PlanetStabilityInfoPanel = memo(function PlanetStabilityInfoPanel({
  stability,
  visualTheme = 'default',
}: Props) {
  const t = useT();
  const isTactical = visualTheme === 'tactical';
  const activeIndex = resolvePlanetStabilityTierIndex(stability.tier);

  const headerLabelColor = isTactical ? TACTICAL_OVERLAY.labelInk : OVERLAY_TOKENS.phosphorAccent;
  const wdiColor = isTactical ? TACTICAL_OVERLAY.valueInk : OVERLAY_TOKENS.valueContentColor;
  const heldNoteColor = isTactical ? TACTICAL_OVERLAY.labelInk : 'rgba(110, 128, 160, 0.92)';
  /** tier 라벨 — tier 색상 없이 오버레이 본문 잉크; 비활성은 투명도만 구분 */
  const tierLabelInk = isTactical ? TACTICAL_OVERLAY.labelInk : 'rgba(110, 128, 160, 0.92)';
  const tierLabelActiveInk = isTactical ? TACTICAL_OVERLAY.valueInk : OVERLAY_TOKENS.valueContentColor;

  const cells = useMemo(
    () =>
      PLANET_STABILITY_TIER_ORDER.map((tierKey, index) => {
        const visual = PLANET_STABILITY_TIER_VISUALS[tierKey];
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        const fillPct = isActive
          ? resolvePlanetStabilityTierFillPct(stability.wdi, tierKey)
          : isPast
            ? 100
            : 0;
        const litCount = Math.round((fillPct / 100) * SEGMENTS_PER_CELL);
        return {
          tierKey,
          visual,
          isActive,
          isPast,
          litCount,
        };
      }),
    [activeIndex, stability.tier, stability.wdi],
  );

  const resolveSegColors = (
    visual: (typeof cells)[number]['visual'],
    isActive: boolean,
    on: boolean,
  ) => {
    if (!isActive) {
      return {
        backgroundColor: resolvePlanetStabilityTierColor(visual.accent, false),
        borderColor: resolvePlanetStabilityTierColor(visual.border, false),
      };
    }
    if (on) {
      return {
        backgroundColor: resolvePlanetStabilityTierColor(visual.accent, true),
        borderColor: resolvePlanetStabilityTierColor(visual.border, true),
      };
    }
    return {
      backgroundColor: visual.accentDim,
      borderColor: resolvePlanetStabilityTierColor(visual.border, true),
    };
  };

  return (
    <View style={[styles.panel, isTactical ? styles.panelTactical : null]}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, { color: headerLabelColor }]}>
          {t('planetStability.title')}
        </Text>
        <Text style={[styles.wdiValue, { color: wdiColor }]}>
          {t('planetStability.wdiValue', { wdi: String(stability.wdi) })}
        </Text>
      </View>

      <View style={styles.tierBlock}>
        <View style={styles.labelsRow}>
          {cells.map(({ tierKey, visual, isActive }) => (
            <View key={`label-${tierKey}`} style={styles.labelCell}>
              <Text
                style={[
                  styles.cellLabel,
                  isTactical ? styles.cellLabelTactical : null,
                  {
                    color: isActive ? tierLabelActiveInk : tierLabelInk,
                    opacity: isActive ? 1 : PLANET_STABILITY_TIER_INACTIVE_OPACITY,
                  },
                  isActive ? styles.cellLabelActive : styles.cellLabelInactive,
                ]}
                numberOfLines={1}
              >
                {t(visual.labelKey)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.gaugesRow}>
          {cells.map(({ tierKey, visual, isActive, litCount }) => (
            <View key={`gauge-${tierKey}`} style={styles.gaugeCell}>
              <View style={styles.segRow}>
                {Array.from({ length: SEGMENTS_PER_CELL }, (_, segIdx) => {
                  const on = segIdx < litCount;
                  const segColors = resolveSegColors(visual, isActive, on);
                  return (
                    <View
                      key={segIdx}
                      style={[styles.seg, segColors]}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </View>

      {stability.contestedHeld ? (
        <Text style={[styles.heldNote, { color: heldNoteColor }]}>{t('planetStability.contestedHeld')}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  panel: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
    backgroundColor: 'rgba(53, 208, 255, 0.05)',
    gap: SPACING.sm,
  },
  panelTactical: {
    borderColor: TACTICAL_OVERLAY.insetBorder,
    backgroundColor: TACTICAL_OVERLAY.insetBg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  wdiValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    textAlign: 'right',
  },
  tierBlock: {
    gap: 6,
  },
  labelsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  labelCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  gaugesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  gaugeCell: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 1,
    justifyContent: 'center',
  },
  cellLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  cellLabelTactical: {
    fontFamily: FONTS.mono,
  },
  cellLabelActive: {
    fontWeight: FONTS.weight.bold,
  },
  cellLabelInactive: {
    fontWeight: '400',
  },
  segRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 2,
  },
  seg: {
    flex: 1,
    height: 6,
    borderRadius: 1,
    borderWidth: 1,
  },
  heldNote: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
