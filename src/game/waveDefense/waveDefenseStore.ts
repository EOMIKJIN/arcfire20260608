// ============================================================
// 웨이브 디펜스 런타임 스토어 — 전투 sim에 커스텀 웨이브 함대를 주입하는 단일 정본.
// 기본값 비활성(active=false, override=null) → 어떤 전투 경로도 영향 없음(inert).
// Stage 3 상태기계가 startRun/setWave/setPhase/endRun 로 구동한다.
// ============================================================

import { create } from 'zustand';
import type { CombatFleetSeedSlot } from '../../combat/capitalRealtimeCombatGate';
import { waveDefenseWaveExpReward } from './waveDefenseFleet';

export type WaveDefensePhase =
  | 'idle'        // 미진입
  | 'countdown'   // 전투 Ready 타이머(웨이브 시작 대기)
  | 'combat'      // 교전 중
  | 'cleared'     // 현재 웨이브 전멸(다음 웨이브 재장전 대기)
  | 'ended';      // 전체 종료(플레이어 격파 또는 최종 웨이브)

/** 전체 종료 결과 — 최종 결과창(승리/패배)에 사용 */
export type WaveDefenseOutcome = 'win' | 'lose';

type WaveDefenseState = {
  active: boolean;
  planetId: string | null;
  systemId: string | null;
  /** 1-based 현재 웨이브 번호 (0 = 미시작) */
  waveIndex: number;
  phase: WaveDefensePhase;
  /** 현재 웨이브에 주입할 함대 시드(없으면 null → 기존 CSV 경로) */
  fleetSeedOverride: CombatFleetSeedSlot[] | null;
  /** 증가 시 전투 sim이 같은 세션 내에서 함대를 재시드(웨이브 전환 · Canvas 리마운트 없음) */
  waveGenKey: number;
  /** 전체 종료 결과(승리/패배) — endRun 시 확정, 최종 결과창에서 소비 */
  outcome: WaveDefenseOutcome | null;
  /** 클리어한 웨이브 누적 보상 경험치(최종 결과창 표기 + addExp 지급) */
  expEarned: number;
  /** 클리어 완료한 웨이브 수(최종 결과창 진행도 표기) */
  wavesCleared: number;

  startRun: (planetId: string, systemId: string | null) => void;
  setWave: (waveIndex: number, fleet: CombatFleetSeedSlot[]) => void;
  setPhase: (phase: WaveDefensePhase) => void;
  /** 웨이브 N 클리어 1회 기록 — 보상 경험치 누적 + 클리어 수 갱신 */
  recordWaveCleared: (waveIndex: number) => void;
  endRun: (outcome: WaveDefenseOutcome) => void;
  reset: () => void;
};

const INITIAL = {
  active: false,
  planetId: null as string | null,
  systemId: null as string | null,
  waveIndex: 0,
  phase: 'idle' as WaveDefensePhase,
  fleetSeedOverride: null as CombatFleetSeedSlot[] | null,
  waveGenKey: 0,
  outcome: null as WaveDefenseOutcome | null,
  expEarned: 0,
  wavesCleared: 0,
};

export const useWaveDefenseStore = create<WaveDefenseState>((set) => ({
  ...INITIAL,
  startRun: (planetId, systemId) =>
    set({
      active: true,
      planetId,
      systemId,
      waveIndex: 0,
      phase: 'countdown',
      fleetSeedOverride: null,
      outcome: null,
      expEarned: 0,
      wavesCleared: 0,
    }),
  setWave: (waveIndex, fleet) =>
    set((s) => ({ waveIndex, fleetSeedOverride: fleet, phase: 'combat', waveGenKey: s.waveGenKey + 1 })),
  setPhase: (phase) => set({ phase }),
  recordWaveCleared: (waveIndex) =>
    set((s) => ({
      expEarned: s.expEarned + waveDefenseWaveExpReward(waveIndex),
      wavesCleared: Math.max(s.wavesCleared, Math.max(0, Math.floor(waveIndex))),
    })),
  endRun: (outcome) => set({ active: false, phase: 'ended', fleetSeedOverride: null, outcome }),
  reset: () => set({ ...INITIAL }),
}));

/**
 * 전투 sim 함대 시드 주입점에서 호출하는 비반응(non-reactive) 조회.
 * 웨이브 모드가 활성이고 해당 행성일 때만 override 반환, 그 외 null(=기존 경로 유지).
 */
export function getWaveFleetSeedOverride(planetId: string): CombatFleetSeedSlot[] | null {
  const s = useWaveDefenseStore.getState();
  if (!s.active || s.planetId !== planetId) return null;
  return s.fleetSeedOverride && s.fleetSeedOverride.length > 0 ? s.fleetSeedOverride : null;
}
