import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, BackHandler, Easing, Keyboard, StyleSheet, Text, View } from 'react-native';
import { useT } from '../../i18n';
import {
  isArcCoreAgentSurfaceOpen,
  useArcCoreAgentSurfaceStore,
} from '../../arcCore/chat/arcCoreAgentSurfaceStore';
import { markArcCoreBootChatFirstFinished } from '../../arcCore/chat/arcCoreBootChatFirstGate';
import { FONTS, SPACING } from '../../utils/theme';
import { OVERLAY_Z } from './overlayChrome';
import { TACTICAL_OVERLAY } from './tacticalOverlayStyles';
import { ArcCoreChatOverlayContent } from './content/ArcCoreChatOverlayContent';

const SWITCH_MS = 280;
const GAME_BACK_SCALE = 0.94;
const AGENT_START_SCALE = 0.96;

/** 게임 스택만 축소·딤. 에이전트 면은 루트 형제로 올린다(스택 elevation에 가리지 않음). */
export const ArcCoreDualAppShell = memo(function ArcCoreDualAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const front = useArcCoreAgentSurfaceStore((s) => s.front);
  const mounted = useArcCoreAgentSurfaceStore((s) => s.mounted);
  const immediate = useArcCoreAgentSurfaceStore((s) => s.immediate);
  const closing = useArcCoreAgentSurfaceStore((s) => s.closing);
  const gameLocked = front === 'agent' || closing;
  const gameScale = useRef(new Animated.Value(1)).current;
  const gameDim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const toAgent = mounted && front === 'agent';
    if (!gameLocked) {
      gameScale.setValue(1);
      gameDim.setValue(0);
      return;
    }
    if (immediate) {
      gameScale.setValue(toAgent ? GAME_BACK_SCALE : 1);
      gameDim.setValue(toAgent ? 1 : 0);
      return;
    }
    const easing = toAgent ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic);
    Animated.parallel([
      Animated.timing(gameScale, {
        toValue: toAgent ? GAME_BACK_SCALE : 1,
        duration: SWITCH_MS,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(gameDim, {
        toValue: toAgent ? 1 : 0,
        duration: 220,
        easing,
        useNativeDriver: true,
      }),
    ]).start();
  }, [front, gameDim, gameLocked, gameScale, immediate, mounted]);

  return (
    <View style={styles.shell}>
      <Animated.View
        style={[
          styles.gameSlot,
          gameLocked ? { transform: [{ scale: gameScale }] } : { transform: [{ scale: 1 }] },
        ]}
        pointerEvents={gameLocked ? 'none' : 'auto'}
        collapsable={false}
      >
        {children}
        {gameLocked ? (
          <Animated.View pointerEvents="none" style={[styles.gameDim, { opacity: gameDim }]} />
        ) : null}
      </Animated.View>
    </View>
  );
});

/** OverlayHost와 같은 루트 슬롯 — 열리면 화면 안에 고정하고 스케일만 준다. */
export const ArcCoreAgentSurfaceHost = memo(function ArcCoreAgentSurfaceHost() {
  const t = useT();
  const mounted = useArcCoreAgentSurfaceStore((s) => s.mounted);
  const front = useArcCoreAgentSurfaceStore((s) => s.front);
  const immediate = useArcCoreAgentSurfaceStore((s) => s.immediate);
  const activateGame = useArcCoreAgentSurfaceStore((s) => s.activateGame);
  const settleClosing = useArcCoreAgentSurfaceStore((s) => s.settleClosing);
  const closing = useArcCoreAgentSurfaceStore((s) => s.closing);
  const openNonce = useArcCoreAgentSurfaceStore((s) => s.openNonce);
  const agentActive = mounted && front === 'agent';
  const showLayer = agentActive || closing;
  const agentScale = useMemo(() => new Animated.Value(1), [openNonce]);
  const bannerOpacity = useMemo(() => new Animated.Value(0), [openNonce]);
  const runningAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const hideSafetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopSurfaceAnim = () => {
    if (runningAnimRef.current) {
      runningAnimRef.current.stop();
      runningAnimRef.current = null;
    }
    if (hideSafetyRef.current) {
      clearTimeout(hideSafetyRef.current);
      hideSafetyRef.current = null;
    }
  };

  const bannerText = useMemo(
    () => (agentActive ? t('arcCoreAgent.surface.appName') : t('arcCoreAgent.surface.gameName')),
    [agentActive, t],
  );

  useEffect(() => {
    stopSurfaceAnim();
    if (!showLayer) {
      return () => {
        stopSurfaceAnim();
      };
    }

    if (agentActive) {
      if (immediate) {
        agentScale.setValue(1);
        bannerOpacity.setValue(0);
        return;
      }
      agentScale.setValue(AGENT_START_SCALE);
      const openAnim = Animated.parallel([
        Animated.timing(agentScale, {
          toValue: 1,
          duration: SWITCH_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bannerOpacity, {
            toValue: 1,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.delay(140),
          Animated.timing(bannerOpacity, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
      ]);
      runningAnimRef.current = openAnim;
      openAnim.start();
      return () => {
        stopSurfaceAnim();
      };
    }

    Keyboard.dismiss();
    if (immediate) {
      settleClosing();
      return;
    }
    const closeAnim = Animated.parallel([
      Animated.timing(agentScale, {
        toValue: AGENT_START_SCALE,
        duration: SWITCH_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(bannerOpacity, {
          toValue: 1,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.delay(140),
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
    ]);
    runningAnimRef.current = closeAnim;
    closeAnim.start(({ finished }) => {
      if (!finished || isArcCoreAgentSurfaceOpen()) return;
      settleClosing();
    });
    hideSafetyRef.current = setTimeout(() => {
      hideSafetyRef.current = null;
      if (isArcCoreAgentSurfaceOpen()) return;
      settleClosing();
    }, SWITCH_MS + 80);
    return () => {
      stopSurfaceAnim();
    };
  }, [agentActive, agentScale, bannerOpacity, immediate, settleClosing, showLayer]);

  const onCloseAgent = useCallback(() => {
    Keyboard.dismiss();
    markArcCoreBootChatFirstFinished();
    activateGame();
  }, [activateGame]);

  useEffect(() => {
    if (!agentActive) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onCloseAgent();
      return true;
    });
    return () => sub.remove();
  }, [agentActive, onCloseAgent]);

  if (!showLayer) return null;

  return (
    <View
      key={`arc-agent-${openNonce}`}
      pointerEvents="auto"
      collapsable={false}
      style={[styles.agentSlot, styles.agentSlotFront]}
    >
      <Animated.View
        style={[styles.agentFill, { transform: [{ scale: agentScale }] }]}
        collapsable={false}
      >
        <ArcCoreChatOverlayContent onClose={onCloseAgent} surfaceActive />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.bannerWrap, { opacity: bannerOpacity }]}>
        <Text style={styles.bannerText}>{bannerText}</Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  gameSlot: {
    flex: 1,
  },
  gameDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 8, 16, 0.42)',
  },
  agentSlot: {
    ...StyleSheet.absoluteFillObject,
  },
  agentSlotFront: {
    zIndex: OVERLAY_Z.agentSurface,
    elevation: 40,
    backgroundColor: TACTICAL_OVERLAY.cardBg,
  },
  agentFill: {
    flex: 1,
    backgroundColor: TACTICAL_OVERLAY.cardBg,
  },
  bannerWrap: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bannerText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: '#E8F4FF',
    letterSpacing: 1.2,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(8, 16, 28, 0.72)',
    overflow: 'hidden',
  },
});
