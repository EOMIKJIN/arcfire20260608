// ============================================================
// 웨이브 디펜스 오케스트레이터 훅 — planet.tsx(허브)에서 사용.
// 트리거(웨이브 디펜스 행성 도착+10초) → 웨이브1 → (red 전멸=cleared) → 다음 웨이브
//   → 9웨이브 클리어/플레이어 격파(ended) → 오퍼레이터 종료 대사.
// sim 루프는 전멸/격파 시 store.phase 만 갱신; 실제 진행 결정은 본 컨트롤러가 담당.
//
// 재개 대기(waveCombatCooldownStore) 계약 요약(2026-07-27 허브 메인스테이지 교전과 범용 공유):
//   - 이 컨트롤러는 웨이브 승리 시 handleWaveDefenseRunEnded(planet.tsx)가 markWaveCombatVictoryCooldown 호출.
//   - resolvePlanetWaveCombatTrigger가 다음 웨이브 트리거 전에 isWaveCombatCooldownActive를 선행 검사.
//   - 허브 비-웨이브 교전(PlanetEdenRaidTestLayer, mainStageCombatEnabled 행성)은 자동 리스폰 재교전 없이
//     동일 쿨다운 스토어를 공유 — planet.tsx의 enemyFleetEntered가 진입 시점에 동일하게 게이트한다.
//   - 이 훅 자체의 9웨이브·전환 로직·30분 상수는 이번 변경으로 손대지 않음(범용화는 스토어·게이트 레이어에서만).
// ============================================================

import { useEffect, useRef } from 'react';
import { buildWaveDefenseEnemyFleet, WAVE_DEFENSE_MAX_WAVES } from './waveDefenseFleet';
import { resolvePlanetWaveCombatTrigger } from './resolvePlanetWaveCombatTrigger';
import { useWaveDefenseStore } from './waveDefenseStore';

/** 도착(인트로 종료) 후 침공 시작까지 지연 */
const WAVE_DEFENSE_TRIGGER_DELAY_MS = 10_000;
/** 웨이브 전환(전멸 후 다음 웨이브 준비) 간격 */
const WAVE_DEFENSE_BETWEEN_WAVE_MS = 2600;
/**
 * 정체(stall) failsafe — 같은 웨이브·위상에서 진행 없이 이 시간이 지나면 패배 종료(퇴각).
 * 런이 ended에 도달하지 못하면 전투 Skia 레이어·함대 뷰가 무기한 잔류하고
 * phase='combat' 동안 주기 reclaim까지 억제되어 PSS 900MB+ 고착이 발생한다
 * (2026-07-20 22:11~00:30 GL 130MB·Views 567 2h 잔류 → 모니터 강제 재기동 실측).
 * 최장 웨이브(eternal_throne targetEngageSec 240s)의 2.5배 여유.
 */
const WAVE_DEFENSE_STALL_FAILSAFE_MS = 10 * 60_000;

type WaveDefenseControllerArgs = {
  planetId: string | null;
  systemId: string | null;
  /** 웨이브 디펜스 활성 행성 여부(CSV `mainStageCombatVariant` 기준 — 예: vega_base=draco_wave, eternal_throne=endgame_boss) */
  waveDefenseEnabled: boolean;
  /** 인트로/착륙 대사 종료 여부(대사 표시 중이면 false) */
  introDone: boolean;
  routeFocused: boolean;
  appActive: boolean;
  /** 전체 종료(클리어/격파) 시 1회 — 오퍼레이터 종료 대사 트리거 */
  onRunEnded: () => void;
};

export function useWaveDefenseController(args: WaveDefenseControllerArgs): void {
  const { planetId, systemId, waveDefenseEnabled, introDone, routeFocused, appActive, onRunEnded } = args;
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

  // 트리거: 웨이브 디펜스 행성 도착 + 인트로 종료 → 10초 후 웨이브1 시작 (방문당 1회)
  useEffect(() => {
    if (!waveDefenseEnabled || !planetId || active || ranThisVisitRef.current) return;
    if (!routeFocused || !appActive || !introDone) return;
    if (triggerTimerRef.current) return;
    triggerTimerRef.current = setTimeout(() => {
      triggerTimerRef.current = null;
      const s = useWaveDefenseStore.getState();
      if (s.active) return;
      // 발화 시점 재판정 — 예약 후 10초 사이 상태 변화(승리 쿨다운·중립화 등) 시 stale 시작 차단
      if (!resolvePlanetWaveCombatTrigger(planetId).enabled) return;
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
  }, [waveDefenseEnabled, planetId, systemId, active, routeFocused, appActive, introDone]);

  // 정체 failsafe — 같은 (웨이브, 위상)에서 진행 없이 10분 경과 시 패배 종료(퇴각 판정).
  // 교전 sim 정체·대사/오버레이 경합 등으로 ended에 도달하지 못한 채 전투 레이어가
  // 무기한 상주(GL·Views 잔류 + 주기 reclaim 억제)하는 것을 차단한다.
  useEffect(() => {
    if (!active) return;
    const stallTimer = setTimeout(() => {
      const s = useWaveDefenseStore.getState();
      if (!s.active) return;
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(`[wave-defense] stall failsafe — wave=${s.waveIndex} phase=${s.phase} → endRun(lose)`);
      }
      s.endRun('lose');
    }, WAVE_DEFENSE_STALL_FAILSAFE_MS);
    return () => clearTimeout(stallTimer);
  }, [active, phase, waveIndex]);

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
