import React, { memo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { COLORS, FONTS, OVERLAY_TOKENS, SPACING } from '../../utils/theme';
import { useT } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import {
  resolveProfessionName,
  resolveProfessionPersonality,
  resolveProfessionSummary,
} from '../../i18n/professionText';
import type { PlayerProfessionCsvRow } from '../../data/generated';

export type CharacterSelectOptionRowProps = {
  profession: PlayerProfessionCsvRow;
  selected: boolean;
  portraitSource: ImageSourcePropType | null;
  onPress: () => void;
};

/** 온보딩 직업 선택 카드(좌 정사각 초상·우 설명). NPC 초상 정본 240×240과 동일 비율 */
const CHARACTER_SELECT_PORTRAIT_PX = 160;

export const CharacterSelectOptionRow = memo(function CharacterSelectOptionRow({
  profession,
  selected,
  portraitSource,
  onPress,
}: CharacterSelectOptionRowProps) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const genderLabel = profession.gender === 'female' ? t('charSelect.female') : t('charSelect.male');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.row, selected && styles.rowSelected]}
    >
      {portraitSource ? (
        <View style={styles.portraitCard}>
          <Image
          source={portraitSource}
          style={styles.portrait}
          resizeMode="contain"
          resizeMethod="resize"
        />
        </View>
      ) : (
        <View style={styles.portraitPlaceholder} />
      )}
      <View style={styles.hud}>
        <Text style={styles.name}>{resolveProfessionName(profession, locale)}</Text>
        <Text style={styles.demographics}>
          {t('charSelect.gender')} : {genderLabel}
          {'  '}
          {t('charSelect.age')} : ??
        </Text>
        <Text style={styles.summary}>{resolveProfessionSummary(profession, locale)}</Text>
        <Text style={styles.personality}>{t('charSelect.personality')} : {resolveProfessionPersonality(profession, locale)}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.narrativeMaxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
    marginBottom: SPACING.md,
  },
  rowSelected: {
    borderColor: OVERLAY_TOKENS.phosphorAccent,
    borderWidth: 2,
    backgroundColor: 'rgba(20, 28, 48, 0.92)',
  },
  portraitCard: {
    width: CHARACTER_SELECT_PORTRAIT_PX,
    height: CHARACTER_SELECT_PORTRAIT_PX,
    backgroundColor: '#05070d',
  },
  portrait: {
    width: CHARACTER_SELECT_PORTRAIT_PX,
    height: CHARACTER_SELECT_PORTRAIT_PX,
  },
  portraitPlaceholder: {
    width: CHARACTER_SELECT_PORTRAIT_PX,
    height: CHARACTER_SELECT_PORTRAIT_PX,
    backgroundColor: '#05070d',
  },
  hud: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'flex-start',
  },
  name: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
    marginBottom: SPACING.xs,
  },
  demographics: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginBottom: SPACING.sm,
  },
  summary: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  personality: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    lineHeight: 18,
  },
});
