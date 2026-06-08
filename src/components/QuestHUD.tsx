// ============================================================
// 아크파이어 온라인 - 퀘스트 HUD
// 활성 미션 목표 표시 — 타입별 계약: ../missions/missionObjectiveDsl.ts
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../utils/theme';
import { useMissionStore } from '../store/missionStore';

export function QuestHUD() {
  const getActiveMission = useMissionStore(s => s.getActiveMission);
  const active = getActiveMission();

  if (!active) return null;

  const { mission, progress } = active;
  const incompleteObj = mission.objectives.find(
    obj => !progress.objectives[obj.id],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.title} numberOfLines={1}>{mission.title}</Text>
      </View>
      {incompleteObj && (
        <Text style={styles.objective} numberOfLines={2}>
          ▶ {incompleteObj.description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
    flex: 1,
  },
  objective: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_mid,
    lineHeight: 16,
  },
});
