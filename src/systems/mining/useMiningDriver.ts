// ============================================================
// 채굴 드라이버 훅 — Phase 3 (시뮬레이션-UI 디커플링)
// ----------------------------------------------------------------------
// planet.tsx 안에 산재하던 `setInterval` + tick 분배 로직을 단일 훅으로 격리한다.
//
// 책임:
//   - `enabled` 신호가 true 인 동안 500ms 인터벌로 채굴 tick 평가
//   - `runMiningTick` 결과를 ORBIT_MINING_SESSION_MAX_UNITS 한도 내에서 분배
//   - 게이지 UI 갱신은 `MINING_GAUGE_UI_MIN_STEP_MS`(2s)로 스로틀
//   - tick 보상은 `onGrant` 로 위임(인벤토리 add·뱃지·persist 등은 호출자 책임)
//
// 호출자(planet.tsx) 가 신경 쓰지 않는 것:
//   - 인터벌 cleanup 시점·중복 실행 방어·세션 카운터 비례 분배 알고리즘
//
// lifecycle 정합:
//   - `enabled` 에 stageSession.isActive 를 포함시키면 출발(suspending/frozen) 즉시 정지된다.
// ============================================================

import { useEffect, useRef, type MutableRefObject } from 'react';
import { AppState } from 'react-native';
import {
  ORBIT_MINING_CYCLE_MS,
  ORBIT_MINING_MAX_CATCH_UP_CYCLES,
} from '../../game/miningConfig';
import { runMiningTick, stopMiningSession } from './service';
import type { MiningSessionState } from './types';
import { resolvePlanetMineralLedgerPolicy } from '../../arcCore/planetResource/planetMineralLedgerPolicy';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { usePlanetMineralLedgerStore } from '../../store/planetMineralLedgerStore';

/** 게이지 UI 갱신 최소 간격 — 500ms 인터벌 대비 과도한 리렌더 방지(체감 영향 미미). */
const MINING_GAUGE_UI_MIN_STEP_MS = 2000;
const MINING_TICK_INTERVAL_MS = 500;

export interface MiningGrant {
  goodId: string;
  quantity: number;
}

export interface UseMiningDriverOptions {
  /** false 가 되는 즉시 인터벌이 정리된다(다음 tick 진입 차단). */
  enabled: boolean;
  /** 채굴 세션의 살아있는 ref — driver 가 매 tick 마다 최신값을 본다. */
  sessionRef: MutableRefObject<MiningSessionState>;
  /** 행성 R 스탯 기반 세션 상한 — planetId */
  resolveSessionMaxUnits: (planetId: string) => number;
  /** tick/cap 도달 시 React state 갱신용. */
  applySession: (next: MiningSessionState) => void;
  /** 게이지 UI 시각 갱신용(스로틀 처리는 driver 가 담당). */
  applyUiNowMs: (nowMs: number) => void;
  /** tick 보상 적재 콜백 — 인벤토리·뱃지·persist 는 호출자 책임. */
  onGrant: (grants: MiningGrant[]) => void;
}

export function useMiningDriver(opts: UseMiningDriverOptions): void {
  const { enabled, sessionRef, resolveSessionMaxUnits, applySession, applyUiNowMs, onGrant } = opts;

  /** 콜백을 ref 로 잡아두면 호출자 콜백 변경 시 인터벌 재생성을 피할 수 있다(틱 누락 방지). */
  const applySessionRef = useRef(applySession);
  const applyUiNowMsRef = useRef(applyUiNowMs);
  const onGrantRef = useRef(onGrant);
  const resolveSessionMaxUnitsRef = useRef(resolveSessionMaxUnits);
  const lastGaugeUiAtRef = useRef(0);

  useEffect(() => {
    applySessionRef.current = applySession;
  }, [applySession]);
  useEffect(() => {
    applyUiNowMsRef.current = applyUiNowMs;
  }, [applyUiNowMs]);
  useEffect(() => {
    onGrantRef.current = onGrant;
  }, [onGrant]);
  useEffect(() => {
    resolveSessionMaxUnitsRef.current = resolveSessionMaxUnits;
  }, [resolveSessionMaxUnits]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const id = setInterval(() => {
      if (!alive || AppState.currentState !== 'active') return;
      const now = Date.now();
      const prev = sessionRef.current;
      if (prev.status !== 'running') return;
      const planetId = prev.planetId;
      if (!planetId) return;
      const sessionMaxUnits = Math.max(1, resolveSessionMaxUnitsRef.current(planetId));
      const runtimeR =
        usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId)?.resource;
      const ledgerPolicy = resolvePlanetMineralLedgerPolicy();
      if (ledgerPolicy.enabled) {
        const reserve = usePlanetMineralLedgerStore.getState().getReserveUnits(planetId, runtimeR);
        if (reserve <= ledgerPolicy.miningReserveFloorUnits) {
          const stopped = stopMiningSession();
          sessionRef.current = stopped;
          applySessionRef.current(stopped);
          return;
        }
      }
      const last = prev.lastTickAtMs ?? now;
      const elapsed = now - last;

      if (elapsed < ORBIT_MINING_CYCLE_MS) {
        if (now - lastGaugeUiAtRef.current < MINING_GAUGE_UI_MIN_STEP_MS) return;
        lastGaugeUiAtRef.current = now;
        applyUiNowMsRef.current(now);
        return;
      }

      const sessionOre = prev.orbitSessionOreTotal ?? 0;
      if (sessionOre >= sessionMaxUnits) {
        const stopped = stopMiningSession();
        sessionRef.current = stopped;
        applySessionRef.current(stopped);
        return;
      }

      const rawCycles = Math.max(1, Math.floor(elapsed / ORBIT_MINING_CYCLE_MS));
      const cycles = Math.min(rawCycles, ORBIT_MINING_MAX_CATCH_UP_CYCLES);
      const tick = runMiningTick(prev, now);
      const grantedByTick = tick.grantedItems.map((granted) => ({
        goodId: granted.goodId,
        quantity: granted.quantity * cycles,
      }));
      const rawTotal = grantedByTick.reduce((s, g) => s + g.quantity, 0);
      const remaining = sessionMaxUnits - sessionOre;
      const toGrantTotal = Math.min(rawTotal, remaining);

      let grantsForInventory: MiningGrant[];
      if (toGrantTotal <= 0) {
        grantsForInventory = [];
      } else if (toGrantTotal >= rawTotal) {
        grantsForInventory = grantedByTick;
      } else if (grantedByTick.length === 1) {
        grantsForInventory = [{ ...grantedByTick[0]!, quantity: toGrantTotal }];
      } else {
        let left = toGrantTotal;
        grantsForInventory = grantedByTick.map((g, i) => {
          if (i === grantedByTick.length - 1) {
            return { ...g, quantity: left };
          }
          const q = Math.floor((g.quantity / rawTotal) * toGrantTotal);
          const take = Math.min(q, left);
          left -= take;
          return { ...g, quantity: take };
        });
      }

      const nextOreTotal = sessionOre + toGrantTotal;
      const hitCap = nextOreTotal >= sessionMaxUnits;
      const nextSession: MiningSessionState = hitCap
        ? stopMiningSession()
        : {
            ...tick.nextState,
            lastTickAtMs: now,
            orbitSessionOreTotal: nextOreTotal,
          };

      sessionRef.current = nextSession;
      lastGaugeUiAtRef.current = now;
      applyUiNowMsRef.current(now);
      applySessionRef.current(nextSession);

      if (grantsForInventory.length > 0) {
        const filtered = grantsForInventory.filter((g) => g.quantity > 0);
        if (ledgerPolicy.enabled && filtered.length > 0) {
          let totalQty = filtered.reduce((s, g) => s + g.quantity, 0);
          const consumed = usePlanetMineralLedgerStore
            .getState()
            .consumeReserve(planetId, totalQty, runtimeR);
          if (consumed <= 0) {
            const stopped = stopMiningSession();
            sessionRef.current = stopped;
            applySessionRef.current(stopped);
            return;
          }
          if (consumed < totalQty) {
            let left = consumed;
            const scaled = filtered.map((g, i) => {
              if (i === filtered.length - 1) {
                return { ...g, quantity: left };
              }
              const q = Math.min(g.quantity, Math.floor((g.quantity / totalQty) * consumed));
              left -= q;
              return { ...g, quantity: q };
            }).filter((g) => g.quantity > 0);
            onGrantRef.current(scaled);
            if (consumed < totalQty) {
              const stopped = stopMiningSession();
              sessionRef.current = stopped;
              applySessionRef.current(stopped);
            }
            return;
          }
        }
        onGrantRef.current(filtered);
      }
    }, MINING_TICK_INTERVAL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [enabled, sessionRef]);
}
