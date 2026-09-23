import React, { memo, useCallback, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { resolveNpcCaptainPortraitSource } from '../../../game/npcCaptainPortraitAssets';
import { getArcCoreChatSpeakerRow } from '../../../arcCore/chat/arcCoreChatTableIndex';
import type { ArcOverlayHubTalkRosterEntry, ArcOverlayHubTalkRosterRow } from '../arcOverlayStore';
import { useT } from '../../../i18n';
import { FONTS, SPACING } from '../../../utils/theme';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { ArcButton } from '../ArcButton';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import {
  TACTICAL_OVERLAY,
  tacticalOverlaySectionStyles as section,
} from '../tacticalOverlayStyles';
import {
  PlanetFacilityCardTitleBlock,
  planetFacilityScreenStyles as fs,
} from '../../planetFacility/PlanetFacilityTitleHeader';
import { openPlanetHubTalkRosterRow } from '../../../game/planetHubTalkRoster';
import { ArcCoreLensIcon } from '../../arcCore/ArcCoreLensIcon';
import { ARC_CORE_LENS_ROSTER_PX } from '../../../game/arcCoreSymbolAssets';

type Props = {
  entry: ArcOverlayHubTalkRosterEntry;
  onClose: () => void;
};

function splitHubTalkRosterRows(rows: readonly ArcOverlayHubTalkRosterRow[]): {
  agentRows: ArcOverlayHubTalkRosterRow[];
  captainRows: ArcOverlayHubTalkRosterRow[];
} {
  const agentRows: ArcOverlayHubTalkRosterRow[] = [];
  const captainRows: ArcOverlayHubTalkRosterRow[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) continue;
    if (row.kind === 'arc_core' || row.kind === 'operator') agentRows.push(row);
    else captainRows.push(row);
  }
  return { agentRows, captainRows };
}

export const HubTalkRosterOverlayContent = memo(function HubTalkRosterOverlayContent({
  entry,
  onClose,
}: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('hubTalkRoster');
  const { rows } = entry;
  const { agentRows, captainRows } = useMemo(() => splitHubTalkRosterRows(rows), [rows]);

  const onTalk = useCallback((row: ArcOverlayHubTalkRosterRow) => {
    openPlanetHubTalkRosterRow(row);
  }, []);

  const renderRow = (row: ArcOverlayHubTalkRosterRow, agent: boolean) => (
    <Pressable
      key={row.rowKey}
      style={agent ? styles.agentCard : fs.listingCard}
      onPress={() => onTalk(row)}
      accessibilityRole="button"
      accessibilityLabel={`${row.displayName}, ${t('hubTalk.talk')}`}
    >
      {agent ? <View style={styles.agentAccent} pointerEvents="none" /> : null}
      <View style={fs.listingLeft}>
        {row.kind === 'operator' ? (
          (() => {
            const portrait = resolveNpcCaptainPortraitSource(
              getArcCoreChatSpeakerRow('operator')?.portraitAssetKey ?? null,
            );
            return portrait ? (
              <Image
                source={portrait}
                style={styles.rosterPortrait}
                resizeMode="contain"
                accessibilityLabel={row.displayName}
              />
            ) : (
              <ArcCoreLensIcon
                size={ARC_CORE_LENS_ROSTER_PX}
                accessibilityLabel={row.displayName}
              />
            );
          })()
        ) : row.kind === 'arc_core' ? (
          <ArcCoreLensIcon
            size={ARC_CORE_LENS_ROSTER_PX}
            accessibilityLabel={t('arcCore.symbolA11y')}
          />
        ) : null}
        <PlanetFacilityCardTitleBlock
          title={row.displayName}
          description={row.subtitle}
          descriptionLines={2}
        />
      </View>
      <View style={styles.rowRight} pointerEvents="none">
        {row.showInitiatedBadge ? <View style={styles.badge} /> : null}
        <ArcButton
          label={t('hubTalk.talk')}
          visualTheme={visualTheme}
          intent="primary"
          compact
        />
      </View>
    </Pressable>
  );

  return (
    <ArcOverlayCard
      layout="panel"
      visualTheme={visualTheme}
      title={t('hubTalk.rosterTitle')}
      subtitle={t('hubTalk.rosterSubtitle', { count: captainRows.length })}
      onClose={onClose}
      footer={
        <ArcOverlayFooterActions
          visualTheme={visualTheme}
          confirmOnly
          onConfirm={onClose}
          confirmLabel={t('hubTalk.close')}
        />
      }
    >
      {agentRows.length > 0 ? (
        <>
          <Text style={[section.sectionLabel, styles.sectionFirst]}>{t('hubTalk.section.agent')}</Text>
          <Text style={styles.sectionHint}>{t('hubTalk.section.agentHintDual')}</Text>
          {agentRows.map((row) => renderRow(row, true))}
        </>
      ) : null}

      {agentRows.length > 0 ? <View style={section.divider} /> : null}

      <Text style={[section.sectionLabel, styles.sectionFollow]}>{t('hubTalk.section.captain')}</Text>
      <Text style={styles.sectionHint}>{t('hubTalk.section.captainHint')}</Text>
      {captainRows.length === 0 ? (
        <Text style={styles.empty}>{t('hubTalk.captainEmpty')}</Text>
      ) : (
        captainRows.map((row) => renderRow(row, false))
      )}
    </ArcOverlayCard>
  );
});

const styles = StyleSheet.create({
  sectionFirst: {
    marginTop: 0,
  },
  sectionFollow: {
    marginTop: 0,
  },
  sectionHint: {
    marginBottom: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_OVERLAY.labelInk,
  },
  agentCard: {
    flexDirection: 'row',
    backgroundColor: TACTICAL_OVERLAY.insetBg,
    borderWidth: 1,
    borderColor: TACTICAL_OVERLAY.headerBg,
    borderRadius: 6,
    padding: SPACING.md,
    marginBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  agentAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: TACTICAL_OVERLAY.headerBg,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexShrink: 0,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TACTICAL_OVERLAY.labelInk,
  },
  rosterPortrait: {
    width: ARC_CORE_LENS_ROSTER_PX,
    height: ARC_CORE_LENS_ROSTER_PX,
  },
  empty: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_OVERLAY.labelInk,
    marginBottom: SPACING.sm,
  },
});
