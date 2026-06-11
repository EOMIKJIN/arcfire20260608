import React, { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../utils/theme';

/** 하단 고정 헤더 높이 — `planetMainStageLayout` 도크 추정과 동기 */
export const PLANET_MAIN_PILOT_HEADER_CHROME_PX = 44;

/** 시설 메뉴 행 ↔ 파일럿 헤더 간격 */
export const PLANET_MAIN_PILOT_MENU_HEADER_GAP_PX = 5;

/**
 * 펼침 스탯 영역 높이(헤더 제외).
 * 기존 112px 대비 +10 — 뒤 스캔 버튼이 비치지 않도록 불투명 영역을 확보한다.
 */
export const PLANET_MAIN_PILOT_STATS_EXPANDED_HEIGHT_PX = 122;

/** 마지막 스탯 줄(함선·SP·클랜) ↔ 패널 하단(헤더 상단 경계) 여백 */
const PILOT_STATS_BOTTOM_INSET_PX = 12;

const EXPAND_ANIM_MS = 280;

type StatItemProps = {
  label: string;
  value: string;
  highlight?: boolean;
};

function StatItem({ label, value, highlight }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
    </View>
  );
}

type Props = {
  nickname: string;
  level: number;
  expLabel: string;
  creditsLabel: string;
  shipName: string;
  skillPoints: number;
  clanName: string;
  menuSlot?: ReactNode;
};

/**
 * 하단 도크 전용 — 무역소 메뉴 + 파일럿 헤더(최하단 고정).
 * 펼침 시 스탯만 헤더 위로 올라가며, 헤더 Y는 변하지 않는다.
 */
export const PlanetMainPilotInfoPanel = memo(function PlanetMainPilotInfoPanel({
  nickname,
  level,
  expLabel,
  creditsLabel,
  shipName,
  skillPoints,
  clanName,
  menuSlot,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

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
          <View style={styles.statsPanel} accessibilityLabel="파일럿 정보 상세">
            <View style={styles.statsBody}>
              <View style={styles.statsRow}>
                <StatItem label="닉네임" value={nickname} />
                <StatItem label="레벨" value={`Lv.${level} (${expLabel})`} />
                <StatItem label="크레딧" value={creditsLabel} />
              </View>
              <View style={styles.statsRow}>
                <StatItem label="함선" value={shipName} />
                <StatItem
                  label="스킬 포인트"
                  value={`${skillPoints}P`}
                  highlight={skillPoints > 0}
                />
                <StatItem label="클랜" value={clanName} />
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
          accessibilityLabel="파일럿 정보"
          hitSlop={8}
        >
          <Text style={styles.headerText}>— 파일럿 정보 —</Text>
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
    backgroundColor: COLORS.bg_panel,
  },
  statsPanel: {
    flex: 1,
    minHeight: PLANET_MAIN_PILOT_STATS_EXPANDED_HEIGHT_PX,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomWidth: 0,
    backgroundColor: COLORS.bg_panel,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: PILOT_STATS_BOTTOM_INSET_PX,
    justifyContent: 'flex-start',
  },
  statsBody: {
    flexGrow: 0,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: SPACING.sm,
    minHeight: PLANET_MAIN_PILOT_HEADER_CHROME_PX,
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    zIndex: 4,
  },
  headerBtnExpanded: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  headerBtnPressed: {
    opacity: 0.9,
  },
  headerText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    textAlign: 'center',
  },
  chevron: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  statItem: { flex: 1 },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_dark,
  },
  statValueHighlight: {
    color: COLORS.skill,
    fontWeight: FONTS.weight.bold,
  },
});
