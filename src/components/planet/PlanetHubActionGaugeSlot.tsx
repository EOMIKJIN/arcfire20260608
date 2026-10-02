import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePlanetHubSystemMessage } from '../../game/planetHub/usePlanetHubSystemMessage';
import { PlanetDevProgressBreathText } from '../../ui/overlay/content/PlanetDevProgressBreathText';
import { FONTS, SPACING } from '../../utils/theme';

/** 메인스테이지 액션 행(스캔·수색 등) 상단 — 게이지 미표시 시에도 동일 높이 유지 */
export const PLANET_HUB_ACTION_GAUGE_SLOT_HEIGHT_PX = 20;

/** 스캔 게이지 점등 · 허브 시스템 메시지 공통 푸른빛 */
export const PLANET_HUB_ACTION_GAUGE_CYAN = '#35D0FF';
export const PLANET_HUB_ACTION_GAUGE_CYAN_EDGE = '#7BE8FF';

export const PLANET_HUB_DIGITAL_GAUGE_SEGMENTS = 12;

type DigitalGaugeProps = {
  progressPct: number;
  accessibilityLabel?: string;
};

export const PlanetHubDigitalGauge = memo(function PlanetHubDigitalGauge({
  progressPct,
  accessibilityLabel,
}: DigitalGaugeProps) {
  const clamped = Math.max(0, Math.min(100, progressPct));
  const litCount = Math.round((clamped / 100) * PLANET_HUB_DIGITAL_GAUGE_SEGMENTS);
  return (
    <View
      style={styles.gaugeWrap}
      accessibilityLabel={accessibilityLabel ?? `진행 ${clamped}%`}
    >
      <View style={styles.gaugeSegRow}>
        {Array.from({ length: PLANET_HUB_DIGITAL_GAUGE_SEGMENTS }, (_, i) => (
          <View
            key={i}
            style={[styles.gaugeSeg, i < litCount ? styles.gaugeSegOn : styles.gaugeSegOff]}
          />
        ))}
      </View>
      <Text style={styles.gaugePct}>{clamped}%</Text>
    </View>
  );
});

type SlotProps = {
  visible: boolean;
  progressPct: number;
  accessibilityLabel?: string;
};

/** 버튼 행 아래 고정 슬롯 — `visible=false`여도 높이는 유지. 게이지 우선, 없으면 시스템 메시지. */
export const PlanetHubActionGaugeSlot = memo(function PlanetHubActionGaugeSlot({
  visible,
  progressPct,
  accessibilityLabel,
}: SlotProps) {
  const systemMessage = usePlanetHubSystemMessage();
  return (
    <View style={styles.slot} pointerEvents="none">
      {visible ? (
        <PlanetHubDigitalGauge
          progressPct={progressPct}
          accessibilityLabel={accessibilityLabel}
        />
      ) : systemMessage ? (
        systemMessage.tone === 'progress' ? (
          <PlanetDevProgressBreathText
            style={styles.systemMessage}
            numberOfLines={1}
            accessibilityLabel={systemMessage.text}
          >
            {systemMessage.text}
          </PlanetDevProgressBreathText>
        ) : (
          <Text
            style={styles.systemMessage}
            numberOfLines={1}
            accessibilityLabel={systemMessage.text}
          >
            {systemMessage.text}
          </Text>
        )
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  slot: {
    minHeight: PLANET_HUB_ACTION_GAUGE_SLOT_HEIGHT_PX,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  gaugeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: SPACING.sm,
  },
  gaugeSegRow: {
    flex: 1,
    flexDirection: 'row',
    columnGap: 2,
  },
  gaugeSeg: {
    flex: 1,
    height: 4,
    borderRadius: 1,
    borderWidth: 1,
  },
  gaugeSegOn: {
    backgroundColor: PLANET_HUB_ACTION_GAUGE_CYAN,
    borderColor: PLANET_HUB_ACTION_GAUGE_CYAN_EDGE,
  },
  systemMessage: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: PLANET_HUB_ACTION_GAUGE_CYAN,
    textAlign: 'center',
    includeFontPadding: false,
  },
  gaugeSegOff: {
    backgroundColor: 'rgba(110,128,160,0.16)',
    borderColor: 'rgba(110,128,160,0.35)',
  },
  gaugePct: {
    width: 38,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: 'rgba(110, 128, 160, 0.92)',
    textAlign: 'right',
  },
});
