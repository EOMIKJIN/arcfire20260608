import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PlanetHubDigitalGauge } from '../../../components/planet/PlanetHubActionGaugeSlot';
import type { PlanetDevListRowView } from '../../../game/planetDevelopment/planetDevelopmentListRowModel';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

type Props = {
  row: PlanetDevListRowView;
  onPress: () => void;
};

export const PlanetDevelopmentListRow = memo(function PlanetDevelopmentListRow({
  row,
  onPress,
}: Props) {
  const t = useT();
  const PH = OVERLAY_TOKENS.phosphorAccent;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.listItem,
        !row.enabled && styles.listItemDisabled,
        pressed && styles.listItemPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={row.label}
    >
      <View style={styles.listItemRow}>
        <View
          style={styles.listItemImageSlot}
          accessibilityLabel={t('planetDev.listImagePlaceholderA11y', { label: row.label })}
        >
          <Text style={styles.listItemImagePlaceholder}>{row.placeholderGlyph}</Text>
        </View>
        <View style={styles.listItemBody}>
          <Text
            style={[
              styles.listItemTitle,
              !row.enabled && styles.listItemTitleDisabled,
              { color: PH },
            ]}
            numberOfLines={1}
          >
            {row.label}
            {!row.enabled ? (
              <Text style={styles.listItemComingSoonBadge}> · {t('planetDev.listComingSoonBadge')}</Text>
            ) : null}
          </Text>
          <Text
            style={[styles.listItemSummary, { color: PH }]}
            numberOfLines={3}
          >
            {row.summary}
          </Text>
          {row.progress ? (
            <View style={styles.listItemProgressBlock}>
              <Text style={[styles.listItemProgressLabel, { color: PH }]}>
                {row.progress.label}
              </Text>
              <PlanetHubDigitalGauge
                progressPct={row.progress.progressPct}
                accessibilityLabel={row.progress.a11yLabel}
              />
            </View>
          ) : row.completeStatus ? (
            <Text style={[styles.listItemStatusComplete, { color: PH }]}>
              {row.completeStatus}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
});
