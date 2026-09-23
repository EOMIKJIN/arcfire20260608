// ============================================================
// 아크코어 선실행 — 콜드스타트 1회 전면 채널, 부트/타이틀 게이트와 분리
// 정본: docs/ARC_CORE_BOOT_CHAT_FIRST.md
// ============================================================

import { ARC_CORE_CHAT_OVERLAY_ID, useArcOverlayStore } from '../../ui/overlay/arcOverlayStore';
import { isArcCoreBootChatFirstStartPhrase } from './arcCoreBootChatFirstPhrases';

export { isArcCoreBootChatFirstStartPhrase };

/** true = 최초 실행 얼굴을 아크코어 채널로. 원복은 이 상수만 false */
export const ARC_CORE_BOOT_CHAT_FIRST = false;

let presentedThisRuntime = false;
let active = ARC_CORE_BOOT_CHAT_FIRST;
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

function setActive(next: boolean): void {
  if (active === next) return;
  active = next;
  emit();
}

export function isArcCoreBootChatFirstEnabled(): boolean {
  return ARC_CORE_BOOT_CHAT_FIRST;
}

export function isArcCoreBootChatFirstActive(): boolean {
  return active;
}

export function getArcCoreBootChatFirstSnapshot(): boolean {
  return active;
}

export function subscribeArcCoreBootChatFirst(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function markArcCoreBootChatFirstFinished(): void {
  setActive(false);
}

/** JS 런타임 1회 가드. true면 호출측이 즉시 present. 부트 대기 없음. */
export function claimArcCoreBootChatFirstPresent(): boolean {
  if (!ARC_CORE_BOOT_CHAT_FIRST) {
    setActive(false);
    return false;
  }
  if (presentedThisRuntime) return false;
  presentedThisRuntime = true;
  setActive(true);
  return true;
}

export function dismissArcCoreBootChatFirstToTitle(): void {
  markArcCoreBootChatFirstFinished();
  useArcOverlayStore.getState().dismissWhere((e) => e.id === ARC_CORE_CHAT_OVERLAY_ID);
  const { useArcCoreAgentSurfaceStore } =
    require('./arcCoreAgentSurfaceStore') as typeof import('./arcCoreAgentSurfaceStore');
  useArcCoreAgentSurfaceStore.getState().activateGame({ immediate: true });
}
