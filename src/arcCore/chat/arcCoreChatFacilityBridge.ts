// 허브 시설 문 — planet.tsx 가 마운트 중에만 등록. 틱/부트 없음.
// 모델·명령버스는 여기 버튼을 누르지 않는다. 플레이어 확인 후에만 몸이 연다.

import type { Href } from 'expo-router';

export type ArcCoreChatFacilityOpener = (href: Href) => void;

let opener: ArcCoreChatFacilityOpener | null = null;

export function registerArcCoreChatFacilityOpener(next: ArcCoreChatFacilityOpener | null): void {
  opener = next;
}

export function hasArcCoreChatFacilityOpener(): boolean {
  return opener != null;
}

export function runArcCoreChatFacilityOpener(href: Href): boolean {
  if (!opener) return false;
  opener(href);
  return true;
}
