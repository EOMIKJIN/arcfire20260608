import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONTS } from '../utils/theme';
import { TACTICAL_HUB } from '../ui/tactical/tacticalHubTokens';
import { useMissionStore } from '../store/missionStore';
import { useT } from '../i18n';
import { useAppSettingsStore } from '../store/appSettingsStore';
import {
  resolveMissionObjectiveDescription,
  resolveMissionTitle,
} from '../i18n/missionText';

export function QuestHUD() {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const getActiveMission = useMissionStore(s => s.getActiveMission);
  const active = getActiveMission();

  if (!active) return null;

  const { mission, progress } = active;
  const incompleteObj = mission.objectives.find(
    obj => !progress.objectives[obj.id],
  );

  const titleKey = `mission.${mission.id}.title`;
  const titleFromKey = t(titleKey);
  const titleText =
    titleFromKey !== titleKey ? titleFromKey : resolveMissionTitle(mission, locale);

  const objKey = incompleteObj ? `mission.${mission.id}.obj.${incompleteObj.id}` : '';
  const objFromKey = incompleteObj ? t(objKey) : '';
  const objText =
    incompleteObj && objFromKey !== objKey
      ? objFromKey
      : incompleteObj
        ? resolveMissionObjectiveDescription(incompleteObj, locale)
        : '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.title} numberOfLines={1}>{titleText}</Text>
      </View>
      {incompleteObj && (
        <Text style={styles.objective} numberOfLines={2}>
          ▶ {objText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: TACTICAL_HUB.chromeBg,
    borderWidth: 1,
    borderColor: TACTICAL_HUB.chromeBorder,
    borderRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  icon: { fontSize: 14 },
  title: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TACTICAL_HUB.chromeInk,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.4,
  },
  objective: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_HUB.topBarIconInk,
    paddingHorizontal: 10,
    paddingBottom: 8,
    lineHeight: 18,
  },
});
