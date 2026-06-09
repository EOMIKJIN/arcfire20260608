import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ArcOverlayTradeQuantityEntry } from '../arcOverlayStore';
import { formatCredits } from '../../../utils/formatCredits';
import { COLORS, FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';

type Props = {
  entry: ArcOverlayTradeQuantityEntry;
  onConfirm: (qty: number) => void;
  onCancel: () => void;
};

export const TradeQuantityOverlayContent = memo(function TradeQuantityOverlayContent({
  entry,
  onConfirm,
  onCancel,
}: Props) {
  const minQty = entry.minQty ?? 1;
  const [qty, setQty] = useState(() => Math.min(entry.maxQty, Math.max(minQty, entry.initialQty ?? 1)));

  const totalPrice = entry.unitPrice * qty;
  const canDec = qty > minQty;
  const canInc = qty < entry.maxQty;

  const topTip = useMemo(() => {
    const tips = entry.tips ?? [];
    return tips.length > 0 ? tips[0]! : null;
  }, [entry.tips]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{entry.title}</Text>

      <Text style={styles.line}>단가: {formatCredits(entry.unitPrice)}</Text>
      {entry.stock != null ? (
        <Text style={styles.line}>재고: {entry.stock}개</Text>
      ) : null}
      {entry.demandLabel ? (
        <Text style={styles.line}>수요: {entry.demandLabel}</Text>
      ) : null}
      {entry.ownedQty != null ? (
        <Text style={styles.line}>보유: {entry.ownedQty}개</Text>
      ) : null}

      {entry.mode === 'buy' ? (
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>Tips</Text>
          {topTip ? (
            <Text style={styles.tipLine}>
              {`${topTip.planetName}에서 ${formatCredits(topTip.profitPerUnit)}/개 차익으로 판매 가능`}
            </Text>
          ) : (
            <Text style={styles.tipEmpty}>현재 행성 기준 확인 가능한 차익 행성이 없습니다.</Text>
          )}
        </View>
      ) : null}

      <View style={styles.qtyRow}>
        <TouchableOpacity
          style={[styles.qtyBtn, !canDec && styles.qtyBtnDisabled]}
          onPress={() => canDec && setQty((q) => Math.max(minQty, q - 1))}
          disabled={!canDec}
          accessibilityLabel="수량 감소"
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{qty}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, !canInc && styles.qtyBtnDisabled]}
          onPress={() => canInc && setQty((q) => Math.min(entry.maxQty, q + 1))}
          disabled={!canInc}
          accessibilityLabel="수량 증가"
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.totalLine}>합계: {formatCredits(totalPrice)}</Text>
      <Text style={styles.maxHint}>최대 {entry.maxQty}개</Text>

      <View style={styles.btnRow}>
        <ArcButton label="취소" variant="secondary" onPress={onCancel} />
        <ArcButton
          label={entry.mode === 'buy' ? `${qty}개 구매` : `${qty}개 판매`}
          variant="primary"
          onPress={() => onConfirm(qty)}
        />
      </View>
    </View>
  );
});

const PH = OVERLAY_TOKENS.phosphorAccent;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.cardMaxWidth,
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 6,
    padding: SPACING.xl,
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: PH,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  line: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: PH,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 212, 255, 0.08)',
  },
  qtyBtnDisabled: {
    opacity: 0.35,
  },
  qtyBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 24,
    fontWeight: FONTS.weight.bold,
    color: PH,
    lineHeight: 28,
  },
  qtyValue: {
    minWidth: 48,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: PH,
    textAlign: 'center',
  },
  totalLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.exp,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  maxHint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  tipsBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(107, 212, 255, 0.25)',
    borderRadius: 4,
    backgroundColor: 'rgba(6, 14, 28, 0.45)',
  },
  tipsTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.exp,
    marginBottom: SPACING.sm,
  },
  tipLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: PH,
    lineHeight: 18,
  },
  tipEmpty: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
});
