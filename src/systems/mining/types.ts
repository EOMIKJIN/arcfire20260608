export type MiningSystemStatus = 'idle' | 'running' | 'paused' | 'disabled';

export interface MiningSessionState {
  planetId: string | null;
  miningGoodId: string | null;
  status: MiningSystemStatus;
  startedAtMs: number | null;
  lastTickAtMs: number | null;
  /** 이번 자동 채굴 세션에서 인벤으로 넣은 광물 단위 합 — 상한 도달 시 초기화 */
  orbitSessionOreTotal: number;
}

export interface MiningTickResult {
  grantedItems: Array<{ goodId: string; quantity: number }>;
  nextState: MiningSessionState;
}
