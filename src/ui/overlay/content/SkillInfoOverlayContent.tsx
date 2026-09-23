import React, { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlaySkillInfoEntry } from '../arcOverlayStore';
import { useT } from '../../../i18n';
import { FONTS, SPACING } from '../../../utils/theme';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { overlayInkColor } from '../overlayVisualTokens';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { TACTICAL_OVERLAY, tacticalPlanetEconomyOverlayStyles } from '../tacticalOverlayStyles';

type Props = {
  entry: ArcOverlaySkillInfoEntry;
  onClose: () => void;
};

const REQ_WARN = '#C62828';

export const SkillInfoOverlayContent = memo(function SkillInfoOverlayContent({
  entry,
  onClose,
}: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('skillInfo');
  const isTactical = visualTheme === 'tactical';
  const bodyInk = overlayInkColor(visualTheme, 'value');
  const levelMet = entry.playerLevel >= entry.levelRequired;
  const spMet = entry.learned || entry.skillPoints > 0;

  const handleLearn = useCallback(async () => {
    await entry.onLearn?.();
    onClose();
  }, [entry, onClose]);

  const section = (label: string) => (
    <Text style={[tacticalPlanetEconomyOverlayStyles.section, !isTactical ? styles.sectionFallback : null]}>
      {label}
    </Text>
  );

  return (
    <ArcOverlayCard
      title={entry.skillName}
      subtitle={t('skilltree.infoSubtitle', { category: entry.categoryLabel, tier: entry.tier })}
      layout="panel"
      visualTheme={visualTheme}
      onClose={onClose}
      footer={
        entry.canLearn ? (
          <ArcOverlayFooterActions
            visualTheme={visualTheme}
            cancelLabel={t('skilltree.cancel')}
            confirmLabel={t('skilltree.learn')}
            onCancel={onClose}
            onConfirm={() => {
              void handleLearn();
            }}
          />
        ) : (
          <ArcOverlayFooterActions visualTheme={visualTheme} confirmOnly onConfirm={onClose} />
        )
      }
    >
      {section(t('skilltree.section.desc'))}
      <Text style={[styles.block, { color: bodyInk }]}>{entry.description}</Text>

      {section(t('skilltree.section.effect'))}
      <Text style={[styles.block, { color: bodyInk }]}>{entry.effect}</Text>

      {section(t('skilltree.section.req'))}
      <View style={styles.reqBlock}>
        <ArcOverlayInfoRow
          label={t('skilltree.req.level')}
          value={t('skilltree.req.levelValue', {
            required: entry.levelRequired,
            current: entry.playerLevel,
          })}
          visualTheme={visualTheme}
          valueColor={levelMet ? undefined : REQ_WARN}
        />
        <ArcOverlayInfoRow
          label={t('skilltree.req.prereq')}
          value={entry.prerequisiteLine}
          visualTheme={visualTheme}
          valueColor={entry.prerequisitesMet ? undefined : REQ_WARN}
        />
        <ArcOverlayInfoRow
          label={t('skilltree.req.sp')}
          value={t('skilltree.req.spValue', { sp: entry.skillPoints })}
          visualTheme={visualTheme}
          valueColor={spMet ? undefined : REQ_WARN}
        />
        <ArcOverlayInfoRow
          label={t('skilltree.req.learned')}
          value={entry.learned ? t('skilltree.req.learnedYes') : t('skilltree.req.learnedNo')}
          visualTheme={visualTheme}
        />
      </View>
    </ArcOverlayCard>
  );
});

const styles = StyleSheet.create({
  sectionFallback: {
    backgroundColor: TACTICAL_OVERLAY.sectionBarBg,
    color: TACTICAL_OVERLAY.sectionBarInk,
  },
  block: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: 20,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  reqBlock: {
    alignSelf: 'stretch',
    marginTop: SPACING.xs,
  },
});
