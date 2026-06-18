import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ArcOverlayTradeQuantityEntry } from '../arcOverlayStore';
import { formatCredits } from '../../../utils/formatCredits';
import { useT } from '../../../i18n';
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
  const t = useT();
  const minQty = entry.minQty ?? 1;
  const [qty, setQty] = useState(() => Math.min(entry.maxQty, Math.max(minQty, entry.initialQty ?? 1)));

  const totalPrice = entry.unitPrice * qty;
  const playerCredits = entry.playerCredits;
  const remainingCredits =
    entry.mode === 'buy' && playerCredits != null ? playerCredits - totalPrice : null;
  const canDec = qty > minQty;
  const canInc = qty < entry.maxQty;
  const canMax = qty < entry.maxQty;

  const setMaxQty = () => {
    if (entry.maxQty >= minQty) setQty(entry.maxQty);
  };

  const topTip = useMemo(() => {
    const tips = entry.tips ?? [];
    return tips.length > 0 ? tips[0]! : null;
  }, [entry.tips]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{entry.title}</Text>

      <Text style={styles.line}>{t('tradeQty.unit', { price: formatCredits(entry.unitPrice) })}</Text>
      {entry.stock != null ? (
        <Text style={styles.line}>{t('tradeQty.stock', { n: entry.stock })}</Text>
      ) : null}
      {entry.demandLabel ? (
        <Text style={styles.line}>{t('tradeQty.demand', { label: entry.demandLabel })}</Text>
      ) : null}
      {entry.ownedQty != null ? (
        <Text style={styles.line}>{t('tradeQty.owned', { n: entry.ownedQty })}</Text>
      ) : null}

      {entry.mode === 'buy' && entry.itemDescription ? (
        <View style={styles.descBox}>
          <Text style={styles.descText} numberOfLines={3} ellipsizeMode="tail">
            {entry.itemDescription}
          </Text>
        </View>
      ) : null}

      {entry.mode === 'buy' ? (
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>{t('tradeQty.tipsTitle')}</Text>
          {topTip ? (
            <Text style={styles.tipLine}>
              {t('tradeQty.tipLine', { planet: topTip.planetName, profit: formatCredits(topTip.profitPerUnit) })}
            </Text>
          ) : (
            <Text style={styles.tipEmpty}>{t('tradeQty.tipEmpty')}</Text>
          )}
        </View>
      ) : null}

      <View style={styles.qtyRow}>
        <TouchableOpacity
          style={[styles.qtyBtn, !canDec && styles.qtyBtnDisabled]}
          onPress={() => canDec && setQty((q) => Math.max(minQty, q - 1))}
          disabled={!canDec}
          accessibilityLabel={t('tradeQty.a11yDec')}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{qty}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, !canInc && styles.qtyBtnDisabled]}
          onPress={() => canInc && setQty((q) => Math.min(entry.maxQty, q + 1))}
          disabled={!canInc}
          accessibilityLabel={t('tradeQty.a11yInc')}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.maxBtn, !canMax && styles.qtyBtnDisabled]}
          onPress={() => canMax && setMaxQty()}
          disabled={!canMax}
          accessibilityLabel={t('tradeQty.a11yMax')}
        >
          <Text style={styles.maxBtnText}>MAX</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.totalLine}>
        {t('tradeQty.total', { price: formatCredits(totalPrice) })}
        {remainingCredits != null ? (
          <Text
            style={[
              styles.totalCreditsSuffix,
              remainingCredits < 0 ? styles.totalCreditsOver : styles.totalCreditsOk,
            ]}
          >
            {t('tradeQty.remaining', { credits: formatCredits(remainingCredits, { suffix: false }) })}
          </Text>
        ) : null}
      </Text>
      <Text style={styles.maxHint}>{t('tradeQty.maxHint', { n: entry.maxQty })}</Text>

      <View style={styles.btnRow}>
        <ArcButton label={t('tradeQty.cancel')} variant="secondary" onPress={onCancel} />
        <ArcButton
          label={entry.mode === 'buy' ? t('tradeQty.buy', { qty }) : t('tradeQty.sell', { qty })}
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
  descBox: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(107, 212, 255, 0.2)',
    borderRadius: 4,
    backgroundColor: OVERLAY_TOKENS.phosphorCardInsetBg,
  },
  descText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: PH,
    lineHeight: 18,
    textAlign: 'center',
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
    backgroundColor: OVERLAY_TOKENS.phosphorBtnBg,
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
  maxBtn: {
    minWidth: 52,
    height: 44,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OVERLAY_TOKENS.phosphorBtnBgEmphasis,
  },
  maxBtnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: PH,
    letterSpacing: 0.5,
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
  totalCreditsSuffix: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  totalCreditsOk: {
    color: PH,
  },
  totalCreditsOver: {
    color: COLORS.danger,
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
    backgroundColor: OVERLAY_TOKENS.phosphorCardInsetBg,
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
