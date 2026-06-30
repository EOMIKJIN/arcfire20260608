// ============================================================
// ArcOverlayHost — 게임 전역 단일 오버레이·모달 루트
// RN Modal 대신 absolute View + safe-area + Android nav 재숨김
// ============================================================

import React, { memo, useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, OVERLAY_TOKENS } from '../../utils/theme';
import { useArcOverlayStore } from './arcOverlayStore';
import { getOverlayChrome } from './overlayChrome';
import { resolveOverlayBottomAnchorPad, resolveOverlayEdgeInsets } from './overlayInsets';
import { OVERLAY_CENTER_VERTICAL_BIAS_PX, OVERLAY_PANEL_TOP_ANCHOR_PX } from './overlayPanelLayout';
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
import { NearbyPresenceInfoOverlayContent } from './content/NearbyPresenceInfoOverlayContent';

export const ArcOverlayHost = memo(function ArcOverlayHost() {
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
  const isTopAnchoredPanel = chrome.hostAnchor === 'top';
  const backdropClear = chrome.backdrop === 'transparent';
  /** 인게임 대사 — 전체 딤·backdrop 터치·elevation 없음 (시설 화면 그대로 노출) */
  const isPassthroughNarrative = isNarrative && backdropClear;
  const bottomPad = isBottomNarrative ? resolveOverlayBottomAnchorPad(insets, SPACING.md) : 0;
  const overlayHorizontalPad = isNarrative
    ? NARRATIVE_DIALOG_LAYOUT.hostHorizontalPadPx
    : SPACING.lg;
  const contentSlotStyle = isBottomNarrative
    ? styles.bottomNarrativeSlot
    : isNarrative
      ? styles.narrativeCenterSlot
      : styles.centerSlot;

  const narrativeContent =
    entry.kind === 'narrative' ? (
      <View pointerEvents="auto" style={isPassthroughNarrative ? styles.passthroughNarrativeTouch : undefined}>
        <NarrativeOverlayContent entry={entry} onPressNext={handleNarrativeNext} />
      </View>
    ) : null;

  if (isPassthroughNarrative) {
    const passthroughWrapStyle = isBottomNarrative ? styles.bottomWrap : styles.centerWrap;
    return (
      <View
        style={[styles.passthroughOverlay, { zIndex: chrome.zIndex }]}
        pointerEvents="box-none"
        collapsable={false}
      >
        <View
          style={[
            styles.overlayContentFrame,
            {
              paddingBottom: bottomPad,
              paddingLeft: overlayHorizontalPad + edges.left,
              paddingRight: overlayHorizontalPad + edges.right,
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={passthroughWrapStyle} pointerEvents="box-none">
            <View style={contentSlotStyle} pointerEvents="box-none">
              {narrativeContent}
            </View>
          </View>
        </View>
      </View>
    );
  }

  const contentFramePad = {
    paddingTop: isPassthroughNarrative ? 0 : SPACING.sm + edges.top,
    paddingBottom: isBottomNarrative ? bottomPad : SPACING.sm + edges.bottom,
    paddingLeft: overlayHorizontalPad + edges.left,
    paddingRight: overlayHorizontalPad + edges.right,
  };

  return (
    <View
      style={[
        styles.overlayRoot,
        { zIndex: chrome.zIndex },
        isPassthroughNarrative ? { elevation: 0 } : null,
      ]}
      pointerEvents={isBlocking ? 'auto' : 'box-none'}
      collapsable={false}
    >
      {!isPassthroughNarrative ? (
        <Pressable
          style={[styles.backdropFill, { backgroundColor: chrome.backdrop }]}
          onPress={isBlocking ? undefined : handleBackdrop}
        />
      ) : null}
      <View style={[styles.overlayContentFrame, contentFramePad]} pointerEvents="box-none">
      <View
        style={[
          isBottomNarrative ? styles.bottomWrap : styles.centerWrap,
          isTopAnchoredPanel ? styles.topAnchoredWrap : null,
          entry.kind === 'narrative' && entry.anchor === 'center' ? styles.narrativeCenterWrap : null,
        ]}
        pointerEvents="box-none"
      >
        <View style={contentSlotStyle} pointerEvents="box-none">
        {entry.kind === 'alert' ? (
          <AlertOverlayContent entry={entry} onButton={handleAlertButton} onClose={dismiss} />
        ) : null}
        {entry.kind === 'levelUp' ? (
          <LevelUpOverlayContent entry={entry} onClose={handleLevelUpClose} />
        ) : null}
        {entry.kind === 'reward' ? (
          <RewardOverlayContent entry={entry} onClose={handleRewardClose} />
        ) : null}
        {narrativeContent}
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
        {entry.kind === 'nearbyPresenceInfo' ? (
          <NearbyPresenceInfoOverlayContent entry={entry} onClose={dismiss} />
        ) : null}
        </View>
      </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  /** 전체 화면 루트 — winH 고정 금지(하단 딤 누락 방지) */
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    elevation: 50,
  },
  /** 패널·알림 딤 — padding과 분리해 화면 전체 채움 */
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContentFrame: {
    flex: 1,
  },
  /** narrative transparent — 전체 딤·그림자 없음 */
  passthroughOverlay: {
    ...StyleSheet.absoluteFillObject,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  passthroughNarrativeTouch: {
    alignSelf: 'stretch',
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
  topAnchoredWrap: {
    justifyContent: 'flex-start',
    paddingTop: OVERLAY_PANEL_TOP_ANCHOR_PX,
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
    maxWidth: '100%',
    alignSelf: 'center',
    flexShrink: 0,
  },
  narrativeCenterWrap: {
    paddingHorizontal: SPACING.sm,
  },
});
