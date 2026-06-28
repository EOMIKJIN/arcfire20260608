// ============================================================
// 아크코어 — NPC 함장 세계 출현(Presence) 통합 계약
// CSV id 정본 · 함장당 primary 1곳 · 역할/이벤트만 분기
// ============================================================

/** 함장의 현재 primary 활동 (이동·등장 이벤트는 kind별 정책) */
export type CaptainPresenceActivity =
  | 'off_world'
  | 'orbit_arc_transport'
  | 'orbit_table_patrol'
  | 'governor_post'
  | 'combat_orbit_posture'
  | 'tavern_host'
  | 'mission_combat_anchor'
  | 'transit_encounter';

export type CaptainPrimaryPresence = {
  captainId: string;
  activity: CaptainPresenceActivity;
  planetId: string | null;
  systemId: string | null;
  shipId: string | null;
};

export type CaptainPresenceWorldIndex = {
  epochBucket: number;
  byCaptainId: ReadonlyMap<string, CaptainPrimaryPresence>;
  /** planetId → 해당 행성 primary 체류/순찰 함장 id (허브 궤도·상호작용) */
  hubOrbitCaptainIdsByPlanet: ReadonlyMap<string, readonly string[]>;
};

/** 팩션 기반 NPC↔NPC 상호작용 힌트 */
export type CaptainFactionStance = 'allied' | 'friendly' | 'neutral' | 'rival' | 'hostile';

export type CaptainCoPresencePair = {
  captainIdA: string;
  captainIdB: string;
  stance: CaptainFactionStance;
  planetId: string;
};
