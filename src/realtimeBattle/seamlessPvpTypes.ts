// ============================================================
// 심리스 PVP(최대 20인) — Firestore 연동 대비 Mock 스키마
// ============================================================

export type SeamlessBattleStatus =
  | 'idle'
  | 'moving'
  | 'planet_landed'
  | 'combat_ready'
  | 'combat'
  | 'offline';

export type SeamlessBattleTeam = 'alpha' | 'beta' | 'none';

export type Vec2 = {
  x: number;
  y: number;
};

export interface FirestoreUserShipStatsMock {
  hull: number;
  shield: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
}

/**
 * /users/{uid} 문서 기반 Mock 형태.
 * 실제 Firestore 연동 시에도 키를 최대한 그대로 유지하도록 설계.
 */
export interface FirestoreUserDocMock {
  uid: string;
  nickname: string;
  status: SeamlessBattleStatus;
  team: SeamlessBattleTeam;
  systemId: string;
  planetId: string | null;
  position: Vec2;
  shipStats: FirestoreUserShipStatsMock;
  updatedAt: number;
}

export interface SeamlessCombatantRuntime {
  uid: string;
  team: Exclude<SeamlessBattleTeam, 'none'>;
  hp: number;
  maxHp: number;
  alive: boolean;
  targetUid: string | null;
  nextTargetScanAtMs: number;
}

export interface SeamlessBattlePerformanceProfile {
  mode: 'normal' | 'low_spec';
  targetScanIntervalMs: number;
  /** 파티클 출력 배율 (0~1). 0.3이면 70% 절감 */
  particleScale: number;
}
