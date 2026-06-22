import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { useT } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { useMissionStore } from '../../store/missionStore';
import {
  resolveMissionDescription,
  resolveMissionObjectiveDescription,
  resolveMissionTitle,
} from '../../i18n/missionText';
import { formatCredits } from '../../utils/formatCredits';
import {
  listActiveMissionStatusRows,
  listCompletedMissionStatusRows,
} from '../../missions/tavernMissionBoard';
import type { Mission, MissionProgress } from '../../types';

function resolveMissionTitleText(
  mission: Mission,
  t: (key: string) => string,
  locale: ReturnType<typeof useAppSettingsStore.getState>['locale'],
): string {
  const titleKey = `mission.${mission.id}.title`;
  const fromKey = t(titleKey);
  return fromKey !== titleKey ? fromKey : resolveMissionTitle(mission, locale);
}

function resolveMissionDescText(
  mission: Mission,
  t: (key: string) => string,
  locale: ReturnType<typeof useAppSettingsStore.getState>['locale'],
): string {
  const descKey = `mission.${mission.id}.desc`;
  const fromKey = t(descKey);
  return fromKey !== descKey ? fromKey : resolveMissionDescription(mission, locale);
}

function resolveObjectiveText(
  mission: Mission,
  objectiveId: string,
  objective: Mission['objectives'][number],
  t: (key: string) => string,
  locale: ReturnType<typeof useAppSettingsStore.getState>['locale'],
): string {
  const objKey = `mission.${mission.id}.obj.${objectiveId}`;
  const fromKey = t(objKey);
  return fromKey !== objKey
    ? fromKey
    : resolveMissionObjectiveDescription(objective, locale);
}

function MissionStatusCard({
  mission,
  progress,
  isPrimaryActive,
}: {
  mission: Mission;
  progress: MissionProgress;
  isPrimaryActive: boolean;
}) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const title = resolveMissionTitleText(mission, t, locale);
  const description = resolveMissionDescText(mission, t, locale);
  const rewardLine = t('tavern.mission.rewardLine', {
    credits: formatCredits(mission.rewards.credits, { suffix: true }),
    exp: mission.rewards.exp,
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.badge}>
          {progress.status === 'complete'
            ? t('tavern.mission.badgeComplete')
            : isPrimaryActive
              ? t('tavern.mission.badgeActivePrimary')
              : t('tavern.mission.badgeActive')}
        </Text>
        {progress.completedAt ? (
          <Text style={styles.timeMeta}>
            {t('tavern.mission.completedAt', {
              date: new Date(progress.completedAt).toLocaleDateString(),
            })}
          </Text>
        ) : null}
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{description}</Text>
      <Text style={styles.rewardMeta}>{rewardLine}</Text>
      <View style={styles.objectiveList}>
        {mission.objectives.map((objective) => {
          const done = progress.objectives[objective.id] === true;
          const label = resolveObjectiveText(mission, objective.id, objective, t, locale);
          return (
            <Text
              key={objective.id}
              style={[styles.objectiveRow, done ? styles.objectiveDone : styles.objectivePending]}
            >
              {done ? '✓' : '○'} {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

export function TavernMissionStatusTab() {
  const t = useT();
  const progresses = useMissionStore((s) => s.progresses);
  const activeMissionId = useMissionStore((s) => s.activeMissionId);
  const activeRows = useMemo(
    () => listActiveMissionStatusRows(progresses, activeMissionId),
    [progresses, activeMissionId],
  );
  const completedRows = useMemo(
    () => listCompletedMissionStatusRows(progresses),
    [progresses],
  );
  const isEmpty = activeRows.length === 0 && completedRows.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{t('tavern.missionStatus.empty')}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('tavern.missionStatus.sectionActive')}</Text>
        <Text style={styles.sectionMeta}>
          {t('tavern.missionStatus.activeMeta', { count: activeRows.length })}
        </Text>
      </View>
      {activeRows.length === 0 ? (
        <Text style={styles.sectionEmpty}>{t('tavern.missionStatus.noActive')}</Text>
      ) : (
        activeRows.map((row) => (
          <MissionStatusCard
            key={row.mission.id}
            mission={row.mission}
            progress={row.progress}
            isPrimaryActive={row.isPrimaryActive}
          />
        ))
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('tavern.missionStatus.sectionComplete')}</Text>
        <Text style={styles.sectionMeta}>
          {t('tavern.missionStatus.completeMeta', { count: completedRows.length })}
        </Text>
      </View>
      {completedRows.length === 0 ? (
        <Text style={styles.sectionEmpty}>{t('tavern.missionStatus.noComplete')}</Text>
      ) : (
        completedRows.map((row) => (
          <MissionStatusCard
            key={row.mission.id}
            mission={row.mission}
            progress={row.progress}
            isPrimaryActive={false}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
  },
  sectionMeta: {
    marginTop: 3,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
  },
  sectionEmpty: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_faint,
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  emptyWrap: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  emptyText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_light,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.info,
    fontWeight: FONTS.weight.bold,
  },
  timeMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_faint,
  },
  cardTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
    marginBottom: 4,
  },
  cardBody: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
    lineHeight: 18,
    marginBottom: 6,
  },
  rewardMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginBottom: 6,
  },
  objectiveList: {
    gap: 2,
  },
  objectiveRow: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    lineHeight: 17,
  },
  objectiveDone: {
    color: COLORS.info,
  },
  objectivePending: {
    color: COLORS.ink_mid,
  },
});
