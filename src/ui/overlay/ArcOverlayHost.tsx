// ============================================================
// ArcOverlayHost — 게임 전역 단일 오버레이·모달 루트
// RN Modal 대신 absolute View + safe-area + Android nav 재숨김
// ============================================================

import React, { memo, useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../../utils/theme';
import { useArcOverlayStore } from './arcOverlayStore';
import { getOverlayChrome } from './overlayChrome';
import { resolveOverlayBottomAnchorPad, resolveOverlayEdgeInsets } from './overlayInsets';
import { reapplyAndroidImmersiveNavBar } from './reapplyAndroidImmersiveNavBar';
import { AlertOverlayContent } from './content/AlertOverlayContent';
import { LevelUpOverlayContent } from './content/LevelUpOverlayContent';
import { RewardOverlayContent } from './content/RewardOverlayContent';
import { NarrativeOverlayContent } from './content/NarrativeOverlayContent';
import { BlockingOverlayContent } from './content/BlockingOverlayContent';
import { TradeQuantityOverlayContent } from './content/TradeQuantityOverlayContent';
import { PlanetEconomyInfoOverlayContent } from './content/PlanetEconomyInfoOverlayContent';
import { PlanetDevelopmentOverlayContent } from './content/PlanetDevelopmentOverlayContent';

export const ArcOverlayHost = memo(function ArcOverlayHost() {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const edges = resolveOverlayEdgeInsets(insets);
  const entry = useArcOverlayStore((s) => {
    const stack = s.stack;
    return stack.length > 0 ? stack[stack.length - 1]! : null;
  });
  const dismiss = useArcOverlayStore((s) => s.dismiss);

  useEffect(() => {
    if (!entry) return;
    void reapplyAndroidImmersiveNavBar();
    const t = setTimeout(() => {
      void reapplyAndroidImmersiveNavBar();
    }, 80);
    return () => clearTimeout(t);
  }, [entry?.id]);

  const handleBackdrop = useCallback(() => {
    if (!entry || entry.dismissOnBackdrop === false) return;
    if (entry.kind === 'levelUp') {
      entry.onClose();
    } else if (entry.kind === 'reward') {
      entry.onClose();
    } else if (entry.kind === 'narrative') {
      if (!entry.nextDisabled) entry.onPressNext();
      return;
    }
    dismiss();
  }, [dismiss, entry]);

  const handleAlertButton = useCallback(
    (onPress?: () => void | Promise<void>) => {
      dismiss();
      void Promise.resolve(onPress?.()).catch(() => {});
    },
    [dismiss],
  );

  const handleLevelUpClose = useCallback(() => {
    if (entry?.kind === 'levelUp') entry.onClose();
    dismiss();
  }, [dismiss, entry]);

  const handleRewardClose = useCallback(() => {
    if (entry?.kind === 'reward') entry.onClose();
    dismiss();
  }, [dismiss, entry]);

  const handleNarrativeNext = useCallback(() => {
    if (entry?.kind !== 'narrative' || entry.nextDisabled) return;
    entry.onPressNext();
  }, [entry]);

  const handleTradeQuantityConfirm = useCallback(
    (qty: number) => {
      if (entry?.kind !== 'tradeQuantity') return;
      dismiss();
      void Promise.resolve(entry.onConfirm(qty)).catch(() => {});
    },
    [dismiss, entry],
  );

  const handleTradeQuantityCancel = useCallback(() => {
    dismiss();
  }, [dismiss]);

  if (!entry) return null;

  const chrome = getOverlayChrome(entry.kind);
  const isBottomNarrative = entry.kind === 'narrative' && entry.anchor === 'bottom';
  const isBlocking = entry.kind === 'blocking';
  const bottomPad = isBottomNarrative ? resolveOverlayBottomAnchorPad(insets, SPACING.md) : 0;

  return (
    <View
      style={[
        styles.overlay,
        {
          width: winW,
          height: winH,
          backgroundColor: chrome.backdrop,
          zIndex: chrome.zIndex,
          paddingTop: SPACING.lg + edges.top,
          paddingBottom: isBottomNarrative ? bottomPad : SPACING.lg + edges.bottom,
          paddingLeft: SPACING.lg + edges.left,
          paddingRight: SPACING.lg + edges.right,
        },
      ]}
      pointerEvents={isBlocking ? 'auto' : 'box-none'}
      collapsable={false}
    >
      <Pressable
        style={styles.backdropTouch}
        onPress={isBlocking ? undefined : handleBackdrop}
      />
      <View
        style={[
          isBottomNarrative ? styles.bottomWrap : styles.centerWrap,
          entry.kind === 'narrative' && entry.anchor === 'center' ? styles.narrativeCenterWrap : null,
        ]}
        pointerEvents="box-none"
      >
        {entry.kind === 'alert' ? (
          <AlertOverlayContent entry={entry} onButton={handleAlertButton} />
        ) : null}
        {entry.kind === 'levelUp' ? (
          <LevelUpOverlayContent entry={entry} onClose={handleLevelUpClose} />
        ) : null}
        {entry.kind === 'reward' ? (
          <RewardOverlayContent entry={entry} onClose={handleRewardClose} />
        ) : null}
        {entry.kind === 'narrative' ? (
          <NarrativeOverlayContent entry={entry} onPressNext={handleNarrativeNext} />
        ) : null}
        {entry.kind === 'blocking' ? <BlockingOverlayContent entry={entry} /> : null}
        {entry.kind === 'tradeQuantity' ? (
          <TradeQuantityOverlayContent
            entry={entry}
            onConfirm={handleTradeQuantityConfirm}
            onCancel={handleTradeQuantityCancel}
          />
        ) : null}
        {entry.kind === 'planetEconomyInfo' ? (
          <PlanetEconomyInfoOverlayContent entry={entry} onClose={dismiss} />
        ) : null}
        {entry.kind === 'planetDevelopment' ? (
          <PlanetDevelopmentOverlayContent entry={entry} onClose={dismiss} />
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    elevation: 50,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  narrativeCenterWrap: {
    paddingHorizontal: 0,
  },
});
