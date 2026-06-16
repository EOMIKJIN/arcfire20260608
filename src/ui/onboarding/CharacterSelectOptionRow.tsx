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
import type { PlayerProfessionCsvRow } from '../../data/generated';

export type CharacterSelectOptionRowProps = {
  profession: PlayerProfessionCsvRow;
  selected: boolean;
  portraitSource: ImageSourcePropType | null;
  onPress: () => void;
};

/** 인게임 `NarrativeDialogRow` 포트레이트+우측 설명 스타일 — 세로 목록용 선택 카드 */
export const CharacterSelectOptionRow = memo(function CharacterSelectOptionRow({
  profession,
  selected,
  portraitSource,
  onPress,
}: CharacterSelectOptionRowProps) {
  const genderLabel = profession.gender === 'female' ? '여성' : '남성';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.row, selected && styles.rowSelected]}
    >
      {portraitSource ? (
        <View style={styles.portraitCard}>
          <Image source={portraitSource} style={styles.portrait} resizeMode="contain" />
        </View>
      ) : (
        <View style={styles.portraitPlaceholder} />
      )}
      <View style={styles.hud}>
        <Text style={styles.name}>{profession.nameKo}</Text>
        <Text style={styles.demographics}>
          성별 : {genderLabel}
          {'  '}
          나이 : ??
        </Text>
        <Text style={styles.summary}>{profession.summaryKo}</Text>
        <Text style={styles.personality}>성격 : {profession.personalityKo}</Text>
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
    width: 120,
    height: 160,
    backgroundColor: '#05070d',
  },
  portrait: {
    width: 120,
    height: 160,
  },
  portraitPlaceholder: {
    width: 120,
    height: 160,
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
