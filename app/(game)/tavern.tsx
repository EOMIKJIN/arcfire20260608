// ============================================================
// 아크파이어 온라인 - 선술집(공지 보드)
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FONTS, SPACING } from '../../src/utils/theme';
import { TACTICAL_FACILITY as TF } from '../../src/ui/tactical/tacticalFacilityScreenTokens';
import { useT, t as tStatic } from '../../src/i18n';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import {
  createTavernScreenSession,
  HeavyUiStageErrorPanel,
  useHeavyUiDataSession,
} from '../../src/ui/heavyUiDataSession';
import { usePlanetSubStageMemory } from '../../src/hooks/usePlanetSubStageMemory';
import { usePlanetHubFacilityAccessGate } from '../../src/hooks/usePlanetHubFacilityAccessGate';
import { useLocaleRenderKey } from '../../src/hooks/useLocaleRenderKey';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import { useTavernBoardStore } from '../../src/store/tavernBoardStore';
import { useMenuNotificationStore } from '../../src/store/menuNotificationStore';
import { usePlayerStore } from '../../src/store/playerStore';
import { listNpcCaptains } from '../../src/npc/npcFleetRegistry';
import { resolveTavernHostCaptainAtPlanet } from '../../src/arcCore/captainPresence';
import { PlanetFacilityTabBar } from '../../src/ui/planetFacility/PlanetFacilityTabBar';
import {
  PlanetFacilityCardTitleBlock,
  PlanetFacilityListingTextBlock,
  PlanetFacilitySectionHeader,
  PlanetFacilityTitleHeader,
  planetFacilityScreenStyles as fs,
} from '../../src/ui/planetFacility/PlanetFacilityTitleHeader';
import { presentIngameDialogScene } from '../../src/game/ingameDialog';
import { resolveTavernHostDialogSceneId } from '../../src/game/ingameDialog/resolveTavernHostDialogSceneId';
import { formatCredits } from '../../src/utils/formatCredits';
import { readPlanetPopulationDomeDetail } from '../../src/game/planetDevelopment/planetPopulationDomeListing';
import { listActiveTavernBounties } from '../../src/game/tavern/tavernBountyGenerator';
import { resolveNoticeBody, resolveNoticeTitle } from '../../src/i18n/noticeText';
import { TavernMissionStatusTab } from '../../src/components/tavern/TavernMissionStatusTab';
import { TavernNewMissionTab } from '../../src/components/tavern/TavernNewMissionTab';
import type { TavernBoardTab } from '../../src/missions/tavernMissionBoard';

const TAVERN_BOTTOM_STAGE_RESERVE_PX = PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX;

function formatPostedAt(postedAtMs: number): string {
  const now = Date.now();
  const d = new Date(postedAtMs);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (now - postedAtMs < 24 * 60 * 60 * 1000) return tStatic('tavern.today', { hm });
  if (now - postedAtMs < 48 * 60 * 60 * 1000) return tStatic('tavern.yesterday', { hm });
  return tStatic('tavern.date', { month: d.getMonth() + 1, day: d.getDate(), hm });
}

export default function TavernScreen() {
  const t = useT();
  const localeRenderKey = useLocaleRenderKey();
  const player = usePlayerStore((s) => s.player);
  const notices = useTavernBoardStore((s) => s.notices);
  const currentPlanetId = player?.currentPlanetId ?? null;
  const [hostDialogVisible, setHostDialogVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TavernBoardTab>('board');
  const boardMeta = useMemo(
    () => t('tavern.boardMeta', { count: notices.length }),
    [notices.length, t],
  );
  const tavernBounties = useMemo(() => {
    if (!currentPlanetId) return [];
    const detail = readPlanetPopulationDomeDetail(currentPlanetId);
    return listActiveTavernBounties(detail.bountyBoard);
  }, [currentPlanetId]);
  const bountyMeta = useMemo(() => {
    const total = tavernBounties.reduce((sum, b) => sum + b.rewardCredits, 0);
    return t('tavern.bountyMeta', {
      count: tavernBounties.length,
      credits: formatCredits(total, { suffix: true }),
    });
  }, [tavernBounties, t]);
  const tavernHostCaptain = useMemo(() => {
    if (currentPlanetId) {
      const fromPresence = resolveTavernHostCaptainAtPlanet(currentPlanetId);
      if (fromPresence) return fromPresence;
    }
    const retiredPool = listNpcCaptains().filter((captain) => captain.tavernPlanetIds.length > 0);
    if (retiredPool.length === 0) return null;
    if (currentPlanetId) {
      const direct = retiredPool.find((captain) => captain.tavernPlanetIds.includes(currentPlanetId));
      if (direct) return direct;
      const hash = Array.from(currentPlanetId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      return retiredPool[hash % retiredPool.length] ?? retiredPool[0] ?? null;
    }
    return retiredPool[0] ?? null;
  }, [currentPlanetId]);
  const headerSubtitle = useMemo(() => {
    if (tavernHostCaptain) {
      return t('tavern.hostMeta', {
        name: tavernHostCaptain.displayName,
        rank: tavernHostCaptain.rank,
      });
    }
    return boardMeta;
  }, [tavernHostCaptain, boardMeta, t]);

  useEffect(() => {
    if (!hostDialogVisible || !tavernHostCaptain) return;
    const sceneId = resolveTavernHostDialogSceneId(tavernHostCaptain.id);
    presentIngameDialogScene(sceneId, { onDismiss: () => setHostDialogVisible(false) });
  }, [hostDialogVisible, tavernHostCaptain]);

  useEffect(() => {
    if (!tavernHostCaptain) {
      setHostDialogVisible(false);
      return;
    }
    setHostDialogVisible(true);
  }, [tavernHostCaptain]);

  useFocusEffect(
    useCallback(() => {
      useMenuNotificationStore.getState().clearBadge('tavern');
      if (!tavernHostCaptain) return;
      setHostDialogVisible(true);
    }, [tavernHostCaptain]),
  );

  const safeBack = useSafeRouterBack();
  const stageFrameReady = useStageFirstFrameReady();
  const tavernSessionConfig = useMemo(
    () => (currentPlanetId ? createTavernScreenSession(currentPlanetId) : null),
    [currentPlanetId],
  );
  const tavernSession = useHeavyUiDataSession(tavernSessionConfig);
  const screenReady = tavernSession.phase === 'ready' && stageFrameReady;
  usePlanetSubStageMemory('tavern', () => {
    setHostDialogVisible(false);
    setActiveTab('board');
  });
  usePlanetHubFacilityAccessGate('tavern');

  return (
    <StageShell
      key={localeRenderKey}
      routeName="tavern"
      background="none"
      edges={['bottom']}
      safeAreaBackgroundColor={TF.headerBg}
    >
      <View style={fs.root}>
        <PlanetFacilityTitleHeader
          title={t('tavern.title')}
          subtitle={headerSubtitle}
          onBack={safeBack}
          backLabel="◀ 나가기"
        />

        <View style={fs.bodyPanel}>
          <PlanetFacilityTabBar
            tabs={[
              { id: 'board', label: t('tavern.tab.board') },
              { id: 'mission_status', label: t('tavern.tab.missionStatus') },
              { id: 'new_missions', label: t('tavern.tab.newMissions') },
            ]}
            activeId={activeTab}
            onSelect={(id) => setActiveTab(id as TavernBoardTab)}
          />

          <ScrollView
            style={fs.scroll}
            contentContainerStyle={fs.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'board' ? (
              <>
                {tavernHostCaptain ? (
                  <View style={fs.stackCard}>
                    <PlanetFacilitySectionHeader inCard first title={t('tavern.hostCardTitle')} />
                    <Text style={styles.hostMeta}>
                      {t('tavern.hostMeta', {
                        name: tavernHostCaptain.displayName,
                        rank: tavernHostCaptain.rank,
                      })}
                    </Text>
                  </View>
                ) : null}

                <View style={fs.stackCard}>
                  <PlanetFacilitySectionHeader
                    inCard
                    first
                    title={t('tavern.bountySectionTitle')}
                    meta={bountyMeta}
                  />
                  {tavernBounties.map((bounty, idx) => (
                    <View key={bounty.id} style={[fs.insetSlot, idx > 0 && styles.insetEntryGap]}>
                      <View style={fs.cardTopRow}>
                        <Text style={fs.cardBadge}>
                          {t('tavern.bountyMercTier', { tier: bounty.mercTier })}
                        </Text>
                        <Text style={fs.cardMeta}>{formatPostedAt(bounty.postedAtMs)}</Text>
                      </View>
                      <PlanetFacilityCardTitleBlock
                        title={t(bounty.titleKey)}
                        description={t('tavern.bountyReward', {
                          credits: formatCredits(bounty.rewardCredits, { suffix: true }),
                        })}
                        descriptionLines={0}
                      />
                    </View>
                  ))}
                </View>

                <View style={fs.stackCard}>
                  <PlanetFacilitySectionHeader
                    inCard
                    first
                    title={t('tavern.boardTitle')}
                    meta={boardMeta}
                  />
                  {notices.map((notice, idx) => (
                    <View key={notice.id} style={[fs.listingEntryCard, idx > 0 && styles.insetEntryGap]}>
                      <View style={fs.cardTopRow}>
                        <Text style={fs.cardBadge}>[{t(`noticeTag.${notice.tag}`)}]</Text>
                        <Text style={fs.cardMeta}>{formatPostedAt(notice.postedAtMs)}</Text>
                      </View>
                      <PlanetFacilityListingTextBlock
                        title={resolveNoticeTitle(notice, t)}
                        description={resolveNoticeBody(notice, t)}
                        descriptionLines={0}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {activeTab === 'mission_status' ? <TavernMissionStatusTab /> : null}
            {activeTab === 'new_missions' ? (
              <TavernNewMissionTab
                planetId={currentPlanetId}
                playerLevel={player?.level ?? 1}
              />
            ) : null}

            <View style={{ height: TAVERN_BOTTOM_STAGE_RESERVE_PX }} />
          </ScrollView>

          <StageLoadingOverlay
            visible={!screenReady && tavernSession.phase !== 'error'}
            overlayId="stage-loading-tavern"
          />
          {tavernSession.phase === 'error' ? (
            <HeavyUiStageErrorPanel
              preflightCode={tavernSession.preflightCode}
              error={tavernSession.error}
              facilityKind="tavern"
              onRetry={tavernSession.retry}
              onBack={safeBack}
            />
          ) : null}
        </View>
      </View>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  hostMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.titleInk,
    textAlign: 'center',
  },
  insetEntryGap: {
    marginTop: SPACING.xs,
  },
});
