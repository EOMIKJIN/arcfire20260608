import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import type { CapitalRealtimeCombatSim } from './capitalRealtimeTypes';
import { CapitalRealtimeCombatOrbitSvg } from './capitalRealtimeBridge';

export type CapitalRealtimeCombatOrbitViewProps = {
  sim: CapitalRealtimeCombatSim;
  orbitSize: number;
  style?: ViewStyle;
  /** 궤도 SVG 위·주변에 HUD·테두리 등을 올릴 때 */
  children?: React.ReactNode;
};

/** 궤도 크기에 맞춘 실시간 전투 궤도 뷰 — 스테이지·이벤트에서 그대로 삽입 */
export function CapitalRealtimeCombatOrbitView({
  sim,
  orbitSize,
  style,
  children,
}: CapitalRealtimeCombatOrbitViewProps) {
  return (
    <View style={[styles.box, { width: orbitSize, height: orbitSize }, style]}>
      <CapitalRealtimeCombatOrbitSvg sim={sim} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'relative',
    overflow: 'hidden',
  },
});
