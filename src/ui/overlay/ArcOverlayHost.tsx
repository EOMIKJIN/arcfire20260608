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
import { RelicLoreOverlayContent } from './content/RelicLoreOverlayContent';
import { HubTalkRosterOverlayContent } from './content/HubTalkRosterOverlayContent';
import { PlanetOwnershipRosterOverlayContent } from './content/PlanetOwnershipRosterOverlayContent';
import { ArcCoreChatOverlayContent } from './content/ArcCoreChatOverlayContent';
import { SkillInfoOverlayContent } from './content/SkillInfoOverlayContent';
import { markArcCoreBootChatFirstFinished } from '../../arcCore/chat/arcCoreBootChatFirstGate';
import {
  isCompactAutoDismissOverlayKind,
  resolveCompactOverlayAutoDismissAction,
} from './overlayAlertContract';
export const ArcOverlayHost = memo(function ArcOverlayHost() {
  const insets = useSafeAreaInsets();
  const edges = resolveOverlayEdgeInsets(insets);
  const top = useArcOverlayStore((s) => {
    const stack = s.stack;
    return stack.length > 0 ? stack[stack.length - 1]! : null;
  });
  const dismiss = useArcOverlayStore((s) => s.dismiss);
  const entry = top;

  useEffect(() => {
    if (!entry) return;
    void reapplyAndroidImmersiveNavBar();
    const t = setTimeout(() => {
      void reapplyAndroidImmersiveNavBar();
    }, 80);
    return () => clearTimeout(t);
  }, [entry?.id]);

  const compactAutoDismissKey =
    top && isCompactAutoDismissOverlayKind(top.kind)
      ? `${top.kind}|${top.id}|${top.autoDismissMs ?? 0}`
      : null;

  useEffect(() => {
    if (!compactAutoDismissKey) return;
    const top = useArcOverlayStore.getState().top();
    if (!top || !isCompactAutoDismissOverlayKind(top.kind)) return;
    const action = resolveCompactOverlayAutoDismissAction(top);
    if (!action) return;
    const autoMs = top.autoDismissMs;
    if (!autoMs || autoMs <= 0) return;
    const expectedId = top.id;
    const timer = setTimeout(() => {
      const current = useArcOverlayStore.getState().top();
      if (!current || current.id !== expectedId) return;
      const next = resolveCompactOverlayAutoDismissAction(current);
      if (!next) return;
      dismiss();
      if (next.type === 'dismiss_then_press') {
        void Promise.resolve(next.onPress()).catch(() => {});
        return;
      }
      if (next.type === 'dismiss_then_close') {
        try {
          next.onClose();
        } catch {
          /* idempotent */
        }
      }
    }, autoMs);
    return () => clearTimeout(timer);
  }, [dismiss, compactAutoDismissKey]);

  const handleBackdrop = useCallback(() => {
    if (!top || top.dismissOnBackdrop === false) return;
    if (top.kind === 'levelUp') {
      top.onClose();
    } else if (top.kind === 'reward') {
      top.onClose();
    } else if (top.kind === 'narrative') {
      if (top.nextDisabled) return;
      top.onPressNext();
      return;
    }
    dismiss();
  }, [dismiss, top]);

  const handleAlertButton = useCallback(
    (onPress?: () => void | Promise<void>) => {
      dismiss();
      void Promise.resolve(onPress?.()).catch(() => {});
    },
    [dismiss],
  );

  const handleLevelUpClose = useCallback(() => {
    if (top?.kind === 'levelUp') top.onClose();
    dismiss();
  }, [dismiss, top]);

  const handleRewardClose = useCallback(() => {
    if (top?.kind === 'reward') top.onClose();
    dismiss();
  }, [dismiss, top]);

  const handleWaveResultClose = useCallback(() => {
    if (top?.kind === 'waveResult') top.onClose();
    dismiss();
  }, [dismiss, top]);

  const handleSettingsReset = useCallback(() => {
    if (top?.kind !== 'settings') return;
    const reset = top.onResetAccount;
    dismiss();
    // 확인 알림(alert, z 9999)이 설정 패널 위로 자연스럽게 뜨도록 닫은 뒤 호출
    reset();
  }, [dismiss, top]);

  const handleNarrativeNext = useCallback(() => {
    if (top?.kind !== 'narrative' || top.nextDisabled) return;
    top.onPressNext();
  }, [top]);

  const handleNarrativeSecondary = useCallback(() => {
    if (top?.kind !== 'narrative' || top.nextDisabled) return;
    top.onPressSecondary?.();
  }, [top]);

  const handleTradeQuantityConfirm = useCallback(
    (qty: number) => {
      if (top?.kind !== 'tradeQuantity') return;
      dismiss();
      void Promise.resolve(top.onConfirm(qty)).catch(() => {});
    },
    [dismiss, top],
  );

  const handleTradeQuantityCancel = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const handleArcCoreChatClose = useCallback(() => {
    markArcCoreBootChatFirstFinished();
    dismiss();
    const { useArcCoreAgentSurfaceStore } =
      require('../../arcCore/chat/arcCoreAgentSurfaceStore') as typeof import('../../arcCore/chat/arcCoreAgentSurfaceStore');
    useArcCoreAgentSurfaceStore.getState().activateGame();
  }, [dismiss]);

  if (!entry) return null;

  const chrome = getOverlayChrome(entry.kind);
  const isNarrative = entry.kind === 'narrative';
  const isBottomNarrative = isNarrative && entry.anchor === 'bottom';
  const isBlocking = entry.kind === 'blocking';
  const isTopAnchoredPanel = chrome.hostAnchor === 'top';
  const isFillHost = chrome.hostAnchor === 'fill';
  const backdropClear = chrome.backdrop === 'transparent';
  /** 인게임 대사 — 전체 딤·backdrop 터치·elevation 없음 (시설 화면 그대로 노출) */
  const isPassthroughNarrative = isNarrative && backdropClear;
  const bottomPad = isBottomNarrative ? resolveOverlayBottomAnchorPad(insets, SPACING.md) : 0;
  const overlayHorizontalPad = isFillHost
    ? 0
    : isNarrative
      ? NARRATIVE_DIALOG_LAYOUT.hostHorizontalPadPx
      : SPACING.lg;
  const isCenterNarrativeFill = isNarrative && !isBottomNarrative;
  const contentSlotStyle = isFillHost
    ? styles.fillSlot
    : isBottomNarrative
      ? styles.bottomNarrativeSlot
      : isCenterNarrativeFill
        ? styles.narrativeFillSlot
        : styles.centerSlot;

  const narrativeContent =
    entry.kind === 'narrative' ? (
      <View pointerEvents="auto" style={isPassthroughNarrative ? styles.passthroughNarrativeTouch : undefined}>
        <NarrativeOverlayContent
          entry={entry}
          onPressNext={handleNarrativeNext}
          onPressSecondary={handleNarrativeSecondary}
        />
      </View>
    ) : null;

  if (isPassthroughNarrative) {
    const passthroughWrapStyle = isBottomNarrative
      ? styles.bottomWrap
      : styles.narrativeFillWrap;
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

  const contentFramePad = isFillHost
    ? {
        paddingTop: edges.top,
        paddingBottom: 0,
        paddingLeft: edges.left,
        paddingRight: edges.right,
      }
    : {
        paddingTop: isPassthroughNarrative ? 0 : SPACING.sm + edges.top,
        paddingBottom: isBottomNarrative ? bottomPad : SPACING.sm + edges.bottom,
        paddingLeft: overlayHorizontalPad + edges.left,
        paddingRight: overlayHorizontalPad + edges.right,
      };

  const framePointerEvents = isFillHost || isBlocking ? 'auto' : 'box-none';

  return (
    <View
      style={[
        styles.overlayRoot,
        { zIndex: chrome.zIndex },
        isPassthroughNarrative ? { elevation: 0 } : null,
      ]}
      pointerEvents={isFillHost || isBlocking ? 'auto' : 'box-none'}
      collapsable={false}
    >
      {!isPassthroughNarrative ? (
        <Pressable
          style={[styles.backdropFill, { backgroundColor: chrome.backdrop }]}
          onPress={isBlocking ? undefined : handleBackdrop}
        />
      ) : null}
      <View
        style={[styles.overlayContentFrame, contentFramePad]}
        pointerEvents={framePointerEvents}
        collapsable={false}
      >
      <View
        style={[
          isFillHost
            ? styles.fillWrap
            : isBottomNarrative
              ? styles.bottomWrap
              : isCenterNarrativeFill
                ? styles.narrativeFillWrap
                : styles.centerWrap,
          isTopAnchoredPanel ? styles.topAnchoredWrap : null,
        ]}
        pointerEvents={framePointerEvents}
        collapsable={false}
      >
        <View
          style={contentSlotStyle}
          pointerEvents={framePointerEvents}
          collapsable={false}
        >
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
        {entry.kind === 'relicLore' ? (
          <RelicLoreOverlayContent entry={entry} onClose={dismiss} />
        ) : null}
        {entry.kind === 'hubTalkRoster' ? (
          <HubTalkRosterOverlayContent entry={entry} onClose={dismiss} />
        ) : null}
        {entry.kind === 'planetOwnershipRoster' ? (
          <PlanetOwnershipRosterOverlayContent entry={entry} onClose={dismiss} />
        ) : null}
        {entry.kind === 'arcCoreChat' ? (
          <ArcCoreChatOverlayContent onClose={handleArcCoreChatClose} />
        ) : null}
        {entry.kind === 'skillInfo' ? (
          <SkillInfoOverlayContent entry={entry} onClose={dismiss} />
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
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
  },
  narrativeFillWrap: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  narrativeFillSlot: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 0,
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
  fillWrap: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
  },
  fillSlot: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 0,
    justifyContent: 'flex-end',
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
});
