/**
 * 스파이 긴급보고 자동창 게이트 — 착륙 대사 시도 후에만 오픈.
 * 틱/persist 없음. 서브코어는 이 모듈만 reset (게임 UI import 금지).
 */

import { shouldSkipWorldOpsNotifyUntilPlanetHub } from '../../navigation/worldOpsNotifyPresence';

let landDialogSyncPlanetId: string | null = null;
let spyIntelIdleArmed = false;

export function markPlanetHubLandDialogSyncDone(planetId: string): void {
  const pid = String(planetId ?? '').trim();
  landDialogSyncPlanetId = pid || null;
}

export function resetPlanetHubSpyIntelDialogSchedule(): void {
  landDialogSyncPlanetId = null;
  spyIntelIdleArmed = false;
}

export function hasPlanetHubLandDialogSyncDone(planetId: string): boolean {
  return landDialogSyncPlanetId === String(planetId ?? '').trim();
}

export function isSpyIntelAutoOpenIdleArmed(): boolean {
  return spyIntelIdleArmed;
}

export function setSpyIntelAutoOpenIdleArmed(armed: boolean): void {
  spyIntelIdleArmed = armed;
}

/** 허브 전·착륙 오퍼레이터 시도 전 — 자동창 보류 */
export function shouldHoldSpyIntelAutoOpen(planetId: string): boolean {
  const pid = String(planetId ?? '').trim();
  if (!pid) return true;
  if (shouldSkipWorldOpsNotifyUntilPlanetHub()) return true;
  if (!hasPlanetHubLandDialogSyncDone(pid)) return true;
  return false;
}
