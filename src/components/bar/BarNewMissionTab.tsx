import React, { useCallback, useEffect, useMemo } from 'react';
import {
  formatMissionTimeLimitAssigned,
  formatMissionTimeLimitRemaining,
  resolveMissionTimeLimitHours,
} from '../../missions/missionTimeLimit';
import { useMissionTimeLimitNow } from '../../missions/useMissionTimeLimitNow';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { useT } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { useMissionStore } from '../../store/missionStore';
import {
  resolveMissionDescription,
  resolveMissionTitle,
} from '../../i18n/missionText';
import { resolveNpcCaptainDisplayName, resolveNpcCaptainRank } from '../../i18n/captainText';
import { formatCredits } from '../../utils/formatCredits';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import { resolveCaptainAiClanDisplayName } from '../../clanWar/aiClanRegistry';
import { tryAcceptInstanceMissionWithFeedback } from '../../missions/instanceMissionAcceptFeedback';
import { syncArcCoreBarInstanceBoardForPlanet } from '../../arcCore/missions/runArcCoreInstanceMissionDailyPass';
import { tryPresentPendingMissionClearDialog } from '../../missions/presentPendingMissionClearDialog';
import {
  listBarInstanceMissionOffers,
  type InstanceMissionOfferState,
  type QuestMissionOfferRow,
} from '../../missions/barMissionBoard';
import { useArcCoreInstanceMissionBoardStore } from '../../store/arcCoreInstanceMissionBoardStore';
import {
  PlanetFacilityCardTitleBlock,
  PlanetFacilitySectionHeader,
  planetFacilityScreenStyles as fs,
} from '../../ui/planetFacility/PlanetFacilityTitleHeader';
import { ArcButton } from '../../ui/overlay/ArcButton';
import type { Mission } from '../../types';

type BarNewMissionTabProps = {
  planetId: string | null;
  playerLevel: number;
};

function stateBadgeLabel(state: InstanceMissionOfferState, t: (key: string) => string): string {
  switch (state) {
    case 'available':
      return t('bar.newMissions.stateAvailable');
    case 'level_locked':
      return t('bar.newMissions.stateLevelLocked');
    case 'in_progress':
      return t('bar.newMissions.stateInProgress');
    case 'completed':
      return t('bar.newMissions.stateCompleted');
    default:
      return '';
  }
}


function InstanceMissionCard({
  mission,
  state,
  planetId,
  playerLevel,
  arcCoreAuto,
  expiresAtMs,
  nowMs,
}: {
  mission: Mission;
  state: InstanceMissionOfferState;
  planetId: string;
  playerLevel: number;
  arcCoreAuto?: QuestMissionOfferRow['arcCoreAuto'];
  expiresAtMs?: number;
  nowMs: number;
}) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const captain = mission.offerCaptainId ? getNpcCaptain(mission.offerCaptainId) : undefined;
  const captainClanName = captain ? resolveCaptainAiClanDisplayName(captain, locale) : null;
  const title = resolveMissionTitle(mission, locale);
  const description = resolveMissionDescription(mission, locale);
  const canAccept = state === 'available';

  const categoryLabel = arcCoreAuto
    ? t(`bar.newMissions.category.${arcCoreAuto.categoryTag}`)
    : null;
  const difficultyLabel = mission.instanceDifficultyTier
    ? t(`bar.newMissions.difficulty.${mission.instanceDifficultyTier}`)
    : null;

  const handleAccept = useCallback(() => {
    tryAcceptInstanceMissionWithFeedback(mission.id, { planetId, playerLevel }, t);
    tryPresentPendingMissionClearDialog();
  }, [mission.id, planetId, playerLevel, t]);

  return (
    <View style={fs.stackCard}>
      <View style={fs.cardTopRow}>
        <Text style={fs.cardBadge}>{stateBadgeLabel(state, t)}</Text>
        {arcCoreAuto ? (
          <Text style={[fs.cardMeta, styles.arcCoreBadge]}>
            {t('bar.newMissions.arcCoreAuto')} · {categoryLabel}
            {difficultyLabel ? ` · ${difficultyLabel}` : ''}
          </Text>
        ) : null}
        <Text style={fs.cardMeta}>
          {t('bar.newMissions.levelRequired', { level: mission.levelRequired ?? 1 })}
        </Text>
      </View>
      <PlanetFacilityCardTitleBlock title={title} titleNumberOfLines={2} />
      {captain ? (
        <Text style={[fs.cardMeta, styles.clientMeta]}>
          {captainClanName
            ? t('bar.newMissions.clientClan', {
                name: resolveNpcCaptainDisplayName(captain, locale),
                rank: resolveNpcCaptainRank(captain, locale),
                clan: captainClanName,
              })
            : t('bar.newMissions.client', {
                name: resolveNpcCaptainDisplayName(captain, locale),
                rank: resolveNpcCaptainRank(captain, locale),
              })}
        </Text>
      ) : null}
      <Text style={[fs.cardBody, styles.cardBodyGap]}>{description}</Text>
      <Text style={[fs.cardMeta, styles.timeLimitGap]}>
        {state === 'in_progress' && expiresAtMs
          ? t('mission.timeLimit.remainingLine', {
              label: formatMissionTimeLimitRemaining(expiresAtMs, nowMs),
            })
          : t('mission.timeLimit.descLine', {
              label:
                formatMissionTimeLimitAssigned(resolveMissionTimeLimitHours(mission))
                ?? t('mission.timeLimit.none'),
            })}
      </Text>
      <Text style={[fs.cardMeta, styles.rewardGap]}>
        {t('bar.mission.rewardLine', {
          credits: formatCredits(mission.rewards.credits, { suffix: true }),
          exp: mission.rewards.exp,
        })}
      </Text>
      <ArcButton
        label={canAccept ? t('bar.newMissions.accept') : t('bar.newMissions.acceptUnavailable')}
        variant={canAccept ? 'tacticalPrimary' : 'tacticalSecondary'}
        disabled={!canAccept}
        onPress={handleAccept}
        style={styles.acceptBtn}
      />
    </View>
  );
}

export function BarNewMissionTab({ planetId, playerLevel }: BarNewMissionTabProps) {
  const t = useT();
  const progresses = useMissionStore((s) => s.progresses);
  const sweepExpiredMissions = useMissionStore((s) => s.sweepExpiredMissions);
  useEffect(() => {
    sweepExpiredMissions({ notify: true });
  }, [sweepExpiredMissions]);
  useEffect(() => {
    if (!planetId) return;
    syncArcCoreBarInstanceBoardForPlanet(planetId);
  }, [planetId]);
  const listedCountForPlanet = useArcCoreInstanceMissionBoardStore((s) => {
    if (!planetId) return 0;
    let count = 0;
    for (const entry of s.entries) {
      if (entry.offerPlanetId === planetId && entry.boardStatus === 'listed') count += 1;
    }
    return count;
  });
  const offers = useMemo(() => {
    if (!planetId) return [];
    return listBarInstanceMissionOffers(planetId, playerLevel, progresses);
  }, [planetId, playerLevel, progresses, listedCountForPlanet]);
  const nearestExpiryMs = useMemo(() => {
    let min: number | undefined;
    for (let i = 0; i < offers.length; i += 1) {
      const exp = progresses[offers[i]!.mission.id]?.expiresAtMs;
      if (typeof exp !== 'number') continue;
      if (min == null || exp < min) min = exp;
    }
    return min;
  }, [offers, progresses]);
  const nowMs = useMissionTimeLimitNow(nearestExpiryMs);
  const meta = t('bar.newMissions.meta', { count: offers.length });

  if (!planetId) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={fs.empty}>{t('bar.newMissions.noPlanet')}</Text>
      </View>
    );
  }

  return (
    <View>
      <PlanetFacilitySectionHeader first title={t('bar.newMissions.sectionTitle')} meta={meta} />
      {offers.length === 0 ? (
        <Text style={fs.sectionEmpty}>{t('bar.newMissions.empty')}</Text>
      ) : (
        offers.map((row) => (
          <InstanceMissionCard
            key={row.mission.id}
            mission={row.mission}
            state={row.state}
            planetId={planetId}
            playerLevel={playerLevel}
            arcCoreAuto={row.arcCoreAuto}
            expiresAtMs={progresses[row.mission.id]?.expiresAtMs}
            nowMs={nowMs}
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
  clientMeta: {
    marginBottom: 4,
  },
  cardBodyGap: {
    marginBottom: 4,
  },
  timeLimitGap: {
    marginBottom: 6,
  },
  rewardGap: {
    marginBottom: SPACING.sm,
  },
  acceptBtn: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingVertical: SPACING.xs,
  },
  arcCoreBadge: {
    marginRight: SPACING.xs,
  },
});
