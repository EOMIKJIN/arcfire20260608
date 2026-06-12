// ============================================================
// 아크코어 메시지 미사일 — 근접 비명중 후 행성 파라미터 기반 작업(스텁)
// 상세 전략·피해·방어위성 요격은 추후 `AiPlanetsSubCore`·방어 시설과 연동.
// ============================================================

import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { PlanetCoreMetricsDetail } from '../../store/planetCoreMetricTypes';

function bumpNearMissDetail(
  detail: PlanetCoreMetricsDetail | undefined,
  atMs: number,
): PlanetCoreMetricsDetail {
  const prev = detail?.arcCoreMessage;
  const nearMissCount = (prev?.nearMissCount ?? 0) + 1;
  return {
    ...detail,
    arcCoreMessage: {
      version: 1,
      nearMissCount,
      lastNearMissAtMs: atMs,
      interceptCount: prev?.interceptCount,
      lastInterceptAtMs: prev?.lastInterceptAtMs,
      lastMessageKo: prev?.lastMessageKo,
    },
  };
}

/**
 * 방어 미구현 — 탄두가 행성을 스치고 지나간 뒤 호출.
 * 현재는 `detail.arcCoreMessage` 누적·타임스탬프만 기록한다.
 */
export function runArcCoreMessageNearMissPlanetPass(planetId: string, messageKo?: string): void {
  const store = usePlanetCoreRuntimeStore.getState();
  const cur = store.getPlanetCoreRuntime(planetId);
  if (!cur) return;
  const atMs = Date.now();
  const detail = bumpNearMissDetail(cur.detail, atMs);
  if (messageKo) {
    detail.arcCoreMessage = {
      ...detail.arcCoreMessage!,
      lastMessageKo: messageKo,
    };
  }
  store.patchPlanetCore(planetId, { detail });
}
