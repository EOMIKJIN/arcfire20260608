import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { useT } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { useMissionStore } from '../../store/missionStore';
import {
  resolveMissionDescription,
  resolveMissionTitle,
} from '../../i18n/missionText';
import { formatCredits } from '../../utils/formatCredits';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import { tryAcceptInstanceMissionWithFeedback } from '../../missions/instanceMissionAcceptFeedback';
import {
  listTavernInstanceMissionOffers,
  type InstanceMissionOfferState,
} from '../../missions/tavernMissionBoard';
import {
  PlanetFacilityCardTitleBlock,
  PlanetFacilitySectionHeader,
  planetFacilityScreenStyles as fs,
} from '../../ui/planetFacility/PlanetFacilityTitleHeader';
import { ArcButton } from '../../ui/overlay/ArcButton';
import type { Mission } from '../../types';

type TavernNewMissionTabProps = {
  planetId: string | null;
  playerLevel: number;
};

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

function stateBadgeLabel(state: InstanceMissionOfferState, t: (key: string) => string): string {
  switch (state) {
    case 'available':
      return t('tavern.newMissions.stateAvailable');
    case 'level_locked':
      return t('tavern.newMissions.stateLevelLocked');
    case 'in_progress':
      return t('tavern.newMissions.stateInProgress');
    case 'completed':
      return t('tavern.newMissions.stateCompleted');
    default:
      return '';
  }
}


function InstanceMissionCard({
  mission,
  state,
  planetId,
  playerLevel,
}: {
  mission: Mission;
  state: InstanceMissionOfferState;
  planetId: string;
  playerLevel: number;
}) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const captain = mission.offerCaptainId ? getNpcCaptain(mission.offerCaptainId) : undefined;
  const title = resolveMissionTitleText(mission, t, locale);
  const description = resolveMissionDescText(mission, t, locale);
  const canAccept = state === 'available';

  const handleAccept = useCallback(() => {
    tryAcceptInstanceMissionWithFeedback(mission.id, { planetId, playerLevel }, t);
  }, [mission.id, planetId, playerLevel, t]);

  return (
    <View style={fs.stackCard}>
      <View style={fs.cardTopRow}>
        <Text style={fs.cardBadge}>{stateBadgeLabel(state, t)}</Text>
        <Text style={fs.cardMeta}>
          {t('tavern.newMissions.levelRequired', { level: mission.levelRequired ?? 1 })}
        </Text>
      </View>
      <PlanetFacilityCardTitleBlock title={title} titleNumberOfLines={2} />
      {captain ? (
        <Text style={[fs.cardMeta, styles.clientMeta]}>
          {t('tavern.newMissions.client', { name: captain.displayName, rank: captain.rank })}
        </Text>
      ) : null}
      <Text style={[fs.cardBody, styles.cardBodyGap]}>{description}</Text>
      <Text style={[fs.cardMeta, styles.rewardGap]}>
        {t('tavern.mission.rewardLine', {
          credits: formatCredits(mission.rewards.credits, { suffix: true }),
          exp: mission.rewards.exp,
        })}
      </Text>
      <ArcButton
        label={canAccept ? t('tavern.newMissions.accept') : t('tavern.newMissions.acceptUnavailable')}
        variant={canAccept ? 'tacticalPrimary' : 'tacticalSecondary'}
        disabled={!canAccept}
        onPress={handleAccept}
        style={styles.acceptBtn}
      />
    </View>
  );
}

export function TavernNewMissionTab({ planetId, playerLevel }: TavernNewMissionTabProps) {
  const t = useT();
  const progresses = useMissionStore((s) => s.progresses);
  const offers = useMemo(() => {
    if (!planetId) return [];
    return listTavernInstanceMissionOffers(planetId, playerLevel, progresses);
  }, [planetId, playerLevel, progresses]);
  const meta = t('tavern.newMissions.meta', { count: offers.length });

  if (!planetId) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={fs.empty}>{t('tavern.newMissions.noPlanet')}</Text>
      </View>
    );
  }

  return (
    <View>
      <PlanetFacilitySectionHeader first title={t('tavern.newMissions.sectionTitle')} meta={meta} />
      {offers.length === 0 ? (
        <Text style={fs.sectionEmpty}>{t('tavern.newMissions.empty')}</Text>
      ) : (
        offers.map((row) => (
          <InstanceMissionCard
            key={row.mission.id}
            mission={row.mission}
            state={row.state}
            planetId={planetId}
            playerLevel={playerLevel}
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
});
