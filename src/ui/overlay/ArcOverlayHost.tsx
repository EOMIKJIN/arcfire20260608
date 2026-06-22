// ============================================================
// ArcOverlayHost — 게임 전역 단일 오버레이·모달 루트
// RN Modal 대신 absolute View + safe-area + Android nav 재숨김
// ============================================================

import React, { memo, useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, OVERLAY_TOKENS } from '../../utils/theme';
import { useArcOverlayStore } from './arcOverlayStore';
import { getOverlayChrome } from './overlayChrome';
import { resolveOverlayBottomAnchorPad, resolveOverlayEdgeInsets } from './overlayInsets';
import { OVERLAY_CENTER_VERTICAL_BIAS_PX } from './overlayPanelLayout';
import { NARRATIVE_DIALOG_LAYOUT } from './narrativeDialogLayout';
import { reapplyAndroidImmersiveNavBar } from './reapplyAndroidImmersiveNavBar';
import { AlertOverlayContent } from './content/AlertOverlayContent';
import { LevelUpOverlayContent } from './content/LevelUpOverlayContent';
import { RewardOverlayContent } from './content/RewardOverlayContent';
import { NarrativeOverlayContent } from './content/NarrativeOverlayContent';
import { BlockingOverlayContent } from './content/BlockingOverlayContent';
import { TradeQuantityOverlayContent } from './content/TradeQuantityOverlayContent';
import { PlanetEconomyInfoOverlayContent } from './content/PlanetEconomyInfoOverlayContent';
import { PlanetDevelopmentOverlayContent } from './content/PlanetDevelopmentOverlayContent';
import { WaveResultOverlayContent } from './content/WaveResultOverlayContent';
import { SettingsOverlayContent } from './content/SettingsOverlayContent';
import { BmShopOverlayContent } from './content/BmShopOverlayContent';

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

  useEffect(() => {
    if (entry?.kind !== 'alert') return;
    const autoMs = entry.autoDismissMs;
    if (!autoMs || autoMs <= 0) return;
    const timer = setTimeout(() => {
      dismiss();
    }, autoMs);
    return () => clearTimeout(timer);
  }, [dismiss, entry]);

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

  const handleWaveResultClose = useCallback(() => {
    if (entry?.kind === 'waveResult') entry.onClose();
    dismiss();
  }, [dismiss, entry]);

  const handleSettingsReset = useCallback(() => {
    if (entry?.kind !== 'settings') return;
    const reset = entry.onResetAccount;
    dismiss();
    // 확인 알림(alert, z 9999)이 설정 패널 위로 자연스럽게 뜨도록 닫은 뒤 호출
    reset();
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
  const isNarrative = entry.kind === 'narrative';
  const isBottomNarrative = isNarrative && entry.anchor === 'bottom';
  const isBlocking = entry.kind === 'blocking';
  const bottomPad = isBottomNarrative ? resolveOverlayBottomAnchorPad(insets, SPACING.md) : 0;
  const overlayHorizontalPad = isBottomNarrative
    ? NARRATIVE_DIALOG_LAYOUT.hostHorizontalPadPx
    : SPACING.lg;
  const contentSlotStyle = isBottomNarrative
    ? styles.bottomNarrativeSlot
    : isNarrative
      ? styles.narrativeCenterSlot
      : styles.centerSlot;

  return (
    <View
      style={[
        styles.overlay,
        {
          width: winW,
          height: winH,
          backgroundColor: chrome.backdrop,
          zIndex: chrome.zIndex,
          paddingTop: SPACING.sm + edges.top,
          paddingBottom: isBottomNarrative ? bottomPad : SPACING.sm + edges.bottom,
          paddingLeft: overlayHorizontalPad + edges.left,
          paddingRight: overlayHorizontalPad + edges.right,
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
        <View style={contentSlotStyle} pointerEvents="box-none">
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
        {entry.kind === 'waveResult' ? (
          <WaveResultOverlayContent entry={entry} onClose={handleWaveResultClose} />
        ) : null}
        {entry.kind === 'settings' ? (
          <SettingsOverlayContent entry={entry} onClose={dismiss} onResetAccount={handleSettingsReset} />
        ) : null}
        {entry.kind === 'bmShop' ? (
          <BmShopOverlayContent entry={entry} onClose={dismiss} />
        ) : null}
        </View>
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
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    paddingTop: OVERLAY_CENTER_VERTICAL_BIAS_PX,
    paddingBottom: SPACING.xs,
  },
  centerSlot: {
    width: OVERLAY_TOKENS.cardMaxWidth,
    maxWidth: '100%',
    alignSelf: 'center',
    flexShrink: 0,
  },
  bottomWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  bottomNarrativeSlot: {
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  narrativeCenterSlot: {
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  narrativeCenterWrap: {
    paddingHorizontal: SPACING.sm,
  },
});
