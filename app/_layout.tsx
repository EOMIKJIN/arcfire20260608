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
  Linking,
  LogBox,
  Platform,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../src/utils/theme';
import { t as tStatic } from '../src/i18n';
import { usePlayerStore } from '../src/store/playerStore';
import { useMissionStore } from '../src/store/missionStore';
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
import { useWorldObjectRuntimeStore } from '../src/store/worldObjectRuntimeStore';
import { initGuestAuth } from '../src/firebase/auth';
import { arcCoreHub } from '../src/arcCore/ArcCoreHub';
import { attachArcCoreRuntimeCommandBridge } from '../src/arcCore/ArcCoreRuntimeBridge';
import { ArcOverlayHost } from '../src/ui/overlay/ArcOverlayHost';
import { LevelUpOverlayBridge } from '../src/ui/overlay/LevelUpOverlayBridge';
import { useArcOverlayStore } from '../src/ui/overlay/arcOverlayStore';
import { initializeFirebase, logAppOpen } from '../utils/logger';
import { cancelScheduledUserCloudSync, scheduleUserCloudSync } from '../src/firebase/userCloudSyncSchedule';
import { resolveAppVersion, syncUserDataWithServer } from '../src/firebase/userDataSync';
import { ensureArcCoreCollectionSeeded } from '../src/firebase/arccoreFirestoreBootstrap';
import {
  applyArcCoreWallClockCatchUpFromPersistedGap,
  persistArcCoreWallClockLeftActiveNow,
} from '../src/arcCore/arcCoreWallClockSessionPersistence';
import { loadArcExpansionTestOneShotDoneFromStorage } from '../src/arcCore/arcCoreExpansionTestFlags';
import {
  getLastProductionBootResult,
  runProductionBootBootstrap,
} from '../src/game/productionBootBootstrap';
import {
  compareSemver,
  fetchAppUpdatePolicyFromArcCore,
  type AppUpdatePolicy,
} from '../src/firebase/appUpdatePolicy';
import { runCriticalSessionAssetPrewarm } from '../src/assetPipeline/runCriticalSessionAssetPrewarm';
import { withBootTimeout } from '../src/utils/withBootTimeout';
import { buildCsvStaticIndexesMinimal } from '../src/game/buildCsvStaticIndexes';
import { markBootPerf, logBootPerfSummary } from '../src/game/bootPerformance';
import { useAabsPolicyStore } from '../src/arcCore/aabs/aabsPolicyStore';
import { useAppBootStore } from '../src/store/appBootStore';

type UpdateGateState = {
  visible: boolean;
  required: boolean;
  latestVersion: string;
  playStoreUrl: string | null;
};

export default function RootLayout() {
  const [bootReady, setBootReady] = useState(false);
  const [updateGate, setUpdateGate] = useState<UpdateGateState | null>(null);
  const loadLocalPlayer = usePlayerStore((s) => s.loadLocalPlayer);
  const loadLocalMissions = useMissionStore((s) => s.loadLocalMissions);
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
          loadLocalWorld(),
          loadLocalUserSession(),
          loadLocalItemLedger(),
          loadLocalAccountProfiles(),
          loadLocalSkillDb(),
          loadLocalNpcCaptainProgress(),
          loadLocalPlanetNebulaProfiles(),
          loadLocalBoard(),
        ]);
        await bootstrapWorldObjectRuntimeFromWorld(useWorldStore.getState().systems);
        await applyArcCoreWallClockCatchUpFromPersistedGap(arcCoreHub);
        await usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
        markBootPerf('storage_load_end');
        useClanWarFoundationStore
          .getState()
          .syncNpcAiClanTerritoryFromGalaxy(useWorldStore.getState().systems);
        ensureCaptainsRegistered(NPC_CAPTAINS_FROM_CSV.map(c => c.id));
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
        await withBootTimeout(
          'ensureArcCoreCollectionSeeded',
          12_000,
          () => ensureArcCoreCollectionSeeded({ uid: authUser!.uid }),
          undefined,
        );
        const currentVersion = resolveAppVersion();
        const emptyPolicy: AppUpdatePolicy = {
          latestVersion: null,
          minSupportedVersion: null,
          playStoreUrl: null,
        };
        const updatePolicy = await withBootTimeout(
          'fetchAppUpdatePolicyFromArcCore',
          10_000,
          fetchAppUpdatePolicyFromArcCore,
          emptyPolicy,
        );
        const latestVersion = updatePolicy.latestVersion;
        const minSupportedVersion = updatePolicy.minSupportedVersion;
        const latestAhead = latestVersion ? compareSemver(currentVersion, latestVersion) < 0 : false;
        const belowMinimum = minSupportedVersion
          ? compareSemver(currentVersion, minSupportedVersion) < 0
          : false;
        if (latestAhead || belowMinimum) {
          setUpdateGate({
            visible: true,
            required: belowMinimum,
            latestVersion: latestVersion ?? minSupportedVersion ?? currentVersion,
            playStoreUrl: updatePolicy.playStoreUrl,
          });
        }
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
    const detachArcCoreBridge = attachArcCoreRuntimeCommandBridge();
    return () => {
      detachArcCoreBridge();
      arcCoreHub.stop();
    };
  }, [bootReady]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        if (useWorldStore.getState().loaded) {
          void applyArcCoreWallClockCatchUpFromPersistedGap(arcCoreHub);
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
      <LevelUpOverlayBridge />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  /** 전환 중 스택 뒤가 비지 않도록 루트도 게임 배경색 */
  root: { flex: 1, backgroundColor: COLORS.bg_primary },
});
