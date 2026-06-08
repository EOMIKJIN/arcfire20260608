// ============================================================
// 아크파이어 온라인 - 루트 레이아웃
// ============================================================

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  AppState,
  Linking,
  LogBox,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../src/utils/theme';
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
import { consumeFreshStartFlag, initGuestAuth } from '../src/firebase/auth';
import { arcCoreHub, attachArcCoreRuntimeCommandBridge } from '../src/arcCore';
import { ArcMessageModalHost } from '../src/components/ArcMessageModalHost';
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
  compareSemver,
  fetchAppUpdatePolicyFromArcCore,
  type AppUpdatePolicy,
} from '../src/firebase/appUpdatePolicy';
import { runCriticalSessionAssetPrewarm } from '../src/assetPipeline/runCriticalSessionAssetPrewarm';
import { withBootTimeout } from '../src/utils/withBootTimeout';
import { buildCsvStaticIndexes } from '../src/game/buildCsvStaticIndexes';
import { useAabsPolicyStore } from '../src/arcCore/aabs/aabsPolicyStore';

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
      try {
        // Table-First: CSV 정적 Map 인덱스 1회 빌드 (`1.arcfire_flowchart.md` §1)
        buildCsvStaticIndexes();
        await useAabsPolicyStore.getState().loadAsync();
        // release에서도 androidId가 확정된 뒤에만 계정/서버 로딩 진행
        const authUser = await initGuestAuth();
        await loadArcExpansionTestOneShotDoneFromStorage();
        await loadLocalPlayer();
        await loadLocalClanWarFoundation();
        await loadLocalMissions();
        await loadLocalWorld();
        await bootstrapWorldObjectRuntimeFromWorld(useWorldStore.getState().systems);
        await applyArcCoreWallClockCatchUpFromPersistedGap(arcCoreHub);
        await usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
        useClanWarFoundationStore
          .getState()
          .syncNpcAiClanTerritoryFromGalaxy(useWorldStore.getState().systems);
        await loadLocalUserSession();
        await loadLocalItemLedger();
        await loadLocalAccountProfiles();
        await loadLocalSkillDb();
        await loadLocalNpcCaptainProgress();
        await loadLocalPlanetNebulaProfiles();
        await loadLocalBoard();
        // 이미지 프리페치는 부팅 게이트와 분리 — 첫 실행 디코드·캐시 미스 시 로딩 화면이 과하게 길어지는 것을 막는다.
        void runCriticalSessionAssetPrewarm();
        await withBootTimeout(
          'ensureArcCoreCollectionSeeded',
          12_000,
          () => ensureArcCoreCollectionSeeded({ uid: authUser.uid }),
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
        ensureCaptainsRegistered(NPC_CAPTAINS_FROM_CSV.map(c => c.id));
        void consumeFreshStartFlag();
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
        await persistUserSession();
        await persistItemLedger();
        await persistAccountProfiles();
        await persistSkillDb();
        void syncUserDataWithServer();
      } finally {
        setBootReady(true);
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

  if (!bootReady) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" backgroundColor="#060A14" />
        <View style={styles.bootLoading}>
          <ActivityIndicator color={COLORS.ink_dark} size="large" />
          <Text style={styles.bootLoadingText}>로딩중...</Text>
        </View>
        <ArcMessageModalHost />
      </GestureHandlerRootView>
    );
  }

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
      {updateGate?.visible ? (
        <View style={styles.updateGateOverlay}>
          <View style={styles.updateGateCard}>
            <Text style={styles.updateGateTitle}>
              {updateGate.required ? '업데이트 필요' : '새 버전 안내'}
            </Text>
            <Text style={styles.updateGateBody}>
              {updateGate.required
                ? `이 버전은 더 이상 지원되지 않습니다.\n최신 버전 ${updateGate.latestVersion}으로 업데이트해 주세요.`
                : `최신 버전 ${updateGate.latestVersion}이 배포되었습니다.\n지금 업데이트하시겠습니까?`}
            </Text>
            <View style={styles.updateGateBtnRow}>
              {!updateGate.required ? (
                <TouchableOpacity
                  style={[styles.updateGateBtn, styles.updateGateBtnLater]}
                  onPress={() => setUpdateGate((prev) => (prev ? { ...prev, visible: false } : prev))}
                >
                  <Text style={styles.updateGateBtnLaterText}>나중에</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.updateGateBtn, styles.updateGateBtnUpdate]}
                onPress={() => {
                  const url =
                    updateGate.playStoreUrl
                    ?? 'https://play.google.com/store/apps/details?id=com.arcfire.online';
                  void Linking.openURL(url);
                }}
              >
                <Text style={styles.updateGateBtnUpdateText}>업데이트</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
      <ArcMessageModalHost />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  /** 전환 중 스택 뒤가 비지 않도록 루트도 게임 배경색 */
  root: { flex: 1, backgroundColor: COLORS.bg_primary },
  bootLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg_primary,
  },
  bootLoadingText: {
    marginTop: 12,
    color: COLORS.ink_light,
  },
  updateGateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,10,20,0.76)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  updateGateCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,132,160,0.45)',
    backgroundColor: '#0d1528',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  updateGateTitle: {
    color: '#F4F7FF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  updateGateBody: {
    color: '#C7D2EA',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  updateGateBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    columnGap: 10,
  },
  updateGateBtn: {
    minWidth: 96,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateGateBtnLater: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.55)',
    backgroundColor: 'rgba(15,23,42,0.75)',
  },
  updateGateBtnUpdate: {
    backgroundColor: '#2563EB',
  },
  updateGateBtnLaterText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 14,
  },
  updateGateBtnUpdateText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
});
