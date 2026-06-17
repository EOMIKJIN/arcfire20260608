// ============================================================
// 웨이브 디펜스 오케스트레이터 훅 — planet.tsx(허브)에서 사용.
// 트리거(테스트베드 도착+10초) → 웨이브1 → (red 전멸=cleared) → 다음 웨이브
//   → 9웨이브 클리어/플레이어 격파(ended) → 오퍼레이터 종료 대사.
// sim 루프는 전멸/격파 시 store.phase 만 갱신; 실제 진행 결정은 본 컨트롤러가 담당.
// ============================================================

import { useEffect, useRef } from 'react';
import { buildWaveDefenseEnemyFleet, WAVE_DEFENSE_MAX_WAVES } from './waveDefenseFleet';
import { useWaveDefenseStore } from './waveDefenseStore';

/** 테스트: 도착(인트로 종료) 후 침공 시작까지 지연 */
const WAVE_DEFENSE_TRIGGER_DELAY_MS = 10_000;
/** 웨이브 전환(전멸 후 다음 웨이브 준비) 간격 */
const WAVE_DEFENSE_BETWEEN_WAVE_MS = 2600;

type WaveDefenseControllerArgs = {
  planetId: string | null;
  systemId: string | null;
  /** 웨이브 테스트 베드 행성 여부(예: vega_base) */
  isTestBed: boolean;
  /** 인트로/착륙 대사 종료 여부(대사 표시 중이면 false) */
  introDone: boolean;
  routeFocused: boolean;
  appActive: boolean;
  /** 전체 종료(클리어/격파) 시 1회 — 오퍼레이터 종료 대사 트리거 */
  onRunEnded: () => void;
};

export function useWaveDefenseController(args: WaveDefenseControllerArgs): void {
  const { planetId, systemId, isTestBed, introDone, routeFocused, appActive, onRunEnded } = args;
  const active = useWaveDefenseStore((s) => s.active);
  const phase = useWaveDefenseStore((s) => s.phase);
  const waveIndex = useWaveDefenseStore((s) => s.waveIndex);

  const triggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const betweenWaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ranThisVisitRef = useRef(false);
  const endedHandledRef = useRef(false);
  /** 같은 cleared 위상에서 보상 경험치 중복 누적 방지(웨이브당 1회) */
  const lastExpAwardedWaveRef = useRef(0);

  // 행성이 바뀌면 "이번 방문 1회" 가드 초기화 + 진행 중 런 정리
  useEffect(() => {
    ranThisVisitRef.current = false;
    lastExpAwardedWaveRef.current = 0;
    return () => {
      const s = useWaveDefenseStore.getState();
      if (s.active) s.reset();
    };
  }, [planetId]);

  // 트리거: 테스트베드 도착 + 인트로 종료 → 10초 후 웨이브1 시작 (방문당 1회)
  useEffect(() => {
    if (!isTestBed || !planetId || active || ranThisVisitRef.current) return;
    if (!routeFocused || !appActive || !introDone) return;
    if (triggerTimerRef.current) return;
    triggerTimerRef.current = setTimeout(() => {
      triggerTimerRef.current = null;
      const s = useWaveDefenseStore.getState();
      if (s.active) return;
      ranThisVisitRef.current = true;
      lastExpAwardedWaveRef.current = 0;
      s.startRun(planetId, systemId);
      s.setWave(1, buildWaveDefenseEnemyFleet(1));
    }, WAVE_DEFENSE_TRIGGER_DELAY_MS);
    return () => {
      if (triggerTimerRef.current) {
        clearTimeout(triggerTimerRef.current);
        triggerTimerRef.current = null;
      }
    };
  }, [isTestBed, planetId, systemId, active, routeFocused, appActive, introDone]);

  // 웨이브 클리어(red 전멸) → 다음 웨이브 또는 전체 종료
  useEffect(() => {
    if (!active || phase !== 'cleared') return;
    // 이번 클리어 웨이브 보상 경험치 1회 누적(다음 웨이브 전환·승리 종료 공통 선처리)
    if (lastExpAwardedWaveRef.current !== waveIndex) {
      lastExpAwardedWaveRef.current = waveIndex;
      useWaveDefenseStore.getState().recordWaveCleared(waveIndex);
    }
    if (betweenWaveTimerRef.current) return;
    if (waveIndex >= WAVE_DEFENSE_MAX_WAVES) {
      useWaveDefenseStore.getState().endRun('win');
      return;
    }
    betweenWaveTimerRef.current = setTimeout(() => {
      betweenWaveTimerRef.current = null;
      const s = useWaveDefenseStore.getState();
      if (!s.active) return;
      const next = s.waveIndex + 1;
      s.setWave(next, buildWaveDefenseEnemyFleet(next));
    }, WAVE_DEFENSE_BETWEEN_WAVE_MS);
    return () => {
      if (betweenWaveTimerRef.current) {
        clearTimeout(betweenWaveTimerRef.current);
        betweenWaveTimerRef.current = null;
      }
    };
  }, [active, phase, waveIndex]);

  // 전체 종료(ended) → 오퍼레이터 종료 대사 1회
  useEffect(() => {
    if (phase === 'ended' && !endedHandledRef.current) {
      endedHandledRef.current = true;
      onRunEnded();
    }
    if (phase !== 'ended') {
      endedHandledRef.current = false;
    }
  }, [phase, onRunEnded]);

  // 언마운트 안전 정리
  useEffect(() => {
    return () => {
      if (triggerTimerRef.current) clearTimeout(triggerTimerRef.current);
      if (betweenWaveTimerRef.current) clearTimeout(betweenWaveTimerRef.current);
    };
  }, []);
}
