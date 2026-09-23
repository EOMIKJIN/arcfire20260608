import React, { useEffect, useMemo } from 'react';
import {
  formatMissionTimeLimitAssigned,
  formatMissionTimeLimitRemaining,
  resolveMissionTimeLimitHours,
} from '../../missions/missionTimeLimit';
import { useMissionTimeLimitNow } from '../../missions/useMissionTimeLimitNow';
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
  listActiveTutorialStatusRows,
  listActiveMainStoryStatusRows,
  listActiveQuestStatusRows,
  listCompletedTutorialStatusRows,
  listCompletedMainStoryStatusRows,
  listCompletedQuestStatusRows,
} from '../../missions/barMissionBoard';
import { resolveMissionTrack } from '../../missions/missionTrack';
import {
  PlanetFacilityCardTitleBlock,
  PlanetFacilitySectionHeader,
  PlanetFacilityStatusPill,
  planetFacilityScreenStyles as fs,
} from '../../ui/planetFacility/PlanetFacilityTitleHeader';
import type { Mission, MissionProgress } from '../../types';

/**
 * 완료 미션은 플레이 누적으로 무제한 증가할 수 있어, 상위 ScrollView 안에서 전량 `.map()`하면
 * 네이티브 View/Text 노드 수가 계단식으로 쌓여 views/native_heap 급증(하드실링 유발)을 낳는다.
 * 최근 N개만 렌더하고 나머지는 카운트 요약으로 대체해 마운트 노드 수에 상한을 둔다.
 */
const COMPLETED_MISSION_RENDER_CAP = 20;

function MissionStatusCard({
  mission,
  progress,
  isPrimaryActive,
  nowMs,
}: {
  mission: Mission;
  progress: MissionProgress;
  isPrimaryActive: boolean;
  nowMs: number;
}) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const title = progress.titleSnapshot?.trim()
    ? progress.titleSnapshot
    : resolveMissionTitle(mission, locale);
  const description = resolveMissionDescription(mission, locale);
  const rewardLine = t('bar.mission.rewardLine', {
    credits: formatCredits(mission.rewards.credits, { suffix: true }),
    exp: mission.rewards.exp,
  });

  const isComplete = progress.status === 'complete';
  const track = resolveMissionTrack(mission.id);
  const trackLabel =
    track === 'tutorial'
      ? t('mission.track.tutorialShort')
      : track === 'main_story'
        ? t('mission.track.mainStoryShort')
        : track === 'quest'
          ? t('mission.track.questShort')
          : t('bar.mission.badgeActive');
  const badgeLabel = isComplete
    ? t('bar.mission.badgeComplete')
    : isPrimaryActive
      ? t('bar.mission.badgeActivePrimary')
      : trackLabel;
  const badgeTone = !isComplete && isPrimaryActive ? 'primary' : 'neutral';

  return (
    <View style={fs.stackCard}>
      <View style={fs.cardTopRow}>
        <PlanetFacilityStatusPill label={badgeLabel} tone={badgeTone} />
        {progress.completedAt ? (
          <Text style={fs.cardMeta}>
            {t('bar.mission.completedAt', {
              date: new Date(progress.completedAt).toLocaleDateString(),
            })}
          </Text>
        ) : null}
      </View>
      <PlanetFacilityCardTitleBlock title={title} titleNumberOfLines={2} />
      <Text style={[fs.cardBody, styles.cardBodyGap]}>{description}</Text>
      <Text style={[fs.cardMeta, styles.timeLimitGap]}>
        {progress.status === 'active' && progress.expiresAtMs
          ? t('mission.timeLimit.remainingLine', {
              label: formatMissionTimeLimitRemaining(progress.expiresAtMs, nowMs),
            })
          : t('mission.timeLimit.descLine', {
              label:
                formatMissionTimeLimitAssigned(resolveMissionTimeLimitHours(mission))
                ?? t('mission.timeLimit.none'),
            })}
      </Text>
      <Text style={[fs.cardMeta, styles.rewardGap]}>{rewardLine}</Text>
      <View style={styles.objectiveList}>
        {mission.objectives.map((objective) => {
          const done = progress.objectives[objective.id] === true;
          const label = resolveMissionObjectiveDescription(objective, locale);
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

export function BarMissionStatusTab() {
  const t = useT();
  const progresses = useMissionStore((s) => s.progresses);
  const activeMissionId = useMissionStore((s) => s.activeMissionId);
  const clearedArcInstSnapshots = useMissionStore((s) => s.clearedArcInstSnapshots);
  const sweepExpiredMissions = useMissionStore((s) => s.sweepExpiredMissions);
  useEffect(() => {
    sweepExpiredMissions({ notify: true });
  }, [sweepExpiredMissions]);
  const activeTutorial = useMemo(
    () => listActiveTutorialStatusRows(progresses, activeMissionId),
    [progresses, activeMissionId],
  );
  const activeMainStory = useMemo(
    () => listActiveMainStoryStatusRows(progresses, activeMissionId),
    [progresses, activeMissionId],
  );
  const activeQuest = useMemo(
    () => listActiveQuestStatusRows(progresses, activeMissionId),
    [progresses, activeMissionId],
  );
  const completedTutorial = useMemo(
    () => listCompletedTutorialStatusRows(progresses),
    [progresses],
  );
  const completedMainStory = useMemo(
    () => listCompletedMainStoryStatusRows(progresses),
    [progresses],
  );
  const completedQuest = useMemo(
    () => listCompletedQuestStatusRows(progresses, clearedArcInstSnapshots),
    [progresses, clearedArcInstSnapshots],
  );
  const nearestExpiryMs = useMemo(() => {
    let min: number | undefined;
    const rows = Object.values(progresses);
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i]!;
      if (row.status !== 'active' || typeof row.expiresAtMs !== 'number') continue;
      if (min == null || row.expiresAtMs < min) min = row.expiresAtMs;
    }
    return min;
  }, [progresses]);
  const nowMs = useMissionTimeLimitNow(nearestExpiryMs);
  const isEmpty =
    activeTutorial.length === 0
    && activeMainStory.length === 0
    && activeQuest.length === 0
    && completedTutorial.length === 0
    && completedMainStory.length === 0
    && completedQuest.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={fs.empty}>{t('bar.missionStatus.empty')}</Text>
      </View>
    );
  }

  const renderActiveSection = (
    title: string,
    metaKey: string,
    rows: typeof activeTutorial,
    emptyKey: string,
    first?: boolean,
  ) => (
    <>
      <PlanetFacilitySectionHeader
        first={first}
        title={title}
        meta={t(metaKey, { count: rows.length })}
      />
      {rows.length === 0 ? (
        <Text style={fs.sectionEmpty}>{t(emptyKey)}</Text>
      ) : (
        rows.map((row) => (
          <MissionStatusCard
            key={row.mission.id}
            mission={row.mission}
            progress={row.progress}
            isPrimaryActive={row.isPrimaryActive}
            nowMs={nowMs}
          />
        ))
      )}
    </>
  );

  const renderCompleteSection = (
    title: string,
    metaKey: string,
    rows: typeof completedTutorial,
    emptyKey: string,
  ) => {
    const shownRows = rows.slice(0, COMPLETED_MISSION_RENDER_CAP);
    const hiddenCount = rows.length - shownRows.length;
    return (
      <>
        <PlanetFacilitySectionHeader
          title={title}
          meta={t(metaKey, { count: rows.length })}
        />
        {rows.length === 0 ? (
          <Text style={fs.sectionEmpty}>{t(emptyKey)}</Text>
        ) : (
          <>
            {shownRows.map((row) => (
              <MissionStatusCard
                key={row.mission.id}
                mission={row.mission}
                progress={row.progress}
                isPrimaryActive={false}
                nowMs={nowMs}
              />
            ))}
            {hiddenCount > 0 ? (
              <Text style={fs.sectionEmpty}>
                {t('bar.missionStatus.moreCompleted', { count: hiddenCount })}
              </Text>
            ) : null}
          </>
        )}
      </>
    );
  };

  return (
    <View>
      {renderActiveSection(
        t('bar.missionStatus.sectionTutorialActive'),
        'bar.missionStatus.activeMeta',
        activeTutorial,
        'bar.missionStatus.noTutorialActive',
        true,
      )}
      {renderActiveSection(
        t('bar.missionStatus.sectionMainStoryActive'),
        'bar.missionStatus.activeMeta',
        activeMainStory,
        'bar.missionStatus.noMainStoryActive',
      )}
      {renderActiveSection(
        t('bar.missionStatus.sectionQuestActive'),
        'bar.missionStatus.activeMeta',
        activeQuest,
        'bar.missionStatus.noQuestActive',
      )}
      {renderCompleteSection(
        t('bar.missionStatus.sectionTutorialComplete'),
        'bar.missionStatus.completeMeta',
        completedTutorial,
        'bar.missionStatus.noTutorialComplete',
      )}
      {renderCompleteSection(
        t('bar.missionStatus.sectionMainStoryComplete'),
        'bar.missionStatus.completeMeta',
        completedMainStory,
        'bar.missionStatus.noMainStoryComplete',
      )}
      {renderCompleteSection(
        t('bar.missionStatus.sectionQuestComplete'),
        'bar.missionStatus.completeMeta',
        completedQuest,
        'bar.missionStatus.noQuestComplete',
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
    marginBottom: 4,
  },
  timeLimitGap: {
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
