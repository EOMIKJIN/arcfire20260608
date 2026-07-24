/**
 * 계정 purge·복구 대상 AsyncStorage 키 — 플레이어 인터랙티브 진행만.
 * ArcCore 환경·faction vault·trade fee ledger 등 월드 축은 제외(v4.0 · localAccountReset).
 */
export const PLAYER_GAME_SAVE_BACKUP_KEYS: readonly string[] = [
  'arcfire_player_v1',
  'arcfire_world_v1',
  'arcfire_missions_v1',
  'arcfire_arc_core_instance_missions_v1',
  'arcfire_npc_captain_progress_v1',
  'arcfire_planet_core_runtime_v1',
  'arcfire_planet_mineral_ledger_v1',
  'arcfire_world_object_runtime_v1',
  'arcfire_combat_match_telemetry_v1',
  'arcfire_user_session_v1',
  'arcfire_tavern_board_v1',
  'arcfire_bm_exchange_ledger_v1',
  'arcfire_clan_war_foundation_v2',
  'arcfire_item_ledger_v1',
  'arcfire_skill_db_v1',
  'arcfire_account_profile_v1',
  'arcfire_arc_core_spy_expelled_v1',
  'arcfire_arc_core_pantheon_codex_v1',
  'arcfire_planet_nebula_profiles_v1',
  'arcfire_mining_resume_v1',
] as const;

export const PLAYER_GAME_SAVE_BACKUP_KEY_SET = new Set<string>(PLAYER_GAME_SAVE_BACKUP_KEYS);
