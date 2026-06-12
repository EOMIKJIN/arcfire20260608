// ============================================================
// 아크코어 메시지 미사일 — 방위위성 요격 성공 후 행성 파라미터 기록
// ============================================================

import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { PlanetCoreMetricsDetail } from '../../store/planetCoreMetricTypes';

function bumpInterceptDetail(
  detail: PlanetCoreMetricsDetail | undefined,
  atMs: number,
): PlanetCoreMetricsDetail {
  const prev = detail?.arcCoreMessage;
  const interceptCount = (prev?.interceptCount ?? 0) + 1;
  return {
    ...detail,
    arcCoreMessage: {
      version: 1,
      nearMissCount: prev?.nearMissCount ?? 0,
      lastNearMissAtMs: prev?.lastNearMissAtMs,
      interceptCount,
      lastInterceptAtMs: atMs,
      lastMessageKo: prev?.lastMessageKo,
    },
  };
}

/** 방위위성 요격미사일로 아크코어 장거리 미사일을 격추한 뒤 호출. */
export function runArcCoreMessageInterceptPlanetPass(
  planetId: string,
  messageKo?: string,
): void {
  const store = usePlanetCoreRuntimeStore.getState();
  const cur = store.getPlanetCoreRuntime(planetId);
  if (!cur) return;
  const atMs = Date.now();
  const detail = bumpInterceptDetail(cur.detail, atMs);
  if (messageKo) {
    detail.arcCoreMessage = {
      ...detail.arcCoreMessage!,
      lastMessageKo: messageKo,
    };
  }
  store.patchPlanetCore(planetId, { detail });
}
