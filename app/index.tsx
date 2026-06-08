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
  CONTINUE_SESSION_MIN_LOADING_MS,
  runContinueSessionPrewarm,
} from '../src/game/continueSessionPrewarm';

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
  const appVersion = resolveTitleAppVersion();
  const { width, height } = useWindowDimensions();
  const logoZoneHeight = Math.round(height * TITLE_LOGO_ZONE_HEIGHT_RATIO);
  const logoLayerTop = Math.max(
    0,
    SPACING.xl + TITLE_LEGACY_LOGO_MARGIN_TOP - TITLE_LOGO_LAYER_TOP_LIFT_PX,
  );
  const hydrated = usePlayerStore((s) => s.hydrated);
  const player = usePlayerStore((s) => s.player);
  const getActiveMission = useMissionStore((s) => s.getActiveMission);
  const initMissions = useMissionStore((s) => s.initMissions);

  const [continueFlowActive, setContinueFlowActive] = useState(false);
  const [cloudRestorePending, setCloudRestorePending] = useState(false);
  const cloudCheckStartedRef = useRef(false);
  const flowCancelledRef = useRef(false);
  const prewarmPromiseRef = useRef<Promise<void> | null>(null);
  const continueMinHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      flowCancelledRef.current = true;
      if (continueMinHoldTimerRef.current) {
        clearTimeout(continueMinHoldTimerRef.current);
        continueMinHoldTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated || player) {
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
        const result = await tryRestorePlayerFromCloud(uid, { hadLocalAccountMeta: false });
        if (cancelled) return;
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
  }, [hydrated, player]);

  const handleStart = () => {
    const p = usePlayerStore.getState().player;
    if (p?.flags.introSeen) {
      if (continueFlowActive) return;
      if (!getActiveMission()) initMissions();

      flowCancelledRef.current = false;
      prewarmPromiseRef.current = runContinueSessionPrewarm().catch(() => {
        /* 프리로드 실패해도 진입은 허용 */
      });

      setContinueFlowActive(true);

      void (async () => {
        const minHold = new Promise<void>((r) => {
          continueMinHoldTimerRef.current = setTimeout(() => {
            continueMinHoldTimerRef.current = null;
            r();
          }, CONTINUE_SESSION_MIN_LOADING_MS);
        });
        await Promise.all([prewarmPromiseRef.current ?? Promise.resolve(), minHold]);
        if (flowCancelledRef.current) return;
        router.replace('/(game)/planet');
      })();

      return;
    }
    else if (p) router.replace('/(game)/intro?sceneId=intro01');
    else router.replace(NEW_ACCOUNT_INTRO_ROUTE);
  };

  if (continueFlowActive) {
    return (
      <StageShell routeName="title" background="none" safeAreaBackgroundColor={TITLE_SCREEN_BG}>
        <View style={[styles.container, { width, height }]}>
          <ContinueSessionLoadingView
            width={width}
            height={height}
            phaseLabel="불러오는 중…"
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
              accessibilityLabel="ARCFIRE ONLINE 로고"
            />
          </View>

          <Text
            style={[styles.absTagline, { top: TITLE_SLOT_TAGLINE_TOP_PX }]}
            accessibilityRole="text"
          >
            그 어디에도 안전한 곳은 없다
          </Text>

          <View
            pointerEvents="none"
            style={[styles.absHeroSlot, { top: TITLE_SLOT_HERO_TOP_PX }]}
            accessibilityLabel="타이틀 비주얼 영역(예비)"
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
                onPress={handleStart}
                activeOpacity={0.82}
                disabled={!hydrated || cloudRestorePending}
              >
                {!hydrated || cloudRestorePending ? (
                  <ActivityIndicator color={COLORS.ink_dark} />
                ) : (
                  <Text style={[styles.btnText, player ? styles.btnTextContinue : null]}>
                    [{player ? ' 이어하기 ' : ' 게임 시작 '}]
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View
            pointerEvents="none"
            style={[styles.absFooter, { bottom: TITLE_SLOT_FOOTER_BOTTOM_PX }]}
          >
            <Text style={styles.version}>{`v${appVersion} · 로컬 빌드`}</Text>
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
