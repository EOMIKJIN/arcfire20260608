import React, { memo, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayNearbyPresenceInfoEntry } from '../arcOverlayStore';
import { useT } from '../../../i18n';
import { useAppSettingsStore } from '../../../store/appSettingsStore';
import {
  localizeNearbyInfoDetailRow,
  omitPlayerFlagshipHubInfoRows,
  resolveNearbyInfoPanelCaptainName,
} from '../../../game/planetHub/nearbyPresenceDisplay';
import { PINNED_INFO_MARK_INK, resolvePinnedInfoMark } from '../../../game/planetHub/nearbyPresenceContract';
import { SPACING } from '../../../utils/theme';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import {
  PlanetFacilityCardTitleBlock,
  planetFacilityScreenStyles as fs,
} from '../../planetFacility/PlanetFacilityTitleHeader';
import { NearbyPresenceRowActionButton } from '../../../components/planet/NearbyPresenceRowActionButton';
import { NearbyPresenceQuestMarkRail } from '../../../components/planet/NearbyPresenceQuestMarkRail';
import { requestNearbyOrbitComm } from '../../../game/planetHub/requestNearbyOrbitComm';

type Props = {
  entry: ArcOverlayNearbyPresenceInfoEntry;
  onClose: () => void;
};

export const NearbyPresenceInfoOverlayContent = memo(function NearbyPresenceInfoOverlayContent({
  entry,
  onClose,
}: Props) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const visualTheme = resolveArcOverlayVisualTheme('nearbyPresenceInfo');
  const rows = useMemo(
    () =>
      omitPlayerFlagshipHubInfoRows(
        entry.rows.map((row) => localizeNearbyInfoDetailRow(row, locale)),
      ),
    [entry.rows, locale],
  );

  return (
    <ArcOverlayCard
      layout="panel"
      visualTheme={visualTheme}
      title={t('nearbyPresence.overlayTitle')}
      subtitle={t('nearbyPresence.overlaySubtitle', { count: rows.length })}
      onClose={onClose}
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
            const action = row.commGuaranteed
              ? { kind: 'dialog' as const, label: t('nearbyPresence.action.commLink') }
              : (row.action ?? { kind: 'none' as const });
            const pinMark = resolvePinnedInfoMark(row.pinKind);
            const name = resolveNearbyInfoPanelCaptainName(row);
            const title =
              row.pinKind === 'governor' ? t('nearbyPresence.role.governorName', { name }) : name;
            return (
              <View key={`nearby-detail-${row.keySlot}`} style={[fs.listingCard, styles.nameCard]}>
                <View style={fs.listingLeft}>
                  <View style={styles.cardTitleRow}>
                    {pinMark ? <Text style={styles.cardPinMark}>{pinMark}</Text> : null}
                    <View style={styles.cardTitleBody}>
                      <PlanetFacilityCardTitleBlock
                        title={title}
                        description={description || row.line}
                        descriptionLines={2}
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.cardActionCol}>
                  <NearbyPresenceQuestMarkRail
                    visible={row.showQuestMarks === true}
                    marks={{ M: row.hasMainQuest === true }}
                  />
                  <NearbyPresenceRowActionButton
                    action={action}
                    variant="panel"
                    onPress={() => {
                      requestNearbyOrbitComm({
                        ...row,
                        planetId: entry.planetId,
                        commGuaranteed: row.commGuaranteed === true,
                      });
                    }}
                  />
                </View>
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
    flex: 1,
  },
  cardTitleBody: {
    flex: 1,
    minWidth: 0,
  },
  cardPinMark: {
    marginRight: 6,
    marginTop: 1,
    color: PINNED_INFO_MARK_INK,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  nameCard: {
    alignItems: 'flex-start',
  },
  cardActionCol: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: 6,
    flexShrink: 0,
    minWidth: 97,
    marginLeft: SPACING.sm,
  },
});
