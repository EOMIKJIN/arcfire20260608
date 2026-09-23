/**
 * 연구소 스킬 런타임 완성도 — UI 배지 정본.
 * 효과 연동을 추가하면 여기만 갱신한다.
 */
export type SkillRuntimeStatus = 'complete' | 'partial' | 'undeveloped';

const COMPLETE_IDS: ReadonlySet<string> = new Set([
  'counterintel_array',
  'arc_threat_analyzer',
  'warp_stabilizer',
  'orbit_surge',
  'negotiation_pro',
  'tax_exemption',
  'armor_piercing',
  'reactive_armor',
  'double_shot',
  'shield_overload',
  'emp_blast',
  'critical_focus',
  'plasma_cannon',
  'fortress_mode',
  'multi_lockon',
  'hull_regeneration',
  'singularity_cannon',
  'perfect_defense',
  'jump_boost',
  'sensor_array',
  'stealth_drive',
  'ghost_vessel',
  'wormhole_finder',
  'gravity_swing',
  'dimensional_blink',
  'star_pathfinder',
  'market_sense',
  'cargo_stacking',
  'smuggler_route',
  'bulk_trading',
  'black_market_boss',
  'investor_deal',
  'monopoly_master',
  'wingman_recruit',
  'formation_basic',
  'wingman',
  'repair_drone',
  'wingman_synergy',
  'fleet_command',
  'emergency_warp',
  'tactical_link',
  'carrier_command',
  'carrier_protocol',
  'overlord_presence',
]);

const PARTIAL_NOTE_KEY: Readonly<Record<string, string>> = {
  wormhole_generator: 'skilltree.runtimePartialNote.wormhole_generator',
};

export function resolveSkillRuntimeStatus(skillId: string): SkillRuntimeStatus {
  const id = String(skillId ?? '').trim();
  if (COMPLETE_IDS.has(id)) return 'complete';
  if (PARTIAL_NOTE_KEY[id]) return 'partial';
  return 'undeveloped';
}

export function resolveSkillRuntimePartialNoteKey(skillId: string): string | null {
  return PARTIAL_NOTE_KEY[String(skillId ?? '').trim()] ?? null;
}

export function isSkillRuntimeReady(skillId: string): boolean {
  return resolveSkillRuntimeStatus(skillId) === 'complete';
}
