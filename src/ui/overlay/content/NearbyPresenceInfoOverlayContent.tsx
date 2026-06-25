import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayNearbyPresenceInfoEntry } from '../arcOverlayStore';
import { useT } from '../../../i18n';
import { SPACING } from '../../../utils/theme';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import {
  PlanetFacilityCardTitleBlock,
  planetFacilityScreenStyles as fs,
} from '../../planetFacility/PlanetFacilityTitleHeader';
import { NearbyPresenceRowActionButton } from '../../../components/planet/NearbyPresenceRowActionButton';

type Props = {
  entry: ArcOverlayNearbyPresenceInfoEntry;
  onClose: () => void;
};

export const NearbyPresenceInfoOverlayContent = memo(function NearbyPresenceInfoOverlayContent({
  entry,
  onClose,
}: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('nearbyPresenceInfo');
  const { rows } = entry;

  return (
    <ArcOverlayCard
      layout="panel"
      visualTheme={visualTheme}
      title={t('nearbyPresence.overlayTitle')}
      subtitle={t('nearbyPresence.overlaySubtitle', { count: rows.length })}
      footer={
        <ArcOverlayFooterActions
          visualTheme={visualTheme}
          onCancel={onClose}
          onConfirm={onClose}
        />
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={rows.length > 6}
      >
        {rows.length === 0 ? (
          <Text style={fs.sectionEmpty}>{t('nearbyPresence.empty')}</Text>
        ) : (
          rows.map((row) => {
            const description = [row.shipLabel, row.detailRight ? `│ ${row.detailRight}` : '']
              .filter(Boolean)
              .join(' ');
            const action = row.action ?? { kind: 'none' as const };
            return (
              <View key={`nearby-detail-${row.keySlot}`} style={fs.listingCard}>
                <View style={fs.listingLeft}>
                  <PlanetFacilityCardTitleBlock
                    title={row.captainName || row.line}
                    description={description || row.line}
                    descriptionLines={2}
                  />
                </View>
                <NearbyPresenceRowActionButton action={action} variant="panel" />
              </View>
            );
          })
        )}
      </ScrollView>
    </ArcOverlayCard>
  );
});

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: SPACING.xs,
    gap: SPACING.xs,
  },
});
