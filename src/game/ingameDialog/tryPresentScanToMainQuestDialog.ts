/**
 * 스캔 완료 1회 — 오퍼레이터 1차만. 메인퀘·메신저 자동 오픈 없음.
 * persist는 once 씬 seen. 틱 없음. 허브 1.5초 뒤 present.
 */
import { tryFireIngameDialogTrigger } from './ingameDialogApi';
import { runAfterIngameDialogFeatureLinkDelay } from './ingameDialogFeatureLink';

let pendingScanPlanetId: string | null = null;

function firePendingScanDialog(): void {
  const pid = pendingScanPlanetId;
  pendingScanPlanetId = null;
  if (!pid) return;
  tryFireIngameDialogTrigger('planet_scan_complete', pid);
}

function schedulePendingScanDialog(): void {
  if (!pendingScanPlanetId) return;
  const pid = pendingScanPlanetId;
  runAfterIngameDialogFeatureLinkDelay(() => {
    firePendingScanDialog();
  }, pid);
}

export function tryPresentScanToMainQuestDialog(planetId: string): boolean {
  const pid = (planetId ?? '').trim();
  if (!pid) return false;
  pendingScanPlanetId = pid;
  schedulePendingScanDialog();
  return true;
}

/** 허브 이탈로 타이머가 끊긴 뒤, 같은 행성 포커스 복귀 시 1.5초로 재예약. */
export function flushPendingScanIngameDialog(currentPlanetId?: string | null): void {
  if (!pendingScanPlanetId) return;
  const current = (currentPlanetId ?? '').trim();
  if (current && current !== pendingScanPlanetId) return;
  schedulePendingScanDialog();
}

export function peekPendingScanIngameDialogPlanetId(): string | null {
  return pendingScanPlanetId;
}
