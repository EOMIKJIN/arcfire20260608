import { ZoneType } from '../types';

export const COLORS = {
  bg_primary: '#060A14',
  bg_secondary: '#0D1322',
  bg_panel: '#131B2E',
  bg_input: '#10192B',
  border: '#243149',
  border_dark: '#3E567A',
  divider: '#1A253B',
  ink_dark: '#E6EEFF',
  ink_mid: '#A8B9D9',
  ink_light: '#7F93B8',
  ink_faint: '#526483',
  hp: '#D35B6A',
  shield: '#5B9BFF',
  exp: '#3DBF7A',
  skill: '#9F7BFF',
  gold: '#E5C96B',
  danger: '#E36B6B',
  safe_zone: '#3DBF7A',
  pvp_zone: '#E36B6B',
  info: '#75AEFF',
};

export const ZONE_COLORS: Record<ZoneType, string> = {
  safe: '#5EA2FF',
  neutral: '#9AA8C4',
  pvp: '#E06F7E',
  endgame: '#AA88FF',
};

export const ZONE_LABELS: Record<ZoneType, string> = {
  safe: '안전 구역',
  neutral: '중립 구역',
  pvp: 'PvP 구역',
  endgame: '심층 구역',
};

export const FONTS = {
  mono: 'monospace',
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    title: 28,
  },
  weight: { bold: '700' as const },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const LAYOUT = {
  hud_height: 56,
  map_node_radius: 8,
  map_node_radius_start: 11,
  map_line_color: '#2D3F5E',
  map_line_width: 1,
};

/** 전역 오버레이·모달 UI 토큰 — ArcOverlayHost / ArcButton 단일 소스 */
export const OVERLAY_TOKENS = {
  phosphorAccent: '#6BD4FF',
  phosphorBorder: 'rgba(107, 212, 255, 0.35)',
  phosphorCardBg: 'rgba(107, 212, 255, 0.08)',
  phosphorBtnBg: 'rgba(107, 212, 255, 0.1)',
  cardMaxWidth: 300,
  narrativeMaxWidth: 440,
} as const;
