/** compact 오버레이 본문 — phosphorOverlay 와 동일 키, tactical 잉크 */
import { StyleSheet } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_OVERLAY } from './tacticalOverlayStyles';

export const tacticalOverlayCompactStyles = StyleSheet.create({
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: TACTICAL_OVERLAY.rowDivider,
    marginVertical: SPACING.md,
  },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TACTICAL_OVERLAY.labelInk,
    marginBottom: SPACING.sm,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    width: '100%',
  },
  rowIcon: { fontSize: 16, marginRight: SPACING.sm },
  rowText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: TACTICAL_OVERLAY.valueInk,
  },
  rowMuted: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: TACTICAL_OVERLAY.labelInk,
    fontStyle: 'italic',
  },
  closeBtn: {
    marginTop: SPACING.lg,
    alignSelf: 'flex-end',
  },
  btnRowAckOnly: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'stretch',
    flexShrink: 0,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  btnRowCancelConfirm: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'stretch',
    flexShrink: 0,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  insetBox: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: TACTICAL_OVERLAY.insetBorder,
    borderRadius: 4,
    backgroundColor: TACTICAL_OVERLAY.insetBg,
    padding: SPACING.sm,
    width: '100%',
    alignItems: 'center',
  },
  levelUpText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: TACTICAL_OVERLAY.valueInk,
  },
});
