import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_FACILITY as TF } from '../../ui/tactical/tacticalFacilityScreenTokens';
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
import {
  PlanetFacilityCardTitleBlock,
  PlanetFacilitySectionHeader,
  PlanetFacilityStatusPill,
  planetFacilityScreenStyles as fs,
} from '../../ui/planetFacility/PlanetFacilityTitleHeader';
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

  const isComplete = progress.status === 'complete';
  const badgeLabel = isComplete
    ? t('tavern.mission.badgeComplete')
    : isPrimaryActive
      ? t('tavern.mission.badgeActivePrimary')
      : t('tavern.mission.badgeActive');
  const badgeTone = !isComplete && isPrimaryActive ? 'primary' : 'neutral';

  return (
    <View style={fs.stackCard}>
      <View style={fs.cardTopRow}>
        <PlanetFacilityStatusPill label={badgeLabel} tone={badgeTone} />
        {progress.completedAt ? (
          <Text style={fs.cardMeta}>
            {t('tavern.mission.completedAt', {
              date: new Date(progress.completedAt).toLocaleDateString(),
            })}
          </Text>
        ) : null}
      </View>
      <PlanetFacilityCardTitleBlock title={title} titleNumberOfLines={2} />
      <Text style={[fs.cardBody, styles.cardBodyGap]}>{description}</Text>
      <Text style={[fs.cardMeta, styles.rewardGap]}>{rewardLine}</Text>
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
        <Text style={fs.empty}>{t('tavern.missionStatus.empty')}</Text>
      </View>
    );
  }

  return (
    <View>
      <PlanetFacilitySectionHeader
        first
        title={t('tavern.missionStatus.sectionActive')}
        meta={t('tavern.missionStatus.activeMeta', { count: activeRows.length })}
      />
      {activeRows.length === 0 ? (
        <Text style={fs.sectionEmpty}>{t('tavern.missionStatus.noActive')}</Text>
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

      <PlanetFacilitySectionHeader
        title={t('tavern.missionStatus.sectionComplete')}
        meta={t('tavern.missionStatus.completeMeta', { count: completedRows.length })}
      />
      {completedRows.length === 0 ? (
        <Text style={fs.sectionEmpty}>{t('tavern.missionStatus.noComplete')}</Text>
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
  emptyWrap: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  cardBodyGap: {
    marginBottom: 6,
  },
  rewardGap: {
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
    color: TF.info,
  },
  objectivePending: {
    color: TF.bodyInk,
  },
});
