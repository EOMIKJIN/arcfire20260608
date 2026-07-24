import React, { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_HUB } from '../../ui/tactical/tacticalHubTokens';
import { resolveNpcCaptainPortraitAspectRatio } from '../../game/npcCaptainPortraitAssets';
import { useT } from '../../i18n';

/** 하단 고정 헤더 높이 — `planetMainStageLayout` 도크 추정과 동기 */
export const PLANET_MAIN_PILOT_HEADER_CHROME_PX = 44;

/** 시설 메뉴 행 ↔ 파일럿 헤더 간격 */
export const PLANET_MAIN_PILOT_MENU_HEADER_GAP_PX = 5;

/**
 * 펼침 스탯 영역 높이(헤더 제외).
 * 여권형 — 문서 헤더 + 사진 열 + 정보 열.
 */
export const PLANET_MAIN_PILOT_STATS_EXPANDED_HEIGHT_PX = 156;

const EXPAND_ANIM_MS = 280;

const PASSPORT_DOC_HEADER_PX = 22;
const PASSPORT_BODY_HEIGHT_PX =
  PLANET_MAIN_PILOT_STATS_EXPANDED_HEIGHT_PX - PASSPORT_DOC_HEADER_PX;

/** 포트레이트 미로드 시 사진 열 폴백 */
const PASSPORT_PHOTO_COLUMN_FALLBACK_WIDTH_PX = 90;

const PASSPORT = {
  docHeaderBg: 'rgba(24, 28, 36, 0.98)',
  photoColumnBg: 'rgba(16, 20, 28, 0.92)',
  fieldLine: 'rgba(255, 255, 255, 0.1)',
  docTitleInk: 'rgba(148, 156, 170, 0.92)',
} as const;

type PassportFieldProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

function PassportField({ label, value, highlight }: PassportFieldProps) {
  return (
    <View style={styles.passportField}>
      <Text style={styles.passportFieldLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[styles.passportFieldValue, highlight && styles.passportFieldValueHighlight]}
        numberOfLines={1}
      >
        {value}
      </Text>
      <View style={styles.passportFieldLine} />
    </View>
  );
}

type Props = {
  nickname: string;
  level: number;
  creditsLabel: string;
  shipName: string;
  skillPoints: number;
  clanName: string;
  portraitSource?: ImageSourcePropType | null;
  menuSlot?: ReactNode;
};

/**
 * 하단 도크 전용 — 무역소 메뉴 + 파일럿 헤더(최하단 고정).
 * 펼침 시 여권형 신분증 카드가 헤더 위로 올라간다.
 */
export const PlanetMainPilotInfoPanel = memo(function PlanetMainPilotInfoPanel({
  nickname,
  level,
  creditsLabel,
  shipName,
  skillPoints,
  clanName,
  portraitSource,
  menuSlot,
}: Props) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const photoColumnWidthPx = useMemo(() => {
    const aspect = resolveNpcCaptainPortraitAspectRatio(portraitSource);
    if (aspect != null) {
      return Math.round(PASSPORT_BODY_HEIGHT_PX * aspect);
    }
    return PASSPORT_PHOTO_COLUMN_FALLBACK_WIDTH_PX;
  }, [portraitSource]);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: EXPAND_ANIM_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded, expandAnim]);

  const statsRevealHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PLANET_MAIN_PILOT_STATS_EXPANDED_HEIGHT_PX],
  });

  const statsOpacity = expandAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.85, 1],
  });

  return (
    <View style={styles.root}>
      <View style={styles.menuZone} pointerEvents={expanded ? 'none' : 'auto'}>
        <View style={[styles.menuZoneInner, expanded && styles.menuZoneHidden]}>
          {menuSlot}
        </View>
      </View>
      <View style={styles.chromeAnchor}>
        <Animated.View
          pointerEvents={expanded ? 'auto' : 'none'}
          style={[
            styles.statsReveal,
            {
              height: statsRevealHeight,
              opacity: statsOpacity,
              bottom: PLANET_MAIN_PILOT_HEADER_CHROME_PX,
            },
          ]}
        >
          <View style={styles.passportCard} accessibilityLabel={t('pilotPanel.detailA11y')}>
            <View style={styles.passportDocHeader}>
              <Text style={styles.passportDocTitle}>{t('pilotPanel.passportTitle')}</Text>
            </View>
            <View style={styles.passportBody}>
              <View
                style={[styles.photoColumn, { width: photoColumnWidthPx }]}
                accessibilityLabel={t('pilotPanel.portraitA11y')}
                accessibilityRole="image"
              >
                {portraitSource ? (
                  <Image
                    source={portraitSource}
                    style={styles.photoImage}
                    resizeMode="cover"
                    resizeMethod="resize"
                  />
                ) : (
                  <View style={styles.photoPlaceholder} />
                )}
              </View>
              <View style={styles.photoDivider} />
              <View style={styles.infoColumn}>
                <View style={styles.infoRow}>
                  <PassportField label={t('pilotPanel.nickname')} value={nickname} />
                  <PassportField label={t('pilotPanel.level')} value={`Lv.${level}`} />
                </View>
                <View style={styles.infoRow}>
                  <PassportField label={t('pilotPanel.credits')} value={creditsLabel} />
                  <PassportField
                    label={t('pilotPanel.skillPoints')}
                    value={`${skillPoints}P`}
                    highlight={skillPoints > 0}
                  />
                </View>
                <View style={[styles.infoRow, styles.infoRowLast]}>
                  <PassportField label={t('pilotPanel.ship')} value={shipName} />
                  <PassportField label={t('pilotPanel.clan')} value={clanName} />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
        <Pressable
          style={({ pressed }) => [
            styles.headerBtn,
            expanded && styles.headerBtnExpanded,
            pressed && styles.headerBtnPressed,
          ]}
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={t('pilotPanel.a11y')}
          hitSlop={8}
        >
          <Text style={styles.headerText}>{t('pilotPanel.header')}</Text>
          <Text style={styles.chevron}>{expanded ? '▼' : '▲'}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    marginHorizontal: SPACING.md,
  },
  menuZone: {
    zIndex: 1,
  },
  menuZoneInner: {
    opacity: 1,
  },
  menuZoneHidden: {
    opacity: 0,
  },
  chromeAnchor: {
    position: 'relative',
    marginTop: PLANET_MAIN_PILOT_MENU_HEADER_GAP_PX,
    zIndex: 2,
  },
  statsReveal: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 3,
    backgroundColor: TACTICAL_HUB.pilotExpandBg,
  },
  passportCard: {
    flex: 1,
    minHeight: PLANET_MAIN_PILOT_STATS_EXPANDED_HEIGHT_PX,
    borderWidth: 1,
    borderColor: TACTICAL_HUB.pilotExpandBorder,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomWidth: 0,
    backgroundColor: TACTICAL_HUB.pilotExpandBg,
    overflow: 'hidden',
  },
  passportDocHeader: {
    minHeight: PASSPORT_DOC_HEADER_PX,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    backgroundColor: PASSPORT.docHeaderBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TACTICAL_HUB.pilotExpandBorder,
  },
  passportDocTitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: PASSPORT.docTitleInk,
    textTransform: 'uppercase',
  },
  passportBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  photoColumn: {
    flexShrink: 0,
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: PASSPORT.photoColumnBg,
  },
  photoImage: {
    flex: 1,
    width: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: TACTICAL_HUB.chromeBg,
  },
  photoDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: TACTICAL_HUB.pilotExpandBorder,
  },
  infoColumn: {
    flex: 1,
    minWidth: 0,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.sm,
    paddingVertical: SPACING.sm,
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    columnGap: SPACING.sm,
    marginBottom: 6,
  },
  infoRowLast: {
    marginBottom: 0,
  },
  passportField: {
    flex: 1,
    minWidth: 0,
  },
  passportFieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.4,
    color: TACTICAL_HUB.pilotLabelInk,
    marginBottom: 2,
  },
  passportFieldValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_HUB.pilotValueInk,
    paddingBottom: 3,
  },
  passportFieldValueHighlight: {
    color: TACTICAL_HUB.pilotValueHighlightInk,
    fontWeight: FONTS.weight.bold,
  },
  passportFieldLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PASSPORT.fieldLine,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: SPACING.sm,
    minHeight: PLANET_MAIN_PILOT_HEADER_CHROME_PX,
    backgroundColor: TACTICAL_HUB.chromeBg,
    borderWidth: 1,
    borderColor: TACTICAL_HUB.chromeBorder,
    borderRadius: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    zIndex: 4,
  },
  headerBtnExpanded: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 1,
    borderTopColor: TACTICAL_HUB.chromeBorder,
  },
  headerBtnPressed: {
    opacity: 0.9,
  },
  headerText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_HUB.chromeInk,
    textAlign: 'center',
  },
  chevron: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_HUB.chromeInk,
  },
});
