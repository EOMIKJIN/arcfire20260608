import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PlanetHubDigitalGauge } from '../../../components/planet/PlanetHubActionGaugeSlot';
import type { PlanetDevListRowView } from '../../../game/planetDevelopment/planetDevelopmentListRowModel';
import { useT } from '../../../i18n';
import { isEpicPlanetFacilityDevLevel } from '../../../game/planetDevelopment/planetFacilityDevLevelDisplay';
import {
  PLANET_DEV_LIST_ICON_MONO,
  PLANET_DEV_LIST_ICON_PX,
  PLANET_DEV_LIST_LEVEL_TAG_BG,
  PLANET_DEV_LIST_LEVEL_TAG_INK,
  PLANET_DEV_LIST_LEVEL_TAG_INK_MUTED,
  resolvePlanetDevListIconChromaColor,
} from '../../../game/planetDevelopment/planetDevListIconChroma';
import { COLORS } from '../../../utils/theme';
import { PlanetHubActionIcon } from '../../../ui/tactical/PlanetHubActionIcon';
import { overlayInkColor } from '../overlayVisualTokens';
import type { ArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { PlanetDevListItemHeader } from './PlanetDevOverlayChrome';
import { PlanetDevProgressBreathText } from './PlanetDevProgressBreathText';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

type Props = {
  row: PlanetDevListRowView;
  visualTheme?: ArcOverlayVisualTheme;
  onPress: () => void;
};

export const PlanetDevelopmentListRow = memo(function PlanetDevelopmentListRow({
  row,
  visualTheme = 'phosphor',
  onPress,
}: Props) {
  const t = useT();
  const isTactical = visualTheme === 'tactical';
  const labelInk = overlayInkColor(visualTheme, 'label');
  const valueInk = overlayInkColor(visualTheme, 'value');
  const listItemStyle = isTactical
    ? [styles.listItem, styles.listItemTactical]
    : [styles.listItem, styles.listItemPhosphor];
  const imageSlotStyle = isTactical
    ? [styles.listItemImageSlot, styles.listItemImageSlotTactical]
    : [styles.listItemImageSlot, styles.listItemImageSlotPhosphor];

  const progressPct = row.progress?.progressPct ?? 0;
  const chromaPct = Math.max(0, Math.min(1, row.iconChromaPct));
  const chromaColor = resolvePlanetDevListIconChromaColor(row.catalogId);
  const gaugeA11y = row.progress
    ? row.progress.a11yLabel
    : t('planetDev.listGaugeIdleA11y', { pct: progressPct });

  return (
    <Pressable
      style={({ pressed }) => [
        listItemStyle,
        !row.enabled && styles.listItemDisabled,
        pressed && styles.listItemPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${row.label} ${row.levelTag}`}
    >
      <View style={styles.listItemRow}>
        <View style={styles.listItemLead}>
          <View
            style={imageSlotStyle}
            accessibilityLabel={t('planetDev.listImagePlaceholderA11y', { label: row.label })}
          >
            <View style={styles.listItemIconStack}>
              <View style={styles.listItemIconLayer}>
                <PlanetHubActionIcon spec={row.placeholderIcon} size={PLANET_DEV_LIST_ICON_PX} color={PLANET_DEV_LIST_ICON_MONO} />
              </View>
              {chromaPct > 0 ? (
                <View style={[styles.listItemIconChromaClip, { height: PLANET_DEV_LIST_ICON_PX * chromaPct }]}>
                  <View style={styles.listItemIconChromaInner}>
                    <PlanetHubActionIcon spec={row.placeholderIcon} size={PLANET_DEV_LIST_ICON_PX} color={chromaColor} />
                  </View>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.listItemLevelTagSlot}>
            <View
              style={[
                styles.listItemLevelTag,
                {
                  backgroundColor: PLANET_DEV_LIST_LEVEL_TAG_BG,
                  borderColor: isEpicPlanetFacilityDevLevel(row.displayLevel)
                    ? COLORS.gold
                    : row.displayLevel > 0
                      ? chromaColor
                      : PLANET_DEV_LIST_ICON_MONO,
                },
              ]}
            >
              {row.displayLevel > 0 ? (
                <View style={[styles.listItemLevelTagAccent, { backgroundColor: chromaColor }]} />
              ) : null}
              <Text
                style={[
                  styles.listItemLevelTagText,
                  {
                    color: row.displayLevel > 0
                      ? PLANET_DEV_LIST_LEVEL_TAG_INK
                      : PLANET_DEV_LIST_LEVEL_TAG_INK_MUTED,
                  },
                ]}
              >
                {row.levelTag}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.listItemBody}>
          <PlanetDevListItemHeader
            title={row.label}
            summary={row.summary}
            visualTheme={visualTheme}
            disabled={!row.enabled}
            titleSuffix={
              !row.enabled ? (
                <Text style={[styles.listItemComingSoonBadge, { color: labelInk }]}>
                  {' '}
                  · {t('planetDev.listComingSoonBadge')}
                </Text>
              ) : null
            }
          />
          <View style={styles.listDevGaugeSlot}>
            {row.progress ? (
              <PlanetDevProgressBreathText
                style={[styles.listItemProgressLabel, { color: labelInk }]}
                numberOfLines={2}
                accessibilityLabel={row.progress.a11yLabel}
              >
                {row.progress.label}
              </PlanetDevProgressBreathText>
            ) : row.completeStatus ? (
              <Text
                style={[styles.listItemStatusComplete, { color: valueInk }]}
                numberOfLines={2}
              >
                {row.completeStatus}
              </Text>
            ) : null}
            <View style={styles.listDevGaugeRow}>
              <PlanetHubDigitalGauge
                progressPct={progressPct}
                accessibilityLabel={gaugeA11y}
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
});
