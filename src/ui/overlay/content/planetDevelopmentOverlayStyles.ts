import { StyleSheet } from 'react-native';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { TACTICAL_OVERLAY } from '../tacticalOverlayStyles';
import {
  PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX,
  PLANET_INFO_DESCRIPTION_LINE_HEIGHT_PX,
  OVERLAY_PANEL_LIST_ITEM_GAP_PX,
} from '../overlayPanelLayout';

export const planetDevelopmentOverlayStyles = StyleSheet.create({
  hint: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    opacity: 0.8,
  },
  /** 목록 상단 — bodyPanel paddingTop 과 중복 제거 */
  hintListLead: {
    marginTop: 0,
  },
  section: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingVertical: 3,
  },
  rowLabel: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: 'rgba(107, 212, 255, 0.62)',
  },
  rowValue: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    textAlign: 'right',
    color: OVERLAY_TOKENS.valueContentColor,
  },
  listItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: OVERLAY_PANEL_LIST_ITEM_GAP_PX,
  },
  /** 항목 카드 외곽 — 구분선 뚜렷 (본문 텍스트 박스와 별도) */
  listItemTactical: {
    borderWidth: 1,
    borderColor: TACTICAL_OVERLAY.cardBorder,
    borderRadius: 6,
    backgroundColor: TACTICAL_OVERLAY.cardBg,
  },
  listItemPhosphor: {
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  listItemPressed: {
    opacity: 0.85,
  },
  listItemDisabled: {
    opacity: 0.72,
  },
  listItemTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  listItemTitleDisabled: {
    opacity: 0.85,
  },
  listItemMeta: {
    marginTop: 4,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    opacity: 0.9,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: SPACING.md,
  },
  listItemImageSlot: {
    width: 72,
    height: 72,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listItemImageSlotTactical: {
    borderColor: TACTICAL_OVERLAY.cardBorder,
    backgroundColor: TACTICAL_OVERLAY.insetBg,
  },
  listItemImageSlotPhosphor: {
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    backgroundColor: 'rgba(8, 18, 32, 0.55)',
  },
  listItemImagePlaceholder: {
    fontSize: 28,
    opacity: 0.88,
  },
  listItemBody: {
    flex: 1,
    minWidth: 0,
  },
  listItemSummary: {
    marginTop: SPACING.sm,
    minHeight: PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX - SPACING.sm,
    maxHeight: PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX - SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: PLANET_INFO_DESCRIPTION_LINE_HEIGHT_PX,
    opacity: 0.88,
  },
  listItemComingSoonBadge: {
    opacity: 0.72,
  },
  listItemStatusComplete: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    opacity: 0.95,
  },
  listItemProgressLabel: {
    marginBottom: 4,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    opacity: 0.92,
  },
  levelRow: {
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(110,128,160,0.35)',
  },
  levelRowActive: {
    backgroundColor: 'rgba(53,208,255,0.08)',
  },
  levelRowActiveTactical: {
    backgroundColor: TACTICAL_OVERLAY.insetBg,
  },
  levelRowTactical: {
    borderBottomColor: TACTICAL_OVERLAY.rowDivider,
  },
  levelRowTitleTactical: {
    color: TACTICAL_OVERLAY.valueInk,
  },
  levelRowMetaTactical: {
    color: TACTICAL_OVERLAY.labelInk,
    opacity: 1,
  },
  hintTactical: {
    color: TACTICAL_OVERLAY.labelInk,
    opacity: 0.9,
  },
  levelRowTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
  },
  levelRowMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: OVERLAY_TOKENS.valueContentColor,
    opacity: 0.92,
  },
  gaugeBlock: {
    marginVertical: SPACING.sm,
  },
  btnRow: {
    flexShrink: 0,
    marginTop: SPACING.md,
  },
  btnCol: {
    flexShrink: 0,
    rowGap: SPACING.sm,
  },
  footerStack: {
    alignSelf: 'stretch',
    rowGap: SPACING.md,
  },
});
