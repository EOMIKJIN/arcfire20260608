// ============================================================
// 아크파이어 온라인 - 타이틀 화면 (로컬 전용)
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../src/utils/theme';
import { StarField } from '../src/renderer/StarField';
import { usePlayerStore } from '../src/store/playerStore';
import { useMissionStore } from '../src/store/missionStore';
import { useAppBootStore } from '../src/store/appBootStore';
import { useT } from '../src/i18n';
import { useAccountProfileStore } from '../src/store/accountProfileStore';
import { getCurrentUser, wasFreshStartThisBoot, consumeFreshStartForTitle } from '../src/firebase/auth';
import { tryRestorePlayerFromCloud } from '../src/firebase/firestore';
import {
  bootstrapPlayerAfterCloudRestore,
  persistAccountDataBundle,
} from '../src/account/accountLifecycle';
import { syncUserDataWithServer } from '../src/firebase/userDataSync';
import { StageShell } from '../src/stages/StageShell';
import { ContinueSessionLoadingView } from '../src/game/continueSessionLoadingView';
import {
  runContinueSessionPrewarm,
  yieldToUi,
} from '../src/game/continueSessionPrewarm';
import { resumePlayerToLastHubPlanet } from '../src/game/galaxyMapSessionResume';
import { runStageNavAfterTeardown } from '../src/navigation/stageNavGate';
import { playUiSfx } from '../src/audio';

/** 타이틀·네이티브 스플래시와 로고 톤 맞춤 */
const TITLE_SCREEN_BG = '#000000';
/** 초기 타이틀 레이아웃(인플로우 로고 자리) — 플로우만 이 값으로 맞추고, 실제 로고는 오버레이로 크게 그림 */
const TITLE_LEGACY_LOGO_MARGIN_TOP = 48;
const TITLE_LEGACY_LOGO_FLOW_HEIGHT = 213;
/** 오버레이 로고 표시 배율(레이아웃·버튼 슬롯과 무관) — 직전 대비 5% 축소(×0.95) */
const TITLE_LOGO_DISPLAY_SCALE = 1.44 * 0.95;
const TITLE_LOGO_ZONE_HEIGHT_RATIO = 0.44 * TITLE_LOGO_DISPLAY_SCALE;
/** 로고 박스 `top`에서 빼 화면 위로 올림(px) — 다른 UI 슬롯과 무관 */
const TITLE_LOGO_LAYER_TOP_LIFT_PX = 84;
/** `top`이 0일 때 추가로 위로 당김(음수 translateY, px) */
const TITLE_LOGO_LAYER_TRANSLATE_UP_PX = 16;

/**
 * 타이틀 UI 배치 계약(유지):
 * 태그라인·히어로·메인 버튼·푸터는 각각 `absolute` 슬롯만 쓴다(세로 flex 연쇄 없음).
 * 한 슬롯의 top/bottom만 바꿔도 다른 컨트롤은 자동으로 밀리지 않는다.
 */
const TITLE_UI_H_INSET = SPACING.xl;
/** 화면 상단 기준 px — 조정 시 해당 키만 수정 */
const TITLE_SLOT_TAGLINE_TOP_PX = 444;
const TITLE_SLOT_HERO_TOP_PX = 434;
/** 예비 비주얼 슬롯 높이(태그라인·버튼 슬롯과 독립) */
const TITLE_SLOT_HERO_HEIGHT_PX = 112;
const TITLE_SLOT_PRIMARY_BUTTON_TOP_PX = 558;
/** 푸터를 화면 하단에 더 붙임 */
const TITLE_SLOT_FOOTER_BOTTOM_PX = SPACING.xs;

/** 신규 계정: [ 게임 시작 ] 탭 후 인트로(스토리) → 닉네임 — 타이틀에서 자동 이동하지 않음 */
const NEW_ACCOUNT_INTRO_ROUTE = '/(game)/intro?sceneId=intro01&flow=preNickname' as const;

function resolveTitleAppVersion(): string {
  const nativeVersion = Application.nativeApplicationVersion;
  if (typeof nativeVersion === 'string' && nativeVersion.trim()) return nativeVersion.trim();
  const expoVersion = Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version;
  if (typeof expoVersion === 'string' && expoVersion.trim()) return expoVersion.trim();
  return '0.0.0';
}

export default function TitleScreen() {
  const t = useT();
  const appVersion = resolveTitleAppVersion();
  const { width, height } = useWindowDimensions();
  const logoZoneHeight = Math.round(height * TITLE_LOGO_ZONE_HEIGHT_RATIO);
  const logoLayerTop = Math.max(
    0,
    SPACING.xl + TITLE_LEGACY_LOGO_MARGIN_TOP - TITLE_LOGO_LAYER_TOP_LIFT_PX,
  );
  const hydrated = usePlayerStore((s) => s.hydrated);
  const player = usePlayerStore((s) => s.player);
  // 로컬 하이드레이션·월드/코어 부트스트랩 완료 후 버튼 활성 (최소화 게이트).
  const bootReady = useAppBootStore((s) => s.bootReady);
  // catch-up·일일배치·prewarm은 **대기하지 않음** — 이어하기 시 차원항로 로딩에서 처리.
  const postBootSettled = useAppBootStore((s) => s.postBootSettled);
  const getActiveMission = useMissionStore((s) => s.getActiveMission);
  const initTutorialStory = useMissionStore((s) => s.initTutorialStory);

  const [continueFlowActive, setContinueFlowActive] = useState(false);
  const [cloudRestorePending, setCloudRestorePending] = useState(false);
  /**
   * 버튼 로딩 스피너 — 클릭연출(activeOpacity) 직후·실제 비용 구간과 동시.
   * 이어하기: 차원항로 트리 교체·마운트 직전 / 시작하기: runStageNavAfterTeardown 대기.
   * 가짜 대기 연출용 아님. 비용이 없으면 1~2프레임만 보이고 다음 화면으로 넘어간다.
   */
  const [navPending, setNavPending] = useState(false);
  /** 타이틀 입력 준비 완료 — RN 부트·하이드레이션·catch-up·(있다면)클라우드 복원 판정까지 종료 */
  const titleInteractive = bootReady && postBootSettled && hydrated && !cloudRestorePending;
  const cloudCheckStartedRef = useRef(false);
  const flowCancelledRef = useRef(false);
  const prewarmPromiseRef = useRef<Promise<void> | null>(null);
  const titleNavLockRef = useRef(false);
  const titleNavScheduledRef = useRef(false);
  const titleMountedRef = useRef(true);

  useEffect(() => {
    titleMountedRef.current = true;
    return () => {
      titleMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      flowCancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    // 부트가 완전히 끝나기 전에는 클라우드 복원 판정을 시작하지 않는다(부트 경합·렉 방지).
    if (!bootReady || !hydrated || player) {
      setCloudRestorePending(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const skipCloudRestore =
        wasFreshStartThisBoot() || (await consumeFreshStartForTitle());
      if (cancelled) return;

      if (skipCloudRestore) {
        cloudCheckStartedRef.current = true;
        setCloudRestorePending(false);
        return;
      }

      if (cloudCheckStartedRef.current) return;
      cloudCheckStartedRef.current = true;

      const uid = getCurrentUser().uid;
      const hadLocalAccountMeta = Boolean(
        useAccountProfileStore.getState().profilesByUid[uid]?.nicknameSnapshot,
      );

      if (!hadLocalAccountMeta) {
        // 로컬 계정 메타 없음(신규 설치·재설치 등) — 클라우드에 기존 진행분이 있을 수 있으므로
        // 판정 끝날 때까지 타이틀 버튼을 잠가야 한다. 이게 빠지면 판정 중 [게임 시작]을 눌러
        // player=null 스냅샷으로 신규 인트로 라우팅이 확정된 뒤, 뒤늦게 setPlayer()가 인트로
        // 화면 마운트 중에 끼어들어 화면이 한 번 깜빡였다가 재시작되는 버그로 이어졌다.
        setCloudRestorePending(true);
        const result = await tryRestorePlayerFromCloud(uid, { hadLocalAccountMeta: false });
        if (cancelled) return;
        setCloudRestorePending(false);
        if (result.kind === 'restored') {
          usePlayerStore.getState().setPlayer(result.player);
          bootstrapPlayerAfterCloudRestore(result.player);
          await usePlayerStore.getState().persist();
          await persistAccountDataBundle();
          void syncUserDataWithServer();
        }
        return;
      }

      setCloudRestorePending(true);
      const result = await tryRestorePlayerFromCloud(uid, { hadLocalAccountMeta: true });
      if (cancelled) return;
      setCloudRestorePending(false);

      if (result.kind === 'restored') {
        usePlayerStore.getState().setPlayer(result.player);
        bootstrapPlayerAfterCloudRestore(result.player);
        await usePlayerStore.getState().persist();
        await persistAccountDataBundle();
        void syncUserDataWithServer();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootReady, hydrated, player]);

  const handleStart = () => {
    const p = usePlayerStore.getState().player;
    if (p?.flags.introSeen) {
      if (continueFlowActive || titleNavLockRef.current || navPending) return;

      flowCancelledRef.current = false;
      titleNavLockRef.current = true;
      // 정석: (1) TouchableOpacity 클릭연출은 버튼이 살아 있는 동안 완료
      // (2) 비용 구간과 동시에 버튼 스피너 (3) 페인트 후 차원항로 교체·마운트
      // (4) 차원항로 페인트 후 prewarm — 무거운 동기는 항상 "보이는 로딩"과 동시.
      setNavPending(true);

      void (async () => {
        await yieldToUi();
        await yieldToUi();
        if (flowCancelledRef.current || !titleMountedRef.current) return;
        setContinueFlowActive(true);
        await yieldToUi();
        await yieldToUi();
        if (flowCancelledRef.current) return;
        if (!getActiveMission()) initTutorialStory();
        // 강제 minHold 없음 — prewarm(실비용) 완료 즉시 허브 진입.
        prewarmPromiseRef.current = runContinueSessionPrewarm().catch(() => {
          /* 프리로드 실패해도 진입은 허용 */
        });
        await (prewarmPromiseRef.current ?? Promise.resolve());
        if (flowCancelledRef.current || titleNavScheduledRef.current) return;
        titleNavScheduledRef.current = true;
        resumePlayerToLastHubPlanet();
        await usePlayerStore.getState().persist();
        runStageNavAfterTeardown({
          teardown: () => {},
          navigate: () => router.replace('/(game)/planet'),
          isMounted: () => titleMountedRef.current && !flowCancelledRef.current,
        });
      })();

      return;
    }
    if (titleNavLockRef.current || navPending) return;
    titleNavLockRef.current = true;
    // 시작하기: 클릭연출 후 스피너 ↔ teardown 대기 동시 → 인트로.
    setNavPending(true);
    if (p) {
      runStageNavAfterTeardown({
        teardown: () => {},
        navigate: () => router.replace('/(game)/intro?sceneId=intro01'),
        isMounted: () => titleMountedRef.current,
      });
    } else {
      runStageNavAfterTeardown({
        teardown: () => {},
        navigate: () => router.replace(NEW_ACCOUNT_INTRO_ROUTE),
        isMounted: () => titleMountedRef.current,
      });
    }
  };

  if (continueFlowActive) {
    return (
      <StageShell routeName="title" background="none" safeAreaBackgroundColor={TITLE_SCREEN_BG}>
        <View style={[styles.container, { width, height }]}>
          <ContinueSessionLoadingView
            width={width}
            height={height}
            phaseLabel={t('title.loading')}
          />
        </View>
      </StageShell>
    );
  }

  return (
    <StageShell routeName="title" background="none" safeAreaBackgroundColor={TITLE_SCREEN_BG}>
      <View style={[styles.container, { width, height }]}>
        <View style={[styles.titleLayer, { width, height }]} pointerEvents="box-none">
          <StarField width={width} height={height} count={60} />

          <View
            pointerEvents="none"
            style={[
              styles.logoLayer,
              {
                top: logoLayerTop,
                height: logoZoneHeight,
                left: SPACING.xl,
                right: SPACING.xl,
                transform: [{ translateY: -TITLE_LOGO_LAYER_TRANSLATE_UP_PX }],
              },
            ]}
          >
            <Image
              source={require('../assets/images/arcfire_logo_02.png')}
              style={styles.logoImage}
              resizeMode="cover"
              accessibilityLabel={t('title.logoA11y')}
            />
          </View>

          <Text
            style={[styles.absTagline, { top: TITLE_SLOT_TAGLINE_TOP_PX }]}
            accessibilityRole="text"
          >
            {t('title.tagline')}
          </Text>

          <View
            pointerEvents="none"
            style={[styles.absHeroSlot, { top: TITLE_SLOT_HERO_TOP_PX }]}
            accessibilityLabel={t('title.heroA11y')}
          >
            <View
              style={{
                width: Math.min(360, width - 2 * TITLE_UI_H_INSET),
                height: TITLE_SLOT_HERO_HEIGHT_PX,
              }}
            />
          </View>

          <View
            style={[styles.absBtnWrap, { top: TITLE_SLOT_PRIMARY_BUTTON_TOP_PX }]}
            pointerEvents="box-none"
          >
            <View style={styles.btnArea}>
              <TouchableOpacity
                style={[styles.btnStart, player ? styles.btnStartWithSave : null]}
                onPressIn={() => {
                  if (!titleInteractive || navPending) return;
                  playUiSfx('ui_confirm');
                }}
                onPress={handleStart}
                activeOpacity={0.82}
                // navPending 때는 disabled 하지 않음 — disabled가 activeOpacity 클릭연출을 끊음.
                // 연타는 titleNavLockRef / handleStart 가드로 차단.
                disabled={!titleInteractive}
              >
                {!titleInteractive || navPending ? (
                  <ActivityIndicator color={COLORS.ink_dark} />
                ) : (
                  <Text style={[styles.btnText, player ? styles.btnTextContinue : null]}>
                    [{player ? t('title.continue') : t('title.start')}]
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View
            pointerEvents="none"
            style={[styles.absFooter, { bottom: TITLE_SLOT_FOOTER_BOTTOM_PX }]}
          >
            <Text style={styles.version}>{t('title.localBuild', { version: appVersion })}</Text>
            <Text style={styles.copyright}>© 2026 NFLOYD INC</Text>
          </View>
        </View>
      </View>
    </StageShell>
  );
}

/** 이어하기 라벨 — 푸른 포스포 형광 모니터 톤 */
const TITLE_CONTINUE_PHOSPHOR = '#6BD4FF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TITLE_SCREEN_BG,
  },
  titleLayer: {
    flex: 1,
  },
  /** 로고만 그리는 레이어 — 레이아웃 플로우에 참여하지 않음 */
  logoLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  absTagline: {
    position: 'absolute',
    left: TITLE_UI_H_INSET,
    right: TITLE_UI_H_INSET,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    letterSpacing: 0.5,
  },
  absHeroSlot: {
    position: 'absolute',
    left: TITLE_UI_H_INSET,
    right: TITLE_UI_H_INSET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absBtnWrap: {
    position: 'absolute',
    left: TITLE_UI_H_INSET,
    right: TITLE_UI_H_INSET,
    alignItems: 'center',
  },
  absFooter: {
    position: 'absolute',
    left: TITLE_UI_H_INSET,
    right: TITLE_UI_H_INSET,
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  version: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_faint,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  btnArea: {
    width: '100%',
    maxWidth: 252,
    alignSelf: 'center',
  },
  btnStart: {
    borderWidth: 1.5,
    borderColor: 'rgba(230, 238, 255, 0.28)',
    borderRadius: 6,
    paddingVertical: SPACING.md - 1,
    paddingHorizontal: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 47,
    backgroundColor: 'rgba(230, 238, 255, 0.1)',
  },
  btnStartWithSave: {
    borderColor: 'rgba(107, 212, 255, 0.35)',
    backgroundColor: 'rgba(107, 212, 255, 0.08)',
  },
  btnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: 'rgba(230, 238, 255, 0.88)',
    fontWeight: FONTS.weight.bold,
    letterSpacing: 2,
  },
  btnTextContinue: {
    color: TITLE_CONTINUE_PHOSPHOR,
    textShadowColor: 'rgba(107, 212, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  copyright: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_faint,
  },
});
