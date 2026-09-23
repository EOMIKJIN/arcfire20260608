// ============================================================
// 아크파이어 온라인 - 바 (술사주기 메인 + 공지/미션 부탭)
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FONTS, SPACING } from '../../src/utils/theme';
import { TACTICAL_FACILITY as TF } from '../../src/ui/tactical/tacticalFacilityScreenTokens';
import { useT, t as tStatic } from '../../src/i18n';
import { resolveNpcCaptainDisplayName } from '../../src/i18n/captainText';
import { useAppSettingsStore } from '../../src/store/appSettingsStore';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import {
  createBarScreenSession,
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
import { useBarBoardStore } from '../../src/store/barBoardStore';
import {
  isLivePaidPatronageSession,
  useBarPatronageStore,
} from '../../src/store/barPatronageStore';
import { useMenuNotificationStore } from '../../src/store/menuNotificationStore';
import { usePlayerStore } from '../../src/store/playerStore';
import { listNpcCaptains } from '../../src/npc/npcFleetRegistry';
import { resolveBarHostCaptainAtPlanet } from '../../src/arcCore/captainPresence';
import { PlanetFacilityTabBar } from '../../src/ui/planetFacility/PlanetFacilityTabBar';
import {
  PlanetFacilityListingTextBlock,
  PlanetFacilitySectionHeader,
  PlanetFacilityTitleHeader,
  planetFacilityScreenStyles as fs,
} from '../../src/ui/planetFacility/PlanetFacilityTitleHeader';
import { resolvePlanetBarDomeLevelForMissions } from '../../src/missions/barInstanceDomeLevel';
import { resolveNoticeBody, resolveNoticeTitle } from '../../src/i18n/noticeText';
import { BarMissionStatusTab } from '../../src/components/bar/BarMissionStatusTab';
import { BarNewMissionTab } from '../../src/components/bar/BarNewMissionTab';
import { BarPatronageLoungeTab } from '../../src/components/bar/BarPatronageLoungeTab';
import { BarPatronagePerformView } from '../../src/components/bar/BarPatronagePerformView';
import type { BarBoardTab } from '../../src/missions/barMissionBoard';
import {
  buildBarPatronageRoster,
  resolveBarDrinkForBarLevel,
  getBarAttendantById,
  kstDayKey,
  listDialogTurnsForAttendant,
  listHostDialogTurns,
  resolvePatronageDrinkAffordableQty,
  resolvePatronageDrinkMaxQty,
  resolveBarDrinkUnitPrice,
} from '../../src/game/bar/patronage/barPatronageTables';
import {
  pickHostOfferTurns,
  presentBarDialogTurns,
} from '../../src/game/bar/patronage/barPatronageDialog';
import { resolveBarHostPortraitByCaptainId } from '../../src/game/bar/patronage/barPatronagePortrait';
import { isIngameDialogActive, presentIngameDialogScene } from '../../src/game/ingameDialog/ingameDialogApi';
import { useUiScreenShell } from '../../src/ui/process/useUiScreenShell';
import { isTalkNpcBarConversation } from '../../src/missions/talkNpcObjective';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { presentArcOverlayTradeQuantity } from '../../src/ui/overlay/presentArcTradeQuantity';
import { playBarVoiceClip, stopBarVoice } from '../../src/audio/barVoicePlayer';
import {
  resolveBarDialogVoiceClipForAttendant,
  resolveBarVoiceClipForAttendant,
} from '../../src/game/bar/patronage/barVoiceResolve';

const BAR_BOTTOM_STAGE_RESERVE_PX = PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX;

/** 공연 시작 후 곡 1회. 대사 중·루프 재생 금지. */
function startBarPerformanceSong(attendantId: string, sessionStartedAtMs: number): void {
  const clip = resolveBarVoiceClipForAttendant(attendantId);
  if (!clip) return;
  void playBarVoiceClip({
    layer: 'song',
    playKey: `${attendantId}:${sessionStartedAtMs}:${clip.clipId}`,
    assetKey: clip.assetKey,
    loop: false,
  });
}

function formatPostedAt(postedAtMs: number): string {
  const now = Date.now();
  const d = new Date(postedAtMs);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (now - postedAtMs < 24 * 60 * 60 * 1000) return tStatic('bar.today', { hm });
  if (now - postedAtMs < 48 * 60 * 60 * 1000) return tStatic('bar.yesterday', { hm });
  return tStatic('bar.date', { month: d.getMonth() + 1, day: d.getDate(), hm });
}

export default function BarScreen() {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const localeRenderKey = useLocaleRenderKey();
  const player = usePlayerStore((s) => s.player);
  const notices = useBarBoardStore((s) => s.notices);
  const currentPlanetId = player?.currentPlanetId ?? null;
  const activeSession = useBarPatronageStore((s) => s.activeSession);
  const [activeTab, setActiveTab] = useState<BarBoardTab>('lounge');
  const [gateAccepted, setGateAccepted] = useState(false);
  const hostOfferShownRef = useRef(false);
  /** 술사주기 직후 공연전 대사가 끝날 때까지 곡 보류 */
  const holdSongForIntroRef = useRef(false);

  const boardMeta = useMemo(
    () => t('bar.boardMeta', { count: notices.length }),
    [notices.length, t],
  );
  const barLevel = useMemo(() => {
    if (!currentPlanetId) return 1;
    return Math.max(1, resolvePlanetBarDomeLevelForMissions(currentPlanetId) || 1);
  }, [currentPlanetId]);

  const roster = useMemo(() => {
    if (!currentPlanetId) return [];
    return buildBarPatronageRoster({
      planetId: currentPlanetId,
      barLevel,
      dayKey: kstDayKey(),
    });
  }, [currentPlanetId, barLevel]);

  const barHostCaptain = useMemo(() => {
    if (currentPlanetId) {
      const fromPresence = resolveBarHostCaptainAtPlanet(currentPlanetId);
      if (fromPresence) return fromPresence;
    }
    const retiredPool = listNpcCaptains().filter((captain) => captain.barPlanetIds.length > 0);
    if (retiredPool.length === 0) return null;
    if (currentPlanetId) {
      const direct = retiredPool.find((captain) => captain.barPlanetIds.includes(currentPlanetId));
      if (direct) return direct;
      const hash = Array.from(currentPlanetId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      return retiredPool[hash % retiredPool.length] ?? retiredPool[0] ?? null;
    }
    return retiredPool[0] ?? null;
  }, [currentPlanetId]);

  const hostDisplayName = useMemo(
    () => (barHostCaptain
      ? resolveNpcCaptainDisplayName(barHostCaptain, locale)
      : t('bar.defaultPilot')),
    [barHostCaptain, locale, t],
  );
  const hostPortrait = useMemo(
    () => resolveBarHostPortraitByCaptainId(barHostCaptain?.id),
    [barHostCaptain?.id],
  );

  const headerSubtitle = useMemo(() => {
    if (barHostCaptain) {
      return t('bar.hostMeta', {
        name: hostDisplayName,
        rank: barHostCaptain.rank,
      });
    }
    return boardMeta;
  }, [barHostCaptain, boardMeta, t, hostDisplayName]);

  const presentHostOffer = useCallback((opts?: { replay?: boolean }) => {
    if (!currentPlanetId) return;
    if (isIngameDialogActive()) return;
    if (!opts?.replay && hostOfferShownRef.current) return;

    if (!opts?.replay) {
      const questTalk = isTalkNpcBarConversation(currentPlanetId, barHostCaptain?.id);
      if (questTalk) {
        hostOfferShownRef.current = true;
        presentIngameDialogScene(questTalk.sceneId, {
          completionActions: [{
            type: 'complete_talk_npc',
            captainId: questTalk.captainId,
            planetId: currentPlanetId,
          }],
          onDismiss: () => {
            setGateAccepted(true);
          },
        });
        return;
      }
    }

    hostOfferShownRef.current = true;
    const turns = pickHostOfferTurns();
    const loc = locale === 'en' ? 'en' : 'ko';
    const hostName = barHostCaptain
      ? resolveNpcCaptainDisplayName(barHostCaptain, locale)
      : t('bar.defaultPilot');
    const hostCaptainId = barHostCaptain?.id;
    const planetId = currentPlanetId;
    const skipAcceptAfterTalk = Boolean(opts?.replay && gateAccepted);

    const presentAcceptDecline = () => {
      if (skipAcceptAfterTalk) return;
      showArcAlert(
        t('bar.patronage.hostOfferTitle', { name: hostName }),
        t('bar.patronage.hostOfferFallback'),
        [
          {
            text: t('bar.patronage.accept'),
            onPress: () => {
              setGateAccepted(true);
              useBarPatronageStore.getState().expireSessionIfNeeded();
              setActiveTab('lounge');
            },
          },
          {
            text: t('bar.patronage.decline'),
            style: 'cancel',
            onPress: () => {
              setGateAccepted(false);
              const declineTurns = listHostDialogTurns().filter(
                (x) => x.speechAct === 'host_decline_ack',
              );
              void presentBarDialogTurns({
                turns: declineTurns,
                locale: loc,
                label: hostName,
                planetId,
                hostCaptainId,
              });
            },
          },
        ],
        { autoDismissMs: 0 },
      );
    };

    if (turns.length > 0) {
      void presentBarDialogTurns({
        turns,
        locale: loc,
        label: hostName,
        planetId,
        hostCaptainId,
        onDismiss: presentAcceptDecline,
      });
      return;
    }
    presentAcceptDecline();
  }, [currentPlanetId, locale, t, barHostCaptain, gateAccepted]);

  useFocusEffect(
    useCallback(() => {
      useMenuNotificationStore.getState().clearBadge('bar');
      hostOfferShownRef.current = false;
      setGateAccepted(false);
      setActiveTab('lounge');
      useBarPatronageStore.getState().endSession();
      return () => {
        useBarPatronageStore.getState().endSession();
      };
    }, []),
  );

  const safeBack = useSafeRouterBack();
  const stageFrameReady = useStageFirstFrameReady();
  const barSessionConfig = useMemo(
    () => (currentPlanetId ? createBarScreenSession(currentPlanetId) : null),
    [currentPlanetId],
  );
  const barSession = useHeavyUiDataSession(barSessionConfig);
  const screenReady = barSession.phase === 'ready' && stageFrameReady;
  const { visitGen } = useUiScreenShell('bar', screenReady);

  useEffect(() => {
    if (!screenReady || visitGen === 0) return;
    presentHostOffer();
  }, [screenReady, visitGen, presentHostOffer]);

  usePlanetSubStageMemory('bar', () => {
    hostOfferShownRef.current = false;
    holdSongForIntroRef.current = false;
    setGateAccepted(false);
    setActiveTab('lounge');
    void stopBarVoice();
    useBarPatronageStore.getState().endSession();
  });
  usePlanetHubFacilityAccessGate('bar');

  const showPerformTab =
    gateAccepted && isLivePaidPatronageSession(activeSession, currentPlanetId);

  const voiceSessionKey =
    activeSession && isLivePaidPatronageSession(activeSession, currentPlanetId)
      ? `${activeSession.attendantId}:${activeSession.startedAtMs}`
      : '';

  useEffect(() => {
    if (!voiceSessionKey) {
      void stopBarVoice();
      return;
    }
    const session = useBarPatronageStore.getState().activeSession;
    if (!session) {
      void stopBarVoice();
      return;
    }
    const dialogClip = resolveBarDialogVoiceClipForAttendant(session.attendantId);
    if (dialogClip) {
      void playBarVoiceClip({
        layer: 'dialog',
        playKey: `${voiceSessionKey}:${dialogClip.clipId}`,
        assetKey: dialogClip.assetKey,
        loop: dialogClip.loop,
      });
    }
  }, [voiceSessionKey]);

  useEffect(() => {
    return () => {
      void stopBarVoice();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'perform' && !showPerformTab) {
      setActiveTab('lounge');
    }
  }, [activeTab, showPerformTab]);

  const buyDrinkFor = useCallback(
    (attendantId: string) => {
      if (!currentPlanetId) return;
      const drink = resolveBarDrinkForBarLevel(barLevel);
      const attendant = getBarAttendantById(attendantId);
      const name =
        locale === 'en'
          ? attendant?.displayNameEn ?? attendantId
          : attendant?.displayNameKo ?? attendantId;
      const drinkName = locale === 'en' ? drink.displayNameEn : drink.displayNameKo;
      const latest = usePlayerStore.getState().player;
      const credits = latest?.credits ?? 0;
      const unitPrice = resolveBarDrinkUnitPrice(currentPlanetId, drink.drinkId);

      if (credits < unitPrice) {
        showArcAlert(t('bar.patronage.buyFailTitle'), t('bar.patronage.errCredits'), undefined, {
          autoDismissMs: 0,
        });
        return;
      }

      const maxQty = resolvePatronageDrinkMaxQty();
      const affordableQty = resolvePatronageDrinkAffordableQty({
        unitPrice,
        playerCredits: credits,
      });
      const minutesEach = Math.round(drink.durationSec / 60);

      presentArcOverlayTradeQuantity({
        mode: 'buy',
        title: t('bar.patronage.qtyTitle', { name, drink: drinkName }),
        unitPrice,
        minQty: 1,
        maxQty,
        initialQty: 1,
        playerCredits: credits,
        demandLabel: t('bar.patronage.qtyAffordable', { max: affordableQty }),
        itemDescription: t('bar.patronage.qtyDesc', {
          minutes: minutesEach,
        }),
        tips: [],
        onConfirm: (qty) => {
          const buyQty = Math.max(1, Math.floor(qty));
          const res = useBarPatronageStore.getState().startOrExtendSession({
            planetId: currentPlanetId,
            attendantId,
            drinkId: drink.drinkId,
            drinkCount: buyQty,
          });
          if (!res.ok) {
            const reasonKey =
              res.reason === 'insufficient_credits'
                ? 'bar.patronage.errCredits'
                : 'bar.patronage.errGeneric';
            showArcAlert(t('bar.patronage.buyFailTitle'), t(reasonKey), undefined, {
              autoDismissMs: 0,
            });
            return;
          }
          setGateAccepted(true);
          setActiveTab('perform');
          const turns = listDialogTurnsForAttendant({
            dialogSetId: attendant?.dialogSetId ?? '',
            maxBundleTier: res.session.unlockedBundleTier,
          }).slice(0, Math.min(5, 2 + buyQty));
          const startedAtMs = res.session.startedAtMs;
          holdSongForIntroRef.current = true;
          const dialogPayload = {
            turns,
            locale: (locale === 'en' ? 'en' : 'ko') as 'en' | 'ko',
            label: name,
            planetId: currentPlanetId,
            attendantId,
            onDismiss: () => {
              holdSongForIntroRef.current = false;
              startBarPerformanceSong(attendantId, startedAtMs);
            },
          };
          InteractionManager.runAfterInteractions(() => {
            requestAnimationFrame(() => {
              void presentBarDialogTurns(dialogPayload);
            });
          });
        },
      });
    },
    [currentPlanetId, locale, t, barLevel],
  );

  return (
    <StageShell
      key={localeRenderKey}
      routeName="bar"
      background="none"
      edges={['bottom']}
      safeAreaBackgroundColor={TF.headerBg}
    >
      <View style={fs.root}>
        <PlanetFacilityTitleHeader
          title={t('bar.title')}
          subtitle={headerSubtitle}
          onBack={safeBack}
          backLabel={t('common.back')}
        />

        <View style={fs.bodyPanel}>
          <PlanetFacilityTabBar
            tabs={[
              { id: 'lounge', label: t('bar.tab.lounge') },
              ...(showPerformTab
                ? [{ id: 'perform' as const, label: t('bar.tab.perform') }]
                : []),
              { id: 'board', label: t('bar.tab.board') },
              { id: 'mission_status', label: t('bar.tab.missionStatus') },
              { id: 'new_missions', label: t('bar.tab.newMissions') },
            ]}
            activeId={activeTab}
            onSelect={(id) => {
              if (id === 'perform' && !showPerformTab) return;
              setActiveTab(id as BarBoardTab);
              if (id === 'perform' && !holdSongForIntroRef.current && activeSession) {
                startBarPerformanceSong(activeSession.attendantId, activeSession.startedAtMs);
              }
            }}
          />

          <ScrollView
            style={fs.scroll}
            contentContainerStyle={fs.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'lounge' ? (
              <BarPatronageLoungeTab
                roster={roster}
                onPatronize={buyDrinkFor}
                onPressHostCard={() => presentHostOffer({ replay: true })}
                hostPortrait={hostPortrait}
                hostName={hostDisplayName}
                planetId={currentPlanetId ?? ''}
              />
            ) : null}

            {activeTab === 'perform' && showPerformTab ? (
              <BarPatronagePerformView
                onAddDrink={() => {
                  if (activeSession) buyDrinkFor(activeSession.attendantId);
                }}
                onLeave={() => {
                  void stopBarVoice();
                  useBarPatronageStore.getState().endSession();
                  setActiveTab('lounge');
                }}
              />
            ) : null}

            {activeTab === 'board' ? (
              <>
                {barHostCaptain ? (
                  <View style={fs.stackCard}>
                    <PlanetFacilitySectionHeader inCard first title={t('bar.hostCardTitle')} />
                    <Text style={styles.hostMeta}>
                      {t('bar.hostMeta', {
                        name: resolveNpcCaptainDisplayName(barHostCaptain, locale),
                        rank: barHostCaptain.rank,
                      })}
                    </Text>
                  </View>
                ) : null}

                <View style={fs.stackCard}>
                  <PlanetFacilitySectionHeader
                    inCard
                    first
                    title={t('bar.boardTitle')}
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

            {activeTab === 'mission_status' ? <BarMissionStatusTab /> : null}
            {activeTab === 'new_missions' ? (
              <BarNewMissionTab
                planetId={currentPlanetId}
                playerLevel={player?.level ?? 1}
              />
            ) : null}

            <View style={{ height: BAR_BOTTOM_STAGE_RESERVE_PX }} />
          </ScrollView>

          <StageLoadingOverlay
            visible={!screenReady && barSession.phase !== 'error'}
            overlayId="stage-loading-bar"
          />
          {barSession.phase === 'error' ? (
            <HeavyUiStageErrorPanel
              preflightCode={barSession.preflightCode}
              error={barSession.error}
              facilityKind="bar"
              onRetry={barSession.retry}
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
