// ============================================================
// 스파이 활동 시작 → 정보원 인게임 대화 알림 큐
// ============================================================

import { resolveArcCoreSpyPolicy } from './arcCoreSpyPolicy';
import {
  getPendingArcCoreSpyIntelAlertForPlanet,
  queueArcCoreSpyIntelAlert,
} from './arcCoreSpyIntelAlertStore';
import {
  rollSpyIntelNotifyPass,
  resolveSpyIntelNotifyProbabilityPct,
} from './resolveSpyIntelNotifyProbabilityPct';

export function buildArcCoreSpyIntelAckKey(planetId: string, spyCaptainId: string): string {
  return `hub_spy_intel:${planetId}:${spyCaptainId}`;
}

export type TryNotifyArcCoreSpyIntelAlertInput = {
  planetId: string;
  /** 이번 tick 에 새로 활동을 시작한 스파이 id */
  newlyArrivedSpyCaptainIds: readonly string[];
  /** 현재 행성 활성 스파이 전체 */
  activeSpyCaptainIds: readonly string[];
  /** 세션 내 이미 알림한 스파이 키 Set (mutate) */
  notifiedSpyKeys: Set<string>;
};

/**
 * 스파이가 행성 체류 인원에 새로 포함될 때 정보원 대화 알림 큐.
 * zero/low-allocation — edge tick 에만 호출.
 */
export function tryNotifyArcCoreSpyIntelAlert(input: TryNotifyArcCoreSpyIntelAlertInput): void {
  const policy = resolveArcCoreSpyPolicy();
  if (!policy.enabled) return;

  const planetId = String(input.planetId ?? '').trim();
  if (!planetId || input.newlyArrivedSpyCaptainIds.length === 0) return;

  const notifyPct = resolveSpyIntelNotifyProbabilityPct(planetId);
  const sceneId = policy.informantDialogSceneId;
  const informantCaptainId = policy.informantCaptainId;

  for (let i = 0; i < input.newlyArrivedSpyCaptainIds.length; i += 1) {
    const spyCaptainId = input.newlyArrivedSpyCaptainIds[i]!;
    const dedupeKey = `${planetId}:${spyCaptainId}`;
    if (input.notifiedSpyKeys.has(dedupeKey)) continue;
    if (!rollSpyIntelNotifyPass(planetId, spyCaptainId, notifyPct)) {
      input.notifiedSpyKeys.add(dedupeKey);
      continue;
    }
    input.notifiedSpyKeys.add(dedupeKey);

    const existing = getPendingArcCoreSpyIntelAlertForPlanet(planetId);
    if (existing && existing.primarySpyCaptainId === spyCaptainId) continue;

    queueArcCoreSpyIntelAlert({
      planetId,
      primarySpyCaptainId: spyCaptainId,
      spyCaptainIds: input.activeSpyCaptainIds,
      informantCaptainId,
      sceneId,
      ackKey: buildArcCoreSpyIntelAckKey(planetId, spyCaptainId),
      detectedAtMs: Date.now(),
    });
    break;
  }
}
