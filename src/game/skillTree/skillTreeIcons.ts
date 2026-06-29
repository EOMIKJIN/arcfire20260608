import type { SkillCategory } from '../../types';
import type { PlanetHubActionIconSpec } from '../../ui/tactical/planetHubActionIcons';

/** 연구소 스킬 노드 — Sci-Fi MDI (허브 메뉴와 동일 family) */
const SKILL_ICONS: Record<string, PlanetHubActionIconSpec> = {
  // combat
  double_shot: { family: 'material-community', name: 'ray-start-end' },
  shield_overload: { family: 'material-community', name: 'shield-half-full' },
  emp_blast: { family: 'material-community', name: 'flash-alert' },
  armor_piercing: { family: 'material-community', name: 'bullseye-arrow' },
  reactive_armor: { family: 'material-community', name: 'shield-refresh' },
  critical_focus: { family: 'material-community', name: 'crosshairs-gps' },
  plasma_cannon: { family: 'material-community', name: 'molecule' },
  fortress_mode: { family: 'material-community', name: 'shield-home-outline' },
  multi_lockon: { family: 'material-community', name: 'target-account' },
  hull_regeneration: { family: 'material-community', name: 'heart-pulse' },
  singularity_cannon: { family: 'material-community', name: 'creation' },
  perfect_defense: { family: 'material-community', name: 'shield-check-outline' },
  // navigation
  jump_boost: { family: 'material-community', name: 'rocket-launch-outline' },
  sensor_array: { family: 'material-community', name: 'radar' },
  counterintel_array: { family: 'material-community', name: 'shield-search' },
  arc_threat_analyzer: { family: 'material-community', name: 'shield-bug-outline' },
  stealth_drive: { family: 'material-community', name: 'eye-off-outline' },
  warp_stabilizer: { family: 'material-community', name: 'compass-rose' },
  ghost_vessel: { family: 'material-community', name: 'ghost-outline' },
  wormhole_finder: { family: 'material-community', name: 'transit-connection-variant' },
  gravity_swing: { family: 'material-community', name: 'orbit' },
  dimensional_blink: { family: 'material-community', name: 'map-marker-distance' },
  orbit_surge: { family: 'material-community', name: 'satellite-variant' },
  star_pathfinder: { family: 'material-community', name: 'map-marker-path' },
  wormhole_generator: { family: 'material-community', name: 'gate' },
  // trade
  market_sense: { family: 'material-community', name: 'chart-line' },
  cargo_stacking: { family: 'material-community', name: 'package-variant-closed' },
  negotiation_pro: { family: 'material-community', name: 'handshake-outline' },
  smuggler_route: { family: 'material-community', name: 'routes' },
  bulk_trading: { family: 'material-community', name: 'scale-balance' },
  tax_exemption: { family: 'material-community', name: 'file-document-outline' },
  black_market_boss: { family: 'material-community', name: 'skull-crossbones' },
  investor_deal: { family: 'material-community', name: 'diamond-stone' },
  monopoly_master: { family: 'material-community', name: 'crown-outline' },
  // fleet
  wingman_recruit: { family: 'material-community', name: 'account-plus-outline' },
  formation_basic: { family: 'material-community', name: 'vector-triangle' },
  wingman: { family: 'material-community', name: 'airplane' },
  repair_drone: { family: 'material-community', name: 'robot-industrial' },
  wingman_synergy: { family: 'material-community', name: 'link-variant' },
  fleet_command: { family: 'material-community', name: 'console' },
  emergency_warp: { family: 'material-community', name: 'alarm-light-outline' },
  tactical_link: { family: 'material-community', name: 'access-point-network' },
  carrier_command: { family: 'material-community', name: 'airport' },
  carrier_protocol: { family: 'material-community', name: 'drone' },
  overlord_presence: { family: 'material-community', name: 'crown-circle-outline' },
};

const CATEGORY_FALLBACK: Record<SkillCategory, PlanetHubActionIconSpec> = {
  combat: { family: 'material-community', name: 'sword-cross' },
  navigation: { family: 'material-community', name: 'rocket-launch-outline' },
  trade: { family: 'material-community', name: 'cube-scan' },
  fleet: { family: 'material-community', name: 'space-station' },
};

export function resolveSkillTreeIconSpec(
  skillId: string,
  category: SkillCategory,
): PlanetHubActionIconSpec {
  return SKILL_ICONS[skillId] ?? CATEGORY_FALLBACK[category];
}
