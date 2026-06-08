// ============================================================
// 실시간 전투 — SoA(Structure of Arrays) 버퍼
// - JS 힙 할당을 시작 시 1회로 고정 → 런타임 GC 압력 감소
// - 향후 worklet/네이티브로 복사 시 연속 메모리에 적합
// ============================================================

import { BATTLE_MAX_ENTITIES } from './battleConstants';

export type BattleArenaBuffers = {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  heading: Float32Array;
  halfExtent: Float32Array;
  /** BattlePackedRgb 를 uint32 로 저장 */
  color: Uint32Array;
  /** 0/1 */
  active: Uint8Array;
  team: Uint8Array;
};

export function createBattleArenaBuffers(): BattleArenaBuffers {
  const n = BATTLE_MAX_ENTITIES;
  return {
    x: new Float32Array(n),
    y: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    heading: new Float32Array(n),
    halfExtent: new Float32Array(n),
    color: new Uint32Array(n),
    active: new Uint8Array(n),
    team: new Uint8Array(n),
  };
}

/** 슬롯 비활성화만 (메모리 해제 없음) */
export function clearBattleArenaActive(buf: BattleArenaBuffers): void {
  buf.active.fill(0);
}
