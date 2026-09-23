/**
 * INFO 네임카드 퀘스트 타입 — 독립 육각 뱃지 4개 (M N U S).
 * 바탕 있는 마크만 글자 표시. 현재 M=메인퀘스트. N/U/S는 빈 외곽.
 * 틱/Skia 없음. SVG Polygon 1회.
 */

import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { FONTS } from '../../utils/theme';
import { useT } from '../../i18n';

export const HUB_INFO_QUEST_MARK_SLOTS = ['M', 'N', 'U', 'S'] as const;
export type HubInfoQuestMarkSlot = (typeof HUB_INFO_QUEST_MARK_SLOTS)[number];

export type HubInfoQuestMarks = Partial<Record<HubInfoQuestMarkSlot, boolean>>;

export function hasAnyHubInfoQuestMark(marks: HubInfoQuestMarks): boolean {
  return HUB_INFO_QUEST_MARK_SLOTS.some((slot) => marks[slot] === true);
}

const HEX_SIZE = 22;
const HEX_H = 24;
/** pointy-top 정육각 · viewBox 22×24 */
const HEX_POINTS = '11.0,2.2 19.5,7.1 19.5,16.9 11.0,21.8 2.5,16.9 2.5,7.1';
const FILL_ON = '#E08B2C';
const STROKE_ON = '#B86A18';
const FILL_OFF = 'rgba(197, 201, 210, 0.35)';
const STROKE_OFF = 'rgba(143, 150, 163, 0.7)';

type Props = {
  /** 퀘스트 관련 NPC만 true — 무관 NPC는 레일 숨김 */
  visible: boolean;
  marks: HubInfoQuestMarks;
};

const HexBadge = memo(function HexBadge({
  slot,
  on,
}: {
  slot: HubInfoQuestMarkSlot;
  on: boolean;
}) {
  return (
    <View style={styles.badge} accessibilityElementsHidden>
      <Svg width={HEX_SIZE} height={HEX_H} viewBox="0 0 22 24" pointerEvents="none">
        <Polygon
          points={HEX_POINTS}
          fill={on ? FILL_ON : FILL_OFF}
          stroke={on ? STROKE_ON : STROKE_OFF}
          strokeWidth={1.15}
        />
      </Svg>
      {on ? (
        <Text style={styles.letter} allowFontScaling={false}>
          {slot}
        </Text>
      ) : null}
    </View>
  );
});

export const NearbyPresenceQuestMarkRail = memo(function NearbyPresenceQuestMarkRail({
  visible,
  marks,
}: Props) {
  const t = useT();
  if (!visible) return null;
  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={
        marks.M ? t('nearbyPresence.tag.mainQuest') : t('nearbyPresence.tag.questMarks')
      }
    >
      {HUB_INFO_QUEST_MARK_SLOTS.map((slot) => (
        <HexBadge key={slot} slot={slot} on={marks[slot] === true} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    minWidth: 88,
    height: HEX_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 3,
  },
  badge: {
    width: HEX_SIZE,
    height: HEX_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    position: 'absolute',
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: FONTS.weight.bold,
    color: '#2A1608',
    letterSpacing: 0.2,
    lineHeight: 12,
  },
});
