import { resolvePlanetTargetEngageSec } from '../../arcCore/balance/balanceTableRegistry';
import { NPC_CAPTAINS_FROM_CSV } from '../../data/generated';
import { NEARBY_PRESENCE_DISPLAY_SEP } from '../../npc';
import { captainMatchesPlanetOrbitTable } from '../../npc/captainOrbitTableMatch';

/** 행성 허브 궤도 worklet·Skia 공통 */
export const NPC_ORBIT_CYCLE_MS = 54000;
export const ORBIT_FLAT_STRIDE = 7;
export const ORBIT_FRAME_DT_MAX_MS = 34;

/** INFO: 행성 중심 거리순 정렬 주기 */
export const INFO_DISTANCE_SORT_INTERVAL_MS = 5000;

export const PLANET_CORE_GAUGE_SPEC = [
  { key: 'resource', label: 'R', color: '#35D0FF' },
  { key: 'population', label: 'P', color: '#6BFF8D' },
  { key: 'defense', label: 'D', color: '#FF6B6B' },
  { key: 'technology', label: 'T', color: '#D37BFF' },
  { key: 'environment', label: 'E', color: '#FFE36B' },
] as const;

export const PLANET_HUB_CAPITAL_COMBAT_DIM_OPACITY = 0.48;
export const PLANET_HUB_CAPITAL_COMBAT_GRAY = {
  zoneText: '#96A0B0',
  zoneBorder: '#7E8896',
  systemName: '#9AA6B6',
  territory: '#98A2B2',
  clanText: '#A4AEBE',
  clanIcon: '#9AA4B4',
  shipMark: '#AAB4C4',
  gaugeLabel: '#8B95A8',
  gaugeOn: '#8F99A8',
  gaugeOffBg: 'rgba(90, 98, 110, 0.2)',
  gaugeOffBorder: 'rgba(110, 118, 130, 0.34)',
  planetRing: '#8E98A8',
} as const;

export const INFO_LOG_LINE_HEIGHT_PX = 16;
export const INFO_LOG_ROW_GAP_PX = 4;
export const INFO_LOG_LINE_BLOCK_PX = INFO_LOG_LINE_HEIGHT_PX + INFO_LOG_ROW_GAP_PX;
export const INFO_LOG_VIEWPORT_ROWS = 4;
export const INFO_LOG_CONTENT_PAD_BOTTOM = 8;
export const INFO_LOG_SCROLL_VIEWPORT_PX =
  INFO_LOG_VIEWPORT_ROWS * INFO_LOG_LINE_BLOCK_PX + INFO_LOG_CONTENT_PAD_BOTTOM;

export const EDEN_COMBAT_HUD_BLOCK_PX = 54;
export const PLANET_MAIN_STANCE_ROW_HEIGHT_EST_PX = 28;

export const PLANET_MAIN_BATTLE_READY_DURATION_FALLBACK_MS = 3000;
export const PLANET_MAIN_BATTLE_READY_TICK_MS = 100;
export const PLANET_MAIN_BATTLE_READY_BLINK_MS = 180;
export const PLANET_MAIN_STANCE_ENGAGEMENT_POLL_MS = 250;
export const PLANET_MAIN_STANCE_UI_DELAY_MS = 3000;
export const PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X = 1.1;
export const PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y = 1.1;
export const PLANET_MAIN_ORBIT_VISUAL_LIFT_PX = 14;

export function resolvePlanetBattleReadyDurationMs(planetId: string | null | undefined): number {
  if (!planetId) return PLANET_MAIN_BATTLE_READY_DURATION_FALLBACK_MS;
  const sec = resolvePlanetTargetEngageSec(planetId);
  return Math.min(10_000, Math.max(1500, sec * 100));
}

export function hasEnemyFleetEnteredPlanetOrbit(planetId: string, systemId: string): boolean {
  return NPC_CAPTAINS_FROM_CSV.some((captain) => {
    if (captain.operationalState !== 'combat') return false;
    if (captain.combatTeam !== 'red' && captain.combatTeam !== 'orange') return false;
    return captainMatchesPlanetOrbitTable(captain, planetId, systemId);
  });
}

export function formatPilotExp8(exp: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(exp) ? exp : 0));
  return String(safe).padStart(8, '0');
}

export function orbitLabelHead3(label: string): string {
  return [...String(label).trim()].slice(0, 3).join('');
}

export function orbitCaptainCaptionFromLine(line: string): string {
  const left = line.split(NEARBY_PRESENCE_DISPLAY_SEP)[0] ?? '';
  const idx = left.indexOf(' · ');
  const raw = idx >= 0 ? left.slice(0, idx).trim() : left.trim();
  return orbitLabelHead3(raw);
}

export function splitStoryTextByMaxLines(text: string, maxLines: number): string[] {
  const normalized = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  const lines = normalized.split('\n').map((line) => line.trimEnd());
  const safeMax = Math.max(1, maxLines | 0);
  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += safeMax) {
    chunks.push(lines.slice(i, i + safeMax).join('\n'));
  }
  return chunks.length > 0 ? chunks : [''];
}

export function splitNearbyInfoLine(line: string): { left: string; right?: string } {
  const parts = line.split(NEARBY_PRESENCE_DISPLAY_SEP);
  if (parts.length >= 2) {
    const head = parts[0];
    if (head != null && head.length > 0) {
      return { left: head, right: parts.slice(1).join(NEARBY_PRESENCE_DISPLAY_SEP) };
    }
  }
  return { left: line };
}

/** 궤도 월드오브젝트 마커 — styles·orbit marks 공용 */
export const MAX_WORLD_OBJECT_MARKS = 16;
export const WORLD_OBJECT_ANCHOR_PX = 11;
export const WORLD_OBJECT_WRECK_MARK_PX = 9;
export const WORLD_OBJECT_WRECK_STROKE_COLOR = '#8B5E3C';
export const WORLD_OBJECT_DEFENSE_SATELLITE_MARK_PX = 9;
export const WORLD_OBJECT_DEFENSE_SATELLITE_COLOR = '#FF8C32';
export const MINING_GUIDE_LINE_RUN_PX = 24;
export const MINING_GUIDE_LABEL_PAST_TIP_PX = 2;
