/**
 * INFO 네임카드 퀘스트 타입 — 독립 육각 뱃지 4개 (M S N U).
 * 바탕 있는 마크만 글자 표시. M=메인(주황) · S=서브(녹색) · N=파랑 · U=보라.
 * N/U는 아직 빈 외곽(이후 분류). 틱/Skia 없음. SVG Polygon 1회.
 */

import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { FONTS } from '../../utils/theme';
import { useT } from '../../i18n';

export const HUB_INFO_QUEST_MARK_SLOTS = ['M', 'S', 'N', 'U'] as const;
export type HubInfoQuestMarkSlot = (typeof HUB_INFO_QUEST_MARK_SLOTS)[number];

export type HubInfoQuestMarks = Partial<Record<HubInfoQuestMarkSlot, boolean>>;

export function hasAnyHubInfoQuestMark(marks: HubInfoQuestMarks): boolean {
  return HUB_INFO_QUEST_MARK_SLOTS.some((slot) => marks[slot] === true);
}

function resolveQuestMarkRailA11yLabel(
  marks: HubInfoQuestMarks,
  t: (key: string) => string,
): string {
  const parts: string[] = [];
  if (marks.M) parts.push(t('nearbyPresence.tag.mainQuest'));
  if (marks.S) parts.push(t('nearbyPresence.tag.subQuest'));
  return parts.length > 0 ? parts.join(', ') : t('nearbyPresence.tag.questMarks');
}

const HEX_SIZE = 22;
const HEX_H = 24;
/** pointy-top 정육각 · viewBox 22×24 */
const HEX_POINTS = '11.0,2.2 19.5,7.1 19.5,16.9 11.0,21.8 2.5,16.9 2.5,7.1';
const FILL_OFF = 'rgba(197, 201, 210, 0.35)';
const STROKE_OFF = 'rgba(143, 150, 163, 0.7)';

/** 슬롯 점등 색 — M 주황 · S 녹색 · N 파랑 · U 보라 */
export const HUB_INFO_QUEST_MARK_COLORS: Record<
  HubInfoQuestMarkSlot,
  { fill: string; stroke: string; letter: string }
> = {
  M: { fill: '#E08B2C', stroke: '#B86A18', letter: '#2A1608' },
  S: { fill: '#3CB86A', stroke: '#2A8A4E', letter: '#102418' },
  N: { fill: '#3A8BE0', stroke: '#1F5FA8', letter: '#0A1628' },
  U: { fill: '#9B6BDB', stroke: '#6E3FB0', letter: '#1A1028' },
};

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
  const color = HUB_INFO_QUEST_MARK_COLORS[slot];
  return (
    <View style={styles.badge} accessibilityElementsHidden>
      <Svg width={HEX_SIZE} height={HEX_H} viewBox="0 0 22 24" pointerEvents="none">
        <Polygon
          points={HEX_POINTS}
          fill={on ? color.fill : FILL_OFF}
          stroke={on ? color.stroke : STROKE_OFF}
          strokeWidth={1.15}
        />
      </Svg>
      {on ? (
        <Text style={[styles.letter, { color: color.letter }]} allowFontScaling={false}>
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
      accessibilityLabel={resolveQuestMarkRailA11yLabel(marks, t)}
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
    letterSpacing: 0.2,
    lineHeight: 12,
  },
});
