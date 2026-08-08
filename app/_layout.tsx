// ============================================================
// 아크파이어 온라인 - 루트 레이아웃
// ============================================================

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  AppState,
  InteractionManager,
  Linking,
  LogBox,
  Platform,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../src/utils/theme';
import { t as tStatic } from '../src/i18n';
import { usePlayerStore } from '../src/store/playerStore';
import { useMissionStore } from '../src/store/missionStore';
import { useArcCoreInstanceMissionBoardStore } from '../src/store/arcCoreInstanceMissionBoardStore';
import { useWorldStore } from '../src/store/worldStore';
import { useNpcCaptainProgressStore } from '../src/store/npcCaptainProgressStore';
import { NPC_CAPTAINS_FROM_CSV } from '../src/data/generated';
import { useUserSessionStore } from '../src/store/userSessionStore';
import { useItemLedgerStore } from '../src/store/itemLedgerStore';
import { useAccountProfileStore } from '../src/store/accountProfileStore';
import { useSkillDbStore } from '../src/store/skillDbStore';
import { useClanWarFoundationStore } from '../src/store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../src/store/planetCoreRuntimeStore';
import { usePlanetNebulaStore } from '../src/store/planetNebulaStore';
import { useTavernBoardStore } from '../src/store/tavernBoardStore';
import { hydrateCombatMatchTelemetryCache } from '../src/store/combatMatchTelemetryStore';
import { useWorldObjectRuntimeStore } from '../src/store/worldObjectRuntimeStore';
import { initGuestAuth } from '../src/firebase/auth';
import {
  ensureFirebaseAnonymousAuthForCloudBoot,
  scheduleFirebaseAnonymousAuthWarmup,
} from '../src/firebase/firebaseAnonymousAuth';
import { arcCoreHub } from '../src/arcCore/ArcCoreHub';
import { attachArcCoreRuntimeCommandBridge } from '../src/arcCore/ArcCoreRuntimeBridge';
import { ArcOverlayHost } from '../src/ui/overlay/ArcOverlayHost';
import { IngameDialogHost } from '../src/game/ingameDialog/IngameDialogHost';
import { LevelUpOverlayBridge } from '../src/ui/overlay/LevelUpOverlayBridge';
import { useArcOverlayStore } from '../src/ui/overlay/arcOverlayStore';
import { initializeFirebase, logAppOpen } from '../src/utils/logger';
import { cancelScheduledUserCloudSync, scheduleUserCloudSync } from '../src/firebase/userCloudSyncSchedule';
import { resolveAppVersion, syncUserDataWithServer } from '../src/firebase/userDataSync';
import { ensureArcCoreCollectionSeeded } from '../src/firebase/arccoreFirestoreBootstrap';
import { fetchArcCoreRtdbBootSyncOnce } from '../src/firebase/fetchArcCoreRtdbOnce';
import {
  applyArcCoreWallClockCatchUpFromPersistedGap,
  persistArcCoreWallClockLeftActiveNow,
} from '../src/arcCore/arcCoreWallClockSessionPersistence';
import { requestTerritorialCombatProbeAfterCatchUp } from '../src/arcCore/territorial/requestTerritorialCombatProbe';
import { scheduleArcCoreShadowPairingPassAfterBoot } from '../src/arcCore/shadow/runArcCoreShadowPairingPass';
import { loadArcExpansionTestOneShotDoneFromStorage } from '../src/arcCore/arcCoreExpansionTestFlags';
import {
  getLastProductionBootResult,
  runProductionBootBootstrap,
} from '../src/game/productionBootBootstrap';
import {
  resolveAppUpdateGateAfterBoot,
} from '../src/firebase/appUpdatePolicy';
import { buildCsvStaticIndexesMinimal } from '../src/game/buildCsvStaticIndexes';
import { installNativeReclaimBootstrap } from '../src/game/nativeReclaim/nativeReclaimBootstrap';
import { markBootPerf, logBootPerfSummary } from '../src/game/bootPerformance';
import { useAabsPolicyStore } from '../src/arcCore/aabs/aabsPolicyStore';
import { useAppBootStore } from '../src/store/appBootStore';
import { installDevMetroReloadGuard, registerDevHotModuleDisposeGuard } from '../src/game/devMetroReloadGuard';
import { resumePlayerToLastHubPlanet } from '../src/game/galaxyMapSessionResume';
import { IdleSessionRestartGuard } from '../src/components/IdleSessionRestartGuard';
import { GameSaveRestorePendingConsumer } from '../src/firebase/gameSaveBackup/GameSaveRestorePendingConsumer';
import { registerRunningArcCoreWallClockCatchUp } from '../src/arcCore/schedule/arcCoreWallClockCatchUpGate';
import { preloadRegisteredUiSfx } from '../src/audio';

type UpdateGateState = {
  visible: boolean;
  required: boolean;
  latestVersion: string;
  playStoreUrl: string | null;
};

/**
 * 아크코어 벽시계 catch-up·territorial probe 시작 지연 — 타이틀 네비/IM 대기열과
 * 분리하기 위한 Promise-내부 defer(2026-07-19). **버튼 활성과는 무관**.
 */
const ARC_CORE_CATCH_UP_DEFER_MS = 400;

export default function RootLayout() {
  const [bootReady, setBootReady] = useState(false);
  const [updateGate, setUpdateGate] = useState<UpdateGateState | null>(null);
  const loadLocalPlayer = usePlayerStore((s) => s.loadLocalPlayer);
  const loadLocalMissions = useMissionStore((s) => s.loadLocalMissions);
  const loadLocalArcCoreInstanceMissionBoard = useArcCoreInstanceMissionBoardStore(
    (s) => s.loadLocalArcCoreInstanceMissionBoard,
  );
  const loadLocalWorld = useWorldStore((s) => s.loadLocalWorld);
  const loadLocalNpcCaptainProgress = useNpcCaptainProgressStore((s) => s.loadLocalNpcCaptainProgress);
  const ensureCaptainsRegistered = useNpcCaptainProgressStore((s) => s.ensureCaptainsRegistered);
  const loadLocalUserSession = useUserSessionStore((s) => s.loadLocalUserSession);
  const recordAppLaunch = useUserSessionStore((s) => s.recordAppLaunch);
  const resumeForegroundSession = useUserSessionStore((s) => s.resumeForegroundSession);
  const finalizeForegroundSlice = useUserSessionStore((s) => s.finalizeForegroundSlice);
  const persistUserSession = useUserSessionStore((s) => s.persistUserSession);
  const loadLocalItemLedger = useItemLedgerStore((s) => s.loadLocalItemLedger);
  const persistItemLedger = useItemLedgerStore((s) => s.persistItemLedger);
  const ensureAccountLedger = useItemLedgerStore((s) => s.ensureAccountLedger);
  const loadLocalAccountProfiles = useAccountProfileStore((s) => s.loadLocalAccountProfiles);
  const persistAccountProfiles = useAccountProfileStore((s) => s.persistAccountProfiles);
  const ensureAccountProfile = useAccountProfileStore((s) => s.ensureAccountProfile);
  const syncFromPlayerAndSession = useAccountProfileStore((s) => s.syncFromPlayerAndSession);
  const loadLocalSkillDb = useSkillDbStore((s) => s.loadLocalSkillDb);
  const persistSkillDb = useSkillDbStore((s) => s.persistSkillDb);
  const ensureSkillDb = useSkillDbStore((s) => s.ensureSkillDb);
  const syncOwnedSkills = useSkillDbStore((s) => s.syncOwnedSkills);
  const loadLocalClanWarFoundation = useClanWarFoundationStore((s) => s.loadLocalClanWarFoundation);
  const loadLocalPlanetNebulaProfiles = usePlanetNebulaStore((s) => s.loadLocalProfiles);
  const loadLocalBoard = useTavernBoardStore((s) => s.loadLocalBoard);
  const bootstrapWorldObjectRuntimeFromWorld = useWorldObjectRuntimeStore((s) => s.bootstrapFromWorld);

  useEffect(() => {
    initializeFirebase();
    void logAppOpen();
  }, []);

  useEffect(() => {
    installDevMetroReloadGuard();
  }, []);

  useEffect(() => {
    LogBox.ignoreLogs([
      'deprecated',
      'Deprecation',
      'is deprecated',
    ]);
  }, []);

  useEffect(() => {
    void (async () => {
      let authUser: Awaited<ReturnType<typeof initGuestAuth>> | null = null;
      markBootPerf('layout_effect_start');
      try {
        buildCsvStaticIndexesMinimal();
        await useAabsPolicyStore.getState().loadAsync();
        await runProductionBootBootstrap();
        const authUserResult = await initGuestAuth();
        authUser = authUserResult;
        if (getLastProductionBootResult()?.devHarness) {
          await loadArcExpansionTestOneShotDoneFromStorage();
        }
        markBootPerf('storage_load_start');
        await Promise.all([
          loadLocalPlayer(),
          loadLocalClanWarFoundation(),
          loadLocalMissions(),
          loadLocalArcCoreInstanceMissionBoard(),
          loadLocalWorld(),
          loadLocalUserSession(),
          loadLocalItemLedger(),
          loadLocalAccountProfiles(),
          loadLocalSkillDb(),
          loadLocalNpcCaptainProgress(),
          loadLocalPlanetNebulaProfiles(),
          loadLocalBoard(),
        ]);
        await hydrateCombatMatchTelemetryCache();
        await bootstrapWorldObjectRuntimeFromWorld(useWorldStore.getState().systems);
        await usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
        markBootPerf('storage_load_end');
        useClanWarFoundationStore
          .getState()
          .syncNpcAiClanTerritoryFromGalaxy(useWorldStore.getState().systems, {
            skipOccupationSeedPipeline: true,
          });
        ensureCaptainsRegistered(NPC_CAPTAINS_FROM_CSV.map(c => c.id));
        resumePlayerToLastHubPlanet();
        const p = usePlayerStore.getState().player;
        const session = useUserSessionStore.getState().record;
        const nickname = p?.nickname ?? null;
        if (p?.uid) {
          useClanWarFoundationStore.getState().ensureSoloClan(p.uid, p.nickname, p.political.megaFactionId);
          ensureAccountLedger(p.uid);
          ensureAccountProfile(p.uid, p.nickname);
          ensureSkillDb(p.uid);
          syncFromPlayerAndSession(p, session);
          syncOwnedSkills({
            uid: p.uid,
            ownedSkillIds: p.skills,
            playerLevel: p.level,
            source: 'unknown',
          });
        }
        recordAppLaunch(nickname);
      } finally {
        markBootPerf('boot_ready');
        logBootPerfSummary('root_layout');
        setBootReady(true);
        // 타이틀 버튼 활성화 게이트 — 로컬 하이드레이션·월드/코어 부트스트랩이 모두 끝난
        // 이 시점에만 true. 이후 버튼 탭이 무거운 부트와 경합해 렉이 나지 않게 한다.
        useAppBootStore.getState().setBootReady(true);
        InteractionManager.runAfterInteractions(() => {
          installNativeReclaimBootstrap();
          scheduleFirebaseAnonymousAuthWarmup();
        });
        void Promise.all([
          persistUserSession(),
          persistItemLedger(),
          persistAccountProfiles(),
          persistSkillDb(),
        ]).catch(() => {
          /* 부팅 직후 persist 실패 — 다음 저장 주기에 재시도 */
        });
      }

      // 네트워크만 타이틀 백그라운드. 이미지/세션 prewarm은 차원항로(이어하기) 구간만
      // (`runContinueSessionPrewarm`) — 시작화면 버튼 지연·JS 경합 금지(2026-08-04 대표님).
      // Auth → Firestore 시드/RTDB boot 순서로 레이스·rules 실패를 줄인다(타이틀 bootReady는 이미 true).
      void (async () => {
        try {
          if (!authUser) return;
          await ensureFirebaseAnonymousAuthForCloudBoot();
          void syncUserDataWithServer();
          void ensureArcCoreCollectionSeeded({ uid: authUser.uid }).catch(() => {
            /* 오프라인 — arccore 시드 생략 */
          });
          void fetchArcCoreRtdbBootSyncOnce({ uid: authUser.uid }).catch(() => {
            /* RTDB 미배포·오프라인 — 번들 SIM 정본, [boot] 경고 없음 */
          });
          // 아크코어 섀도우 페어링 소급 패스 — 기존 유저 포함 전 유저 동일, 부트당 1회 지연 실행
          scheduleArcCoreShadowPairingPassAfterBoot();
          void resolveAppUpdateGateAfterBoot(resolveAppVersion())
            .then((gate) => {
              if (gate) setUpdateGate(gate);
            })
            .catch(() => {
              /* 오프라인 — 업데이트 안내 생략 */
            });
        } catch {
          /* 부팅 후 백그라운드 — 실패해도 로컬 플레이 진행 */
        }
      })();
    })();
  }, [
    ensureAccountProfile,
    ensureAccountLedger,
    ensureCaptainsRegistered,
    ensureSkillDb,
    loadLocalAccountProfiles,
    loadLocalClanWarFoundation,
    loadLocalItemLedger,
    loadLocalMissions,
    loadLocalArcCoreInstanceMissionBoard,
    loadLocalNpcCaptainProgress,
    loadLocalPlanetNebulaProfiles,
    loadLocalBoard,
    bootstrapWorldObjectRuntimeFromWorld,
    loadLocalPlayer,
    loadLocalSkillDb,
    loadLocalUserSession,
    loadLocalWorld,
    persistAccountProfiles,
    persistItemLedger,
    persistSkillDb,
    persistUserSession,
    recordAppLaunch,
    syncFromPlayerAndSession,
    syncOwnedSkills,
    syncUserDataWithServer,
  ]);

  useEffect(() => {
    if (!bootReady) return;
    markBootPerf('arc_core_start');
    arcCoreHub.bootstrapDefaultSubCores();
    arcCoreHub.start();
    // UI SFX — 등록된 리소스만 유휴 preload (타이틀 버튼·부트 경로 비차단). 미등록이면 no-op.
    const sfxWarm = InteractionManager.runAfterInteractions(() => {
      void preloadRegisteredUiSfx();
    });
    // 타이틀 버튼: bootReady 직후 즉시 postBootSettled (catch-up·일일배치·prewarm 대기 금지).
    // 무거운 합류는 차원항로 `runContinueSessionPrewarm` 전담(2026-08-04 대표님 · 개발규칙).
    // catch-up Promise는 **즉시 등록**(defer는 Promise 내부) — 탭이 400ms 전에 와도 wait가 누락되지 않음.
    markBootPerf('post_boot_settled');
    useAppBootStore.getState().setPostBootSettled(true);
    const catchUpWork = (async () => {
      await new Promise<void>((r) => setTimeout(r, ARC_CORE_CATCH_UP_DEFER_MS));
      try {
        const t0 = Date.now();
        await applyArcCoreWallClockCatchUpFromPersistedGap(arcCoreHub);
        const t1 = Date.now();
        await requestTerritorialCombatProbeAfterCatchUp();
        const t2 = Date.now();
        // eslint-disable-next-line no-console
        if (__DEV__)
          console.log(`[title-diag] catchUp=${t1 - t0}ms probe=${t2 - t1}ms`);
      } catch {
        /* catch-up 실패해도 게임 진행은 막지 않는다 */
      }
    })();
    registerRunningArcCoreWallClockCatchUp(catchUpWork);
    const detachArcCoreBridge = attachArcCoreRuntimeCommandBridge();
    return () => {
      sfxWarm.cancel?.();
      detachArcCoreBridge();
      arcCoreHub.stop();
    };
  }, [bootReady]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        if (useWorldStore.getState().loaded) {
          // 백그라운드 장기 체류 후 복귀 catch-up — 부트 경로와 동일하게 setTimeout으로 분리해
          // InteractionManager 대기열(화면 자체 네비게이션도 쓰는)과 경합하지 않게 한다.
          setTimeout(() => {
            const work = (async () => {
              try {
                await applyArcCoreWallClockCatchUpFromPersistedGap(arcCoreHub);
                await requestTerritorialCombatProbeAfterCatchUp();
              } catch {
                /* catch-up 실패해도 게임 진행은 막지 않는다 */
              }
            })();
            registerRunningArcCoreWallClockCatchUp(work);
          }, ARC_CORE_CATCH_UP_DEFER_MS);
        }
        resumeForegroundSession();
        void persistUserSession();
        const p = usePlayerStore.getState().player;
        const session = useUserSessionStore.getState().record;
        if (p?.uid) {
          syncFromPlayerAndSession(p, session);
          syncOwnedSkills({
            uid: p.uid,
            ownedSkillIds: p.skills,
            playerLevel: p.level,
            source: 'unknown',
          });
          void persistAccountProfiles();
          void persistSkillDb();
          scheduleUserCloudSync();
        }
        return;
      }
      void persistArcCoreWallClockLeftActiveNow();
      finalizeForegroundSlice();
      cancelScheduledUserCloudSync();
      void persistUserSession();
      const p = usePlayerStore.getState().player;
      const session = useUserSessionStore.getState().record;
      if (p?.uid) {
        syncFromPlayerAndSession(p, session);
        void persistAccountProfiles();
      }
    });
    return () => {
      finalizeForegroundSlice();
      cancelScheduledUserCloudSync();
      void persistUserSession();
      const p = usePlayerStore.getState().player;
      const session = useUserSessionStore.getState().record;
      if (p?.uid) {
        syncFromPlayerAndSession(p, session);
        void persistAccountProfiles();
      }
      sub.remove();
    };
  }, [
    finalizeForegroundSlice,
    cancelScheduledUserCloudSync,
    persistAccountProfiles,
    persistSkillDb,
    persistUserSession,
    resumeForegroundSession,
    scheduleUserCloudSync,
    syncFromPlayerAndSession,
    syncOwnedSkills,
  ]);

  /** Android 하단 3버튼 내비게이션 바 자동 숨김 (제스처 내비 기기는 OS 정책상 숨김 불가인 경우 있음) */
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const apply = () => {
      void (async () => {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
        } catch {
          // Expo Go / 미지원 환경
        }
      })();
    };

    apply();
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') apply();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const gateId = 'app-update-gate';
    if (!updateGate?.visible) {
      useArcOverlayStore.getState().dismissWhere((e) => e.id === gateId);
      return;
    }
    const storeUrl =
      updateGate.playStoreUrl
      ?? 'https://play.google.com/store/apps/details?id=com.arcfire.online';
    const message = updateGate.required
      ? tStatic('updateGate.requiredMsg', { version: updateGate.latestVersion })
      : tStatic('updateGate.optionalMsg', { version: updateGate.latestVersion });
    useArcOverlayStore.getState().present({
      id: gateId,
      kind: 'alert',
      title: updateGate.required ? tStatic('updateGate.requiredTitle') : tStatic('updateGate.optionalTitle'),
      message,
      dismissOnBackdrop: !updateGate.required,
      buttons: updateGate.required
        ? [{ text: tStatic('updateGate.update'), onPress: () => { void Linking.openURL(storeUrl); } }]
        : [
            {
              text: tStatic('updateGate.later'),
              style: 'cancel',
              onPress: () => setUpdateGate((prev) => (prev ? { ...prev, visible: false } : prev)),
            },
            { text: tStatic('updateGate.update'), onPress: () => { void Linking.openURL(storeUrl); } },
          ],
    });
    return () => {
      useArcOverlayStore.getState().dismissWhere((e) => e.id === gateId);
    };
  }, [updateGate]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <IdleSessionRestartGuard>
        <GameSaveRestorePendingConsumer />
        <StatusBar style="light" backgroundColor="#060A14" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: COLORS.bg_primary },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(game)" />
        </Stack>
        <ArcOverlayHost />
        <IngameDialogHost />
        <LevelUpOverlayBridge />
      </IdleSessionRestartGuard>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  /** 전환 중 스택 뒤가 비지 않도록 루트도 게임 배경색 */
  root: { flex: 1, backgroundColor: COLORS.bg_primary },
});

registerDevHotModuleDisposeGuard('root_layout');
