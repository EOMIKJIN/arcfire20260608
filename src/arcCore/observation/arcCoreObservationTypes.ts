// ============================================================
// ArcCore Observation Bus — 이벤트 envelope (v1 · 경제 축 우선)
// @see docs/ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md §4
// ============================================================

export type ArcCoreObservationKind =
  | 'economy.trade_player'
  | 'economy.convoy_settlement'
  | 'economy.attack_signal'
  | 'economy.fabric_daily'
  | 'combat.match_summary'
  | 'combat.tactics_trial'
  | 'territorial.pass_result'
  | 'npc.traffic_snapshot'
  | 'scenario.step'
  | 'scenario.verdict'
  | 'daily_ops.batch_complete'
  | 'policy.ingest_applied';

export type ArcCoreObservationEvent = {
  schemaVersion: 1;
  eventId: string;
  kind: ArcCoreObservationKind;
  wallTimeMs: number;
  planetId?: string;
  systemId?: string;
  subCoreId: string;
  payload: Record<string, unknown>;
  simTag?: string;
};

/** 서브코어 id 상수 — publish 시 일관 표기 */
export const ARC_CORE_OBS_SUBCORE = {
  economy: 'economy_subcore',
  dailyOps: 'arc_core_daily_ops_subcore',
  npc: 'npc_subcore',
  combat: 'combat_subcore',
} as const;
