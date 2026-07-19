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
import { scheduleFirebaseAnonymousAuthWarmup } from '../src/firebase/firebaseAnonymousAuth';
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
import { waitForArcCoreDailyBatchIdle } from '../src/arcCore/schedule/arcCoreDailyBatchGate';
import { scheduleArcCoreShadowPairingPassAfterBoot } from '../src/arcCore/shadow/runArcCoreShadowPairingPass';
import { loadArcExpansionTestOneShotDoneFromStorage } from '../src/arcCore/arcCoreExpansionTestFlags';
import {
  getLastProductionBootResult,
  runProductionBootBootstrap,
} from '../src/game/productionBootBootstrap';
import {
  resolveAppUpdateGateAfterBoot,
} from '../src/firebase/appUpdatePolicy';
import { runCriticalSessionAssetPrewarm } from '../src/assetPipeline/runCriticalSessionAssetPrewarm';
import { buildCsvStaticIndexesMinimal } from '../src/game/buildCsvStaticIndexes';
import { installNativeReclaimBootstrap } from '../src/game/nativeReclaim/nativeReclaimBootstrap';
import { markBootPerf, logBootPerfSummary } from '../src/game/bootPerformance';
import { useAabsPolicyStore } from '../src/arcCore/aabs/aabsPolicyStore';
import { useAppBootStore } from '../src/store/appBootStore';
import { installDevMetroReloadGuard, registerDevHotModuleDisposeGuard } from '../src/game/devMetroReloadGuard';
import { resumePlayerToLastHubPlanet } from '../src/game/galaxyMapSessionResume';
import { IdleSessionRestartGuard } from '../src/components/IdleSessionRestartGuard';
import { GameSaveRestorePendingConsumer } from '../src/firebase/gameSaveBackup/GameSaveRestorePendingConsumer';

type UpdateGateState = {
  visible: boolean;
  required: boolean;
  latestVersion: string;
  playStoreUrl: string | null;
};

/**
 * 아크코어 벽시계 catch-up·territorial probe 시작 지연 — 타이틀 화면 자체 네비게이션이
 * 쓰는 InteractionManager 대기열과 분리하기 위해 setTimeout으로 둔다(2026-07-19).
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

      // 네트워크·프리웜은 타이틀 표시 후 백그라운드 — 스플래시 직후 별도 로딩 화면을 두지 않는다.
      void runCriticalSessionAssetPrewarm();
      void syncUserDataWithServer();
      try {
        if (!authUser) return;
        void ensureArcCoreCollectionSeeded({ uid: authUser.uid }).catch(() => {
          /* 오프라인 — arccore 시드 생략 */
        });
        void fetchArcCoreRtdbBootSyncOnce({ uid: authUser!.uid }).catch(() => {
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
    // 벽시계 catch-up(장시간 미접속 시 일괄 진행)·territorial probe가 끝난 뒤에야
    // 타이틀 버튼을 연다(postBootSettled). 버튼 로딩 게이지 = 실제 작동 가능 타이밍과 일치.
    // (2026-07-19: 과거엔 이 작업을 버튼 활성화 뒤 백그라운드로 미뤘는데, 동기 구간이
    //  탭 직후 2~3초 UI를 막아 「버튼은 켜졌는데 로딩화면이 안 뜨는」 불일치가 재발했음.
    //  지금은 catch-up·일일배치·territorial 패스가 전부 yieldJsThread로 청크화되어 있어
    //  스피너가 도는 동안 타이틀 렌더·터치가 굶지 않고, 완료 후엔 잔여 블로킹이 없다.)
    let settled = false;
    const settlePostBoot = () => {
      if (settled) return;
      settled = true;
      markBootPerf('post_boot_settled');
      useAppBootStore.getState().setPostBootSettled(true);
    };
    // 안전 데드라인: catch-up이 비정상적으로 오래 걸려도 버튼이 영구 잠기지 않게 한다.
    // (잔여 작업은 청크화되어 있어 데드라인 후 열려도 탭이 막히지 않는다.)
    const settleDeadlineTimer = setTimeout(settlePostBoot, 12_000);
    const catchUpTimer = setTimeout(() => {
      void (async () => {
        try {
          const t0 = Date.now();
          await applyArcCoreWallClockCatchUpFromPersistedGap(arcCoreHub);
          const t1 = Date.now();
          await requestTerritorialCombatProbeAfterCatchUp();
          const t2 = Date.now();
          // catch-up 도중 void로 발화된 일일 배치가 아직 돌고 있으면 종료까지 합류 —
          // 버튼이 열린 직후 탭이 배치 청크와 경합해 수 초 멈추는 재발(17:51 logcat) 방지.
          await waitForArcCoreDailyBatchIdle();
          // eslint-disable-next-line no-console
          if (__DEV__)
            console.log(
              `[title-diag] catchUp=${t1 - t0}ms probe=${t2 - t1}ms dailyBatchJoin=${Date.now() - t2}ms`,
            );
        } catch {
          /* catch-up 실패해도 게임 진행은 막지 않는다 */
        } finally {
          settlePostBoot();
        }
      })();
    }, ARC_CORE_CATCH_UP_DEFER_MS);
    const detachArcCoreBridge = attachArcCoreRuntimeCommandBridge();
    return () => {
      clearTimeout(settleDeadlineTimer);
      clearTimeout(catchUpTimer);
      settlePostBoot();
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
            void (async () => {
              try {
                await applyArcCoreWallClockCatchUpFromPersistedGap(arcCoreHub);
                await requestTerritorialCombatProbeAfterCatchUp();
              } catch {
                /* catch-up 실패해도 게임 진행은 막지 않는다 */
              }
            })();
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
