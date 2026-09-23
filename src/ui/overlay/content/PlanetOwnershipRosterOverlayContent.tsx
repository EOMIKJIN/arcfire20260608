import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayPlanetOwnershipRosterEntry } from '../arcOverlayStore';
import { useT } from '../../../i18n';
import { resolveProfessionName } from '../../../i18n/professionText';
import { FONTS, SPACING } from '../../../utils/theme';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import {
  TACTICAL_OVERLAY,
  tacticalOverlaySectionStyles as section,
} from '../tacticalOverlayStyles';
import {
  PlanetFacilityCardTitleBlock,
  planetFacilityScreenStyles as fs,
} from '../../planetFacility/PlanetFacilityTitleHeader';
import {
  fetchPlanetUniqueDeedRoster,
  type PlanetUniqueDeedRow,
} from '../../../firebase/planetUniqueDeedLock';
import { mergePlanetUniqueDeedRosterRows } from '../../../firebase/planetUniqueDeedModel';
import {
  collectLocalPlayerUniqueDeedRows,
  resolveMegaFactionDisplayNameForDeed,
} from '../../../game/planetOwnership/claimPlanetOwnershipWithUniqueLock';
import { getPlayerProfessionById } from '../../../game/playerPilotProfessionModel';
import { useClanWarFoundationStore } from '../../../store/clanWarFoundationStore';
import { usePlanetDeedCashGrantStore } from '../../../store/planetDeedCashGrantStore';
import { usePlayerStore } from '../../../store/playerStore';
import { useAppSettingsStore } from '../../../store/appSettingsStore';
import type { Player } from '../../../types';
import { resolveCoreOpenGameplayPlanetRef } from '../../../world/coreOpenGameplayPlanets';

type Props = {
  entry: ArcOverlayPlanetOwnershipRosterEntry;
  onClose: () => void;
};

type RosterPhase = 'loading' | 'ready' | 'offline' | 'auth';

function formatSecuredDate(ms: number): string {
  const d = new Date(ms);
  if (!Number.isFinite(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function resolvePlanetDisplayName(planetId: string): string {
  return resolveCoreOpenGameplayPlanetRef(planetId)?.planet.name?.trim() || planetId;
}

function resolveLocalCharacterLine(
  row: PlanetUniqueDeedRow,
  player: Player | null,
  locale: 'ko' | 'en',
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (!player || player.uid !== row.ownerUid) return '';
  const ship = player.ship?.name?.trim() || '';
  const professionRow = getPlayerProfessionById(player.pilotProfile?.professionId);
  const profession = professionRow ? resolveProfessionName(professionRow, locale).trim() : '';
  if (profession && ship) return t('planet.rankingCardPilotShip', { profession, ship });
  if (ship) return t('planet.rankingCardShip', { ship });
  if (profession) return t('planet.rankingCardPilot', { profession });
  return '';
}

export const PlanetOwnershipRosterOverlayContent = memo(function PlanetOwnershipRosterOverlayContent({
  onClose,
}: Props) {
  const t = useT();
  const locale = useAppSettingsStore((s) => (s.locale === 'en' ? 'en' : 'ko'));
  const visualTheme = resolveArcOverlayVisualTheme('planetOwnershipRoster');
  const [phase, setPhase] = useState<RosterPhase>('loading');
  const [rows, setRows] = useState<PlanetUniqueDeedRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const clan = useClanWarFoundationStore.getState();
      const grant = usePlanetDeedCashGrantStore.getState();
      await Promise.all([
        clan.hydrated ? Promise.resolve() : clan.loadLocalClanWarFoundation(),
        grant.hydrated ? Promise.resolve() : grant.hydrate(),
      ]);
      if (cancelled) return;
      const player = usePlayerStore.getState().player;
      const local = player?.uid ? collectLocalPlayerUniqueDeedRows(player.uid) : [];
      setRows(mergePlanetUniqueDeedRosterRows([], local));
      const first = await fetchPlanetUniqueDeedRoster();
      if (cancelled) return;
      if (!first.ok) {
        setRows(mergePlanetUniqueDeedRosterRows([], local));
        setPhase(first.reason === 'cloud_auth' ? 'auth' : 'offline');
        return;
      }
      setRows(mergePlanetUniqueDeedRosterRows(first.rows, local));
      setPhase('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const player = usePlayerStore((s) => s.player);
  const showCards = rows.length > 0;
  const hint =
    phase === 'ready'
      ? t('planet.rankingHint')
      : phase === 'loading' && showCards
        ? t('planet.rankingHintFetching')
        : phase === 'loading'
          ? t('planet.rankingHint')
          : t('planet.rankingHintLocal');

  return (
    <ArcOverlayCard
      layout="panel"
      visualTheme={visualTheme}
      title={t('planet.rankingTitle')}
      subtitle={t('planet.rankingSubtitle', { count: rows.length })}
      onClose={onClose}
      footer={
        <ArcOverlayFooterActions
          visualTheme={visualTheme}
          confirmOnly
          onConfirm={onClose}
          confirmLabel={t('hubTalk.close')}
        />
      }
    >
      <Text style={[section.sectionLabel, styles.sectionFirst]}>{t('planet.rankingSection')}</Text>
      <Text style={styles.sectionHint}>{hint}</Text>
      {phase === 'loading' && !showCards ? (
        <Text style={styles.empty}>{t('planet.rankingLoading')}</Text>
      ) : null}
      {phase === 'offline' ? (
        <Text style={styles.empty}>{t('planet.rankingOffline')}</Text>
      ) : null}
      {phase === 'auth' ? (
        <Text style={styles.empty}>{t('planet.rankingAuth')}</Text>
      ) : null}
      {phase !== 'loading' && rows.length === 0 ? (
        <>
          <Text style={styles.empty}>{t('planet.rankingEmpty')}</Text>
          <Text style={styles.empty}>{t('planet.rankingEmptyHint')}</Text>
        </>
      ) : null}
      {showCards
        ? rows.map((row) => {
            const planetName = resolvePlanetDisplayName(row.planetId);
            const faction = resolveMegaFactionDisplayNameForDeed(row.megaFactionId, locale);
            const character = resolveLocalCharacterLine(row, player, locale, t);
            return (
              <View key={`${row.ownerUid}:${row.planetId}`} style={fs.listingCard}>
                <View style={fs.listingLeft}>
                  <PlanetFacilityCardTitleBlock
                    title={t('planet.rankingOwnedLine', { nickname: row.nickname, planet: planetName })}
                    description={
                      faction
                        ? t('planet.rankingCardMetaFaction', { level: row.playerLevel, faction })
                        : t('planet.rankingCardMeta', { level: row.playerLevel })
                    }
                    descriptionLines={2}
                  />
                  <Text style={styles.secured}>
                    {t('planet.rankingSecured', { date: formatSecuredDate(row.securedAt) })}
                  </Text>
                  {character ? <Text style={styles.secured}>{character}</Text> : null}
                </View>
              </View>
            );
          })
        : null}
    </ArcOverlayCard>
  );
});

const styles = StyleSheet.create({
  sectionFirst: {
    marginTop: 0,
  },
  sectionHint: {
    marginBottom: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_OVERLAY.labelInk,
  },
  empty: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_OVERLAY.labelInk,
    marginBottom: SPACING.sm,
  },
  secured: {
    marginTop: 4,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_OVERLAY.labelInk,
  },
});
