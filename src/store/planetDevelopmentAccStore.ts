// ============================================================
// 행성 발전도 누적(비영속) — 궤도 수송 등 활동 → 소수 버킷
// 아크코어 타이밍(`runPlanetEnvironmentDiversityPass` 등)에서 소비·`planetCore`에 반영
// 향후 요인 추가: 동일 스토어에 `addWallTickFromXxx` 패턴으로 확장
// ============================================================

import { create } from 'zustand';
import type { ArcNpcTrafficPhase, ArcNpcTrafficShip } from './arcNpcTrafficStore';
import type { PlanetCoreGaugeView } from './planetCoreRuntimeStore';

type AccVec = Record<keyof PlanetCoreGaugeView, number>;

const ZERO: AccVec = {
  resource: 0,
  population: 0,
  defense: 0,
  technology: 0,
  environment: 0,
};

const CORE_KEYS = Object.keys(ZERO) as (keyof AccVec)[];

/** 초당 수송 활동 → 누적 스케일(낮을수록 완만) */
const TRANSPORT_ACTIVITY_PER_WALL_SEC = 0.014;

const PHASE_WEIGHT: Record<ArcNpcTrafficPhase, AccVec> = {
  entering: {
    resource: 0.52,
    population: 0.11,
    defense: 0.09,
    technology: 0.2,
    environment: 0.08,
  },
  dwelling: {
    resource: 0.21,
    population: 0.35,
    defense: 0.07,
    technology: 0.11,
    environment: 0.26,
  },
  departing: {
    resource: 0.24,
    population: 0.13,
    defense: 0.26,
    technology: 0.3,
    environment: 0.07,
  },
};

interface PlanetDevelopmentAccState {
  byPlanetId: Record<string, AccVec>;
  /** 실제 동작 중인 수송선 + 벽시계 dt — 누적만 */
  addWallTickFromTransportShips: (ships: ArcNpcTrafficShip[], wallDeltaSec: number) => void;
  /**
   * 누적분을 정수 델타로 소비(지표별 상한 cap).
   * 반환값을 `planetCore`에 더하면 됨.
   */
  consumeIntegerDeltas: (planetId: string, maxPerStat: number) => PlanetCoreGaugeView;
}

/**
 * 매 프레임(60Hz) zustand `set` 호출이 누적 GC 부하·메모리 폭증의 큰 원인이었다.
 * 이 스토어는 zustand 외부에 **모듈 레벨 가변 버퍼**를 두어, 매 프레임은 in-place 누적만 하고
 * `consumeIntegerDeltas`(아크코어 다양성 패스, 84초 주기)에서 한 번에 zustand로 동기화한다.
 *
 * UI는 이 스토어를 직접 구독하지 않으므로 zustand 측 byPlanetId가 0이어도 문제 없다.
 * (consumeIntegerDeltas 내부에서 항상 모듈 버퍼와 zustand를 합산해 정확한 값을 반환)
 */
const moduleBuffer: Record<string, AccVec> = {};

export const usePlanetDevelopmentAccStore = create<PlanetDevelopmentAccState>((set, get) => ({
  byPlanetId: {},

  addWallTickFromTransportShips: (ships, wallDeltaSec) => {
    if (wallDeltaSec <= 0 || ships.length === 0) return;
    const gain = wallDeltaSec * TRANSPORT_ACTIVITY_PER_WALL_SEC;
    /** 매 프레임: zustand set 없이 모듈 버퍼만 mutate */
    for (const sh of ships) {
      if (!sh.planetId) continue;
      const w = PHASE_WEIGHT[sh.phase];
      let v = moduleBuffer[sh.planetId];
      if (!v) {
        v = { ...ZERO };
        moduleBuffer[sh.planetId] = v;
      }
      for (const k of CORE_KEYS) {
        v[k] += (w[k] ?? 0) * gain;
      }
    }
  },

  consumeIntegerDeltas: (planetId, maxPerStat) => {
    const cap = Math.max(0, Math.min(8, Math.floor(Number(maxPerStat) || 0)));
    const applied: PlanetCoreGaugeView = { ...ZERO };
    if (!planetId || cap === 0) return applied;

    /** 모듈 버퍼 + zustand 누적분을 합산해 소비 */
    const fromZustand = get().byPlanetId[planetId];
    const fromBuffer = moduleBuffer[planetId];
    const merged: AccVec = { ...ZERO };
    if (fromZustand) {
      for (const k of CORE_KEYS) merged[k] = fromZustand[k];
    }
    if (fromBuffer) {
      for (const k of CORE_KEYS) merged[k] += fromBuffer[k];
    }

    for (const k of CORE_KEYS) {
      const take = Math.min(cap, Math.floor(merged[k]));
      applied[k] = take;
      merged[k] -= take;
    }

    /** 모듈 버퍼는 비우고, 잔여(소수)만 zustand에 1회 set으로 반영 */
    delete moduleBuffer[planetId];
    set((prev) => ({ byPlanetId: { ...prev.byPlanetId, [planetId]: merged } }));
    return applied;
  },
}));
