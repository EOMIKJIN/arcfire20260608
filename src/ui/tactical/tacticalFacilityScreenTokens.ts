/**
 * 행성 시설 서브스테이지 — 행성정보·행성개발 오버레이(TACTICAL_OVERLAY)와 동일 팔레트
 *
 * 카드 색 3단 (정본: planetDevelopmentOverlayStyles.listItemTactical · PlanetEconomyInfoOverlayContent)
 * 1) bodyBg / cardBg  #DDE1E8 — 스크롤 본문·infoPanel·stackCard·제원 행(ArcOverlayInfoRow)
 * 2) cardBorder       #B8BEC9 — 패널·목록 카드 테두리
 * 3) insetBg          #D0D5DE — 카드 **내부** 슬롯·썸네일·pgpBanner·강화 그룹 (스크롤 직속 insetBox 금지)
 */
import { COLORS } from '../../utils/theme';
import { TACTICAL_OVERLAY } from '../overlay/tacticalOverlayStyles';

export const TACTICAL_FACILITY = {
  screenBg: COLORS.bg_primary,
  headerBg: TACTICAL_OVERLAY.headerBg,
  headerBorder: TACTICAL_OVERLAY.headerBorder,
  headerTitleInk: '#FFFFFF',
  headerSubtitleInk: 'rgba(255, 255, 255, 0.72)',
  headerBackInk: 'rgba(255, 255, 255, 0.88)',
  bodyBg: TACTICAL_OVERLAY.cardBg,
  bodyBorder: TACTICAL_OVERLAY.cardBorder,
  cardBg: TACTICAL_OVERLAY.cardBg,
  cardBorder: TACTICAL_OVERLAY.cardBorder,
  insetBg: TACTICAL_OVERLAY.insetBg,
  insetBorder: TACTICAL_OVERLAY.insetBorder,
  panelBg: TACTICAL_OVERLAY.insetBg,
  panelBorder: TACTICAL_OVERLAY.insetBorder,
  titleInk: TACTICAL_OVERLAY.valueInk,
  bodyInk: TACTICAL_OVERLAY.bodyInk,
  labelInk: TACTICAL_OVERLAY.labelInk,
  midInk: TACTICAL_OVERLAY.labelInk,
  mutedInk: TACTICAL_OVERLAY.labelInk,
  goldInk: '#6B5A2E',
  accentInk: TACTICAL_OVERLAY.sectionBarInk,
  slotInk: TACTICAL_OVERLAY.labelInk,
  equipSlotBg: TACTICAL_OVERLAY.insetBg,
  equipSlotBorder: TACTICAL_OVERLAY.insetBorder,
  divider: TACTICAL_OVERLAY.rowDivider,
  safeInk: '#2D6A3E',
  danger: COLORS.danger,
  info: TACTICAL_OVERLAY.labelInk,
  tabBarBg: TACTICAL_OVERLAY.insetBg,
  tabBarBorder: TACTICAL_OVERLAY.rowDivider,
  tabActiveBg: TACTICAL_OVERLAY.headerBg,
  tabActiveBorder: TACTICAL_OVERLAY.headerBg,
  tabInk: TACTICAL_OVERLAY.labelInk,
  tabActiveInk: '#FFFFFF',
  sectionBarBg: TACTICAL_OVERLAY.sectionBarBg,
  sectionBarInk: TACTICAL_OVERLAY.sectionBarInk,
  rootBg: COLORS.bg_primary,
  skillBadgeBg: TACTICAL_OVERLAY.insetBg,
  skillBadgeBorder: TACTICAL_OVERLAY.insetBorder,
  skillInk: TACTICAL_OVERLAY.sectionBarInk,
  ctaBg: TACTICAL_OVERLAY.btnPrimaryBg,
  ctaInk: TACTICAL_OVERLAY.btnPrimaryInk,
  inputBg: TACTICAL_OVERLAY.insetBg,
  secondaryBg: TACTICAL_OVERLAY.insetBg,
  secondaryBorder: TACTICAL_OVERLAY.insetBorder,
} as const;
