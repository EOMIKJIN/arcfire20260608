// ============================================================
// 웨이브 디펜스 오케스트레이터 훅 — planet.tsx(허브)에서 사용.
// 트리거(인트로 종료 즉시 또는 체류 중 분쟁 차례 pending) → 웨이브1 → (red 전멸=cleared) → 다음 웨이브
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
import { isPlayerShipCombatCapable } from '../playerSurvivalPod';
import { preloadPlanetCapitalCombatStack } from '../planetCapitalCombatIntegration';
import { usePlayerStore } from '../../store/playerStore';
import { buildWaveDefenseEnemyFleet, WAVE_DEFENSE_MAX_WAVES } from './waveDefenseFleet';
import { resolvePlanetWaveCombatTrigger } from './resolvePlanetWaveCombatTrigger';
import { consumeChatArmedWavePending } from './chatArmedWavePending';
import { COMBAT_END_HOLD_MS } from '../combatEndHold';
import { useWaveDefenseStore } from './waveDefenseStore';

/** 웨이브 전환(전멸 후 다음 웨이브 준비) 간격 */
const WAVE_DEFENSE_BETWEEN_WAVE_MS = 2600;
/**
 * 정체(stall) failsafe — 같은 웨이브·위상에서 진행 없이 이 시간이 지나면 패배 종료(퇴각).
 * 런이 ended에 도달하지 못하면 전투 Skia 레이어·함대 뷰가 무기한 잔류하고
 * phase='combat' 동안 주기 reclaim까지 억제되어 PSS 900MB+ 고착이 발생한다
 * (2026-07-20 22:11~00:30 GL 130MB·Views 567 2h 잔류 → 모니터 강제 재기동 실측).
 * 최장 웨이브(eternal_throne targetEngageSec 240s)의 2.5배 여유.
 * **교전 sim이 실제로 돌 때만** 기산한다(아래 combatSimActive).
 */
const WAVE_DEFENSE_STALL_FAILSAFE_MS = 10 * 60_000;
/**
 * store는 phase=combat 인데 capitalCombatOrbitActive가 안 켜진 채(전투 불가 함선·세션 비활성 등)
 * 승패 경로가 영구히 안 도는 orphan 고착 차단 — 짧은 벽시계 후 패배 종료.
 */
const WAVE_DEFENSE_COMBAT_NEVER_MOUNTED_MS = 45_000;

type WaveDefenseControllerArgs = {
  planetId: string | null;
  systemId: string | null;
  /** 웨이브 디펜스 활성 여부 — resolvePlanetWaveCombatTrigger 정본(순차 분쟁 리스트 + endgame 예외) */
  waveDefenseEnabled: boolean;
  /** 인트로/착륙 대사 종료 여부(대사 표시 중이면 false) */
  introDone: boolean;
  routeFocused: boolean;
  appActive: boolean;
  /**
   * 허브 capital 교전 sim 실제 가동 여부(`capitalCombatOrbitActive`).
   * stall은 sim이 돌 때만, orphan은 sim이 안 뜰 때만 적용.
   */
  combatSimActive: boolean;
  /** 전체 종료(클리어/격파) 시 1회 — 오퍼레이터 종료 대사 트리거 */
  onRunEnded: () => void;
};

export function useWaveDefenseController(args: WaveDefenseControllerArgs): void {
  const {
    planetId,
    systemId,
    waveDefenseEnabled,
    introDone,
    routeFocused,
    appActive,
    combatSimActive,
    onRunEnded,
  } = args;
  const active = useWaveDefenseStore((s) => s.active);
  const phase = useWaveDefenseStore((s) => s.phase);
  const waveIndex = useWaveDefenseStore((s) => s.waveIndex);
  const pendingOutcome = useWaveDefenseStore((s) => s.pendingOutcome);

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

  // 전투 청크 선로드 — 인트로 중에도 JS import만(Canvas 없음). READY 카운트와 겹쳐 첫 마운트 hitch 완화.
  useEffect(() => {
    if (!waveDefenseEnabled || !planetId || !routeFocused || !appActive) return;
    preloadPlanetCapitalCombatStack();
  }, [waveDefenseEnabled, planetId, routeFocused, appActive]);

  // 트리거: 도착+인트로 종료 즉시 웨이브1(Ready 카운트). 대기타임 없음.
  // 분쟁 차례(territorial_turn)는 체류 중 재발화 허용(방문 1회 가드 우회).
  useEffect(() => {
    if (!waveDefenseEnabled || !planetId || active) return;
    const startRule = resolvePlanetWaveCombatTrigger(planetId).rule;
    if (ranThisVisitRef.current && startRule !== 'territorial_turn') return;
    if (!routeFocused || !appActive || !introDone) return;
    const s = useWaveDefenseStore.getState();
    if (s.active) return;
    const trigger = resolvePlanetWaveCombatTrigger(planetId);
    if (!trigger.enabled) return;
    if (ranThisVisitRef.current && trigger.rule !== 'territorial_turn') return;
    // 전투 불가(생존포드·내구 0)면 침공 런을 시작하지 않음 — store만 combat로 남는 orphan 방지.
    // ranThisVisit 전에 검사해, 함선 복구 후 같은 방문에서 재시도 가능.
    if (!isPlayerShipCombatCapable(usePlayerStore.getState().player?.ship)) return;
    ranThisVisitRef.current = true;
    lastExpAwardedWaveRef.current = 0;
    s.startRun(planetId, systemId);
    s.setWave(1, buildWaveDefenseEnemyFleet(1, planetId));
    if (trigger.rule === 'chat_armed') consumeChatArmedWavePending(planetId);
  }, [waveDefenseEnabled, planetId, systemId, active, routeFocused, appActive, introDone]);

  // 정체 failsafe — 교전 sim이 실제로 도는 동안, 같은 (웨이브, 위상)에서 10분 무진행 시 패배.
  // store만 combat이고 Canvas/sim이 안 뜬 경우는 아래 orphan 타이머가 담당(벽시계 오판·허브 AFK 중
  // 「전투 없이 10분 후 패배」를 정상 승패로 오인하지 않게 분리).
  // 앱 비활성·허브 비포커스 중에는 타이머를 걸지 않는다(재개 시 10분 재기산).
  useEffect(() => {
    if (!active || !appActive || !routeFocused || !combatSimActive) return;
    const stallTimer = setTimeout(() => {
      const s = useWaveDefenseStore.getState();
      if (!s.active) return;
      s.endRun('lose');
    }, WAVE_DEFENSE_STALL_FAILSAFE_MS);
    return () => clearTimeout(stallTimer);
  }, [active, phase, waveIndex, appActive, routeFocused, combatSimActive]);

  // orphan: phase=combat 인데 capital 교전 sim 미마운트(전투 게이트·세션 비활성 등) → 승패 경로 없음.
  useEffect(() => {
    if (!active || phase !== 'combat' || !appActive || !routeFocused || combatSimActive) return;
    const orphanTimer = setTimeout(() => {
      const s = useWaveDefenseStore.getState();
      if (!s.active || s.phase !== 'combat') return;
      s.endRun('lose');
    }, WAVE_DEFENSE_COMBAT_NEVER_MOUNTED_MS);
    return () => clearTimeout(orphanTimer);
  }, [active, phase, waveIndex, appActive, routeFocused, combatSimActive]);

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
      useWaveDefenseStore.getState().requestEndRun('win');
      return;
    }
    betweenWaveTimerRef.current = setTimeout(() => {
      betweenWaveTimerRef.current = null;
      const s = useWaveDefenseStore.getState();
      if (!s.active) return;
      const next = s.waveIndex + 1;
      s.setWave(next, buildWaveDefenseEnemyFleet(next, planetId));
    }, WAVE_DEFENSE_BETWEEN_WAVE_MS);
    return () => {
      if (betweenWaveTimerRef.current) {
        clearTimeout(betweenWaveTimerRef.current);
        betweenWaveTimerRef.current = null;
      }
    };
  }, [active, phase, waveIndex, planetId]);

  // 전체 종료 예약(최종 웨이브·격파) — 전투 캔버스 유지한 채 짧은 홀드 후 endRun
  useEffect(() => {
    if (!pendingOutcome) return;
    const endHoldTimer = setTimeout(() => {
      const s = useWaveDefenseStore.getState();
      const outcome = s.pendingOutcome;
      if (!outcome) return;
      s.endRun(outcome);
    }, COMBAT_END_HOLD_MS);
    return () => clearTimeout(endHoldTimer);
  }, [pendingOutcome]);

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
      if (betweenWaveTimerRef.current) clearTimeout(betweenWaveTimerRef.current);
    };
  }, []);
}
