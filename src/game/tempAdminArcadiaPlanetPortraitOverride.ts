// ============================================================
// 임시 테스트 — 플레이어층 전용. 아크코어 시뮬·명령·런타임 DB 미변경.
// 시작 행성(아르카디아 프라임) 초상만 옐로 기운 → 청명한 블루그린 톤으로 보정.
// 비활성: 아래 플래그 false 후 `PlanetCorePortraitWithTempAdminOverride` 제거 가능.
// ============================================================

import type { DerivedPlanetPortrait } from '../arcCore/planetCorePortrait/corePortraitDerive';
import { STARTING_PLANET_ID } from '../data/systems';

/** 임시 관리자 시각 테스트 — 끄면 아르카디아도 기본 초상 톤으로 복귀 */
export const TEMP_ADMIN_ARCADIA_BLUEGREEN_PORTRAIT = true;

/** 청명한 시안–틸 (블루그린) */
const TEAL_CORE = { r: 38, g: 168, b: 182 };
const TEAL_HIGHLIGHT = { r: 118, g: 228, b: 236 };

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(n => Number.isNaN(n))) return null;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function blendRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
): { r: number; g: number; b: number } {
  const k = Math.max(0, Math.min(1, t));
  return {
    r: a.r * (1 - k) + b.r * k,
    g: a.g * (1 - k) + b.g * k,
    b: a.b * (1 - k) + b.b * k,
  };
}

function tintHex(hex: string, target: { r: number; g: number; b: number }, strength: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const o = blendRgb(rgb, target, strength);
  return rgbToHex(o.r, o.g, o.b);
}

/** 환경(E) 스포크 옐로 등 — 청록 스포크로 */
const SPOKE_YELLOW_REPLACEMENT = '#6FD4E8';

function respokeStroke(stroke: string): string {
  const rgb = hexToRgb(stroke);
  if (!rgb) return stroke;
  const { r, g, b } = rgb;
  const yellowish = r > 175 && g > 160 && b < 145;
  if (yellowish || stroke.toUpperCase() === '#FFE36B') return SPOKE_YELLOW_REPLACEMENT;
  return stroke;
}

/**
 * `derivePlanetPortrait` 결과만 보정 (아크코어 파생 로직·저장값 불변).
 * `combatMuted` 시 회색 전투 톤은 그대로 둔다.
 */
export function applyTempAdminArcadiaPortraitTint(
  planetId: string,
  derived: DerivedPlanetPortrait,
  opts: { combatMuted?: boolean },
): DerivedPlanetPortrait {
  if (!TEMP_ADMIN_ARCADIA_BLUEGREEN_PORTRAIT) return derived;
  if (opts.combatMuted) return derived;
  if (planetId !== STARTING_PLANET_ID) return derived;

  const baseFill = tintHex(derived.baseFill, TEAL_CORE, 0.56);
  const highlight = tintHex(derived.highlight, TEAL_HIGHLIGHT, 0.5);
  const innerCore = tintHex(derived.innerCore, TEAL_CORE, 0.52);
  const spokes = derived.spokes.map(s => ({
    ...s,
    stroke: respokeStroke(s.stroke),
  }));

  return {
    ...derived,
    baseFill,
    highlight,
    innerCore,
    spokes,
  };
}
