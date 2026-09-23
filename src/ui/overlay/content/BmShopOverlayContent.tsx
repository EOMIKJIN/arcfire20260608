// ============================================================
// BM 더미 상점 — v2.0 이중통화
//   premium: IAP 보석팩·VIP·시즌패스·스타터팩
//   exchange: 보석 → 크레딧 단방향 교환
// ============================================================
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ArcOverlayBmShopEntry } from '../arcOverlayStore';
import type { BmShopProduct, BmShopProductVisual } from '../../../bm/bmShopCatalog';
import {
  listBmShopProducts,
  resolveBmShopActionKey,
  resolveBmShopNoticeKey,
  resolveBmShopSubtitleKey,
  resolveBmShopTitleKey,
} from '../../../bm/bmShopCatalog';
import {
  buildBmProductPurchaseExplainBody,
  listBmProductContentLines,
  resolveBmProductOverlapNotes,
} from '../../../bm/bmProductOfferCopy';
import {
  ensureBmExchangeLedgerReady,
  executeGemToCreditExchange,
  mapGemExchangeErrorKey,
} from '../../../bm/gemExchangeService';
import { buildExchangeCapSnapshot } from '../../../bm/gemExchangeModel';
import { getBmPolicyNumber } from '../../../bm/bmCatalogIndex';
import { formatGemBalance, resolvePlayerGemBalance } from '../../../bm/bmWalletDisplay';
import { isPlanetDeedIapProductId } from '../../../bm/planetDeedCashGrantPolicy';
import {
  claimPlanetDeedFromCashGrant,
  ensurePlanetDeedCashGrantReady,
  grantPlanetDeedPurchaseDummy,
  listPlanetDeedCashGrantTargets,
  listPlanetDeedCashGrantTargetsWithCloud,
  readPlanetDeedGrantStatus,
  type PlanetDeedPickerRow,
} from '../../../bm/planetDeedCashGrantService';
import { useBmExchangeLedgerStore } from '../../../store/bmExchangeLedgerStore';
import { usePlanetDeedCashGrantStore } from '../../../store/planetDeedCashGrantStore';
import { useT } from '../../../i18n';
import { usePlayerStore } from '../../../store/playerStore';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { bmShopOverlayStyles as phosphorStyles, bmShopOverlayTacticalStyles } from './bmShopOverlayStyles';

type Props = {
  entry: ArcOverlayBmShopEntry;
  onClose: () => void;
};

function visualIcon(visual: BmShopProductVisual): string {
  switch (visual) {
    case 'gems':
      return '◇';
    case 'seasonPass':
      return '▣';
    case 'vip':
      return '★';
    case 'starterPack':
      return '⬡';
    case 'exchange':
      return '⇄';
    case 'planetDeed':
      return '◎';
    default:
      return '◆';
  }
}

function ProductRow({
  product,
  actionLabel,
  onAction,
  isTactical,
}: {
  product: BmShopProduct;
  actionLabel: string;
  onAction: (product: BmShopProduct) => void;
  isTactical: boolean;
}) {
  const t = useT();
  const styles = isTactical ? bmShopOverlayTacticalStyles : phosphorStyles;
  return (
    <View style={styles.productCard}>
      <View style={[styles.artSlot, !isTactical && { backgroundColor: product.tint }]}>
        <Text style={styles.artIcon}>{visualIcon(product.visual)}</Text>
        <Text style={styles.artPlaceholderLabel}>{t('bmShop.artPlaceholder')}</Text>
      </View>
      <View style={styles.productBody}>
        {product.badgeKey ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t(product.badgeKey)}</Text>
          </View>
        ) : null}
        <Text style={styles.productTitle}>{t(product.titleKey)}</Text>
        <Text style={styles.productDesc}>{t(product.descKey)}</Text>
        {listBmProductContentLines(product.id, t).map((line) => (
          <Text key={line} style={styles.contentLine}>
            {`· ${line}`}
          </Text>
        ))}
        {resolveBmProductOverlapNotes(product.id, t).map((note) => (
          <Text key={note} style={styles.overlapNote}>
            {note}
          </Text>
        ))}
        <View style={styles.productFooter}>
          <Text
            style={[
              styles.priceText,
              product.priceKind === 'gems' && styles.priceTextGem,
            ]}
          >
            {t(product.priceKey)}
          </Text>
          <View style={styles.buyBtnWrap}>
            <ArcButton
              label={actionLabel}
              visualTheme={isTactical ? 'tactical' : 'phosphor'}
              intent="cta"
              onPress={() => onAction(product)}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function resolveDeedActionLabel(
  t: (key: string) => string,
  productId: string,
  defaultLabel: string,
  claimedPlanetId: string | null,
  pendingGrant: boolean,
): string {
  if (!isPlanetDeedIapProductId(productId)) return defaultLabel;
  if (claimedPlanetId) return t('bmShop.deed.owned');
  if (pendingGrant) return t('bmShop.deed.pick');
  return defaultLabel;
}

export const BmShopOverlayContent = memo(function BmShopOverlayContent({
  entry,
  onClose,
}: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('bmShop');
  const isTactical = visualTheme === 'tactical';
  const styles = isTactical ? bmShopOverlayTacticalStyles : phosphorStyles;
  const player = usePlayerStore((s) => s.player);
  const products = listBmShopProducts(entry.shopKind);
  const gemBalance = resolvePlayerGemBalance(player);
  const creditBalance = player?.credits ?? 0;
  const actionLabel = t(resolveBmShopActionKey(entry.shopKind));
  const dailyUsedGems = useBmExchangeLedgerStore((s) => s.dailyGemsExchanged);
  const weeklyUsedGems = useBmExchangeLedgerStore((s) => s.weeklyGemsExchanged);
  const deedClaimedPlanetId = usePlanetDeedCashGrantStore((s) => s.claimedPlanetId);
  const deedPendingGrant = usePlanetDeedCashGrantStore((s) => s.pendingGrant);
  const exchangeCap = buildExchangeCapSnapshot(
    dailyUsedGems,
    weeklyUsedGems,
    getBmPolicyNumber('gem_exchange_weekly_cap_gems', 2000),
  );
  const [deedPickerOpen, setDeedPickerOpen] = useState(false);
  const [pickerRows, setPickerRows] = useState<PlanetDeedPickerRow[]>([]);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [deedClaiming, setDeedClaiming] = useState(false);

  useEffect(() => {
    if (entry.shopKind !== 'exchange') return;
    void ensureBmExchangeLedgerReady();
  }, [entry.shopKind]);

  useEffect(() => {
    if (entry.shopKind !== 'premium') return;
    void ensurePlanetDeedCashGrantReady();
  }, [entry.shopKind]);

  useEffect(() => {
    if (!deedPickerOpen) return;
    setPickerRows(listPlanetDeedCashGrantTargets());
    setSelectedPlanetId(null);
    let cancelled = false;
    void listPlanetDeedCashGrantTargetsWithCloud().then((rows) => {
      if (!cancelled) setPickerRows(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [deedPickerOpen]);

  const openDeedPicker = useCallback(() => {
    setDeedPickerOpen(true);
  }, []);

  const handlePremiumAction = useCallback((product: BmShopProduct) => {
    if (!isPlanetDeedIapProductId(product.id)) {
      showArcAlert(
        t('bmShop.purchase.guideTitle', { name: t(product.titleKey) }),
        buildBmProductPurchaseExplainBody(product.id, t, t('bmShop.comingSoonBody')),
      );
      return;
    }
    const status = readPlanetDeedGrantStatus();
    if (status.claimedPlanetId) {
      showArcAlert(t('bmShop.deed.ownedTitle'), t('bmShop.deed.ownedBody'));
      return;
    }
    if (status.canPickPlanet) {
      openDeedPicker();
      return;
    }
    showArcAlert(
      t('bmShop.deed.confirmTitle'),
      buildBmProductPurchaseExplainBody(product.id, t, t('bmShop.deed.confirmBody')),
      [
      { text: t('bmShop.deed.cancel'), style: 'cancel' },
      {
        text: t('bmShop.deed.confirm'),
        onPress: () => {
          const granted = grantPlanetDeedPurchaseDummy();
          if (!granted.ok) {
            showArcAlert(
              t('bmShop.deed.failTitle'),
              granted.reason === 'already' ? t('bmShop.deed.ownedBody') : t('bmShop.deed.failNoPlayer'),
            );
            return;
          }
          openDeedPicker();
        },
      },
    ]);
  }, [openDeedPicker, t]);

  const handleExchangeAction = useCallback(
    async (product: BmShopProduct) => {
      const result = await executeGemToCreditExchange(product.id);
      if (result.ok) {
        showArcAlert(
          t('bmShop.exchange.successTitle'),
          t('bmShop.exchange.successBody', {
            gems: formatGemBalance(result.gemCost),
            credits: formatCredits(result.creditsGranted, { suffix: true }),
          }),
        );
        return;
      }
      showArcAlert(t('bmShop.errorTitle'), t(mapGemExchangeErrorKey(result.code)));
    },
    [t],
  );

  const handleAction = useCallback(
    (product: BmShopProduct) => {
      if (entry.shopKind === 'exchange') {
        void handleExchangeAction(product);
        return;
      }
      handlePremiumAction(product);
    },
    [entry.shopKind, handleExchangeAction, handlePremiumAction],
  );

  const handleClaimSelected = useCallback(() => {
    if (deedClaiming) return;
    if (!selectedPlanetId) {
      showArcAlert(t('bmShop.deed.failTitle'), t('bmShop.deed.needSelect'));
      return;
    }
    setDeedClaiming(true);
    void claimPlanetDeedFromCashGrant(selectedPlanetId).then((result) => {
      setDeedClaiming(false);
      if (!result.ok) {
        const failKey =
          result.claimReason === 'red_territory'
            ? 'trade.own.claimFailRedTerritory'
            : result.claimReason === 'already_owner'
              ? 'trade.own.claimFailAlready'
              : result.claimReason === 'cloud_taken'
                ? 'trade.own.claimFailCloudTaken'
                : result.claimReason === 'cloud_offline' || result.claimReason === 'cloud_auth'
                  ? 'trade.own.claimFailCloudOffline'
                  : result.claimReason === 'owned_by_other_clan'
                    ? 'trade.own.claimFailMsg'
                    : result.reason === 'no_player'
                      ? 'bmShop.deed.failNoPlayer'
                      : 'trade.own.claimFailMsg';
        showArcAlert(t('trade.own.claimFailTitle'), t(failKey));
        void listPlanetDeedCashGrantTargetsWithCloud().then(setPickerRows);
        return;
      }
      setDeedPickerOpen(false);
      showArcAlert(t('trade.own.claimDoneTitle'), t('trade.own.claimDoneMsg', { planet: result.planetName }));
    });
  }, [deedClaiming, selectedPlanetId, t]);

  const panelPrefix = (
    <>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceChipGem}>
          {t('bmShop.hud.gems', { amount: formatGemBalance(gemBalance) })}
        </Text>
        <Text style={styles.balanceChipCredits}>
          {t('bmShop.hud.credits', { amount: formatCredits(creditBalance, { suffix: false }) })}
        </Text>
      </View>
      {entry.shopKind === 'exchange' ? (
        <Text style={styles.capHint}>
          {t('bmShop.hud.exchangeCapDaily', {
            used: exchangeCap.dailyUsedGems,
            cap: exchangeCap.dailyCapGems,
          })}
        </Text>
      ) : null}
      <Text style={styles.notice}>{t(resolveBmShopNoticeKey(entry.shopKind))}</Text>
      {entry.shopKind === 'premium' ? (
        <Text style={styles.overlapHint}>{t('bmShop.overlap.familyHint')}</Text>
      ) : null}
      {deedPickerOpen ? (
        <Text style={styles.pickerHint}>{t('bmShop.deed.pickerHint')}</Text>
      ) : null}
    </>
  );

  return (
    <ArcOverlayCard
      title={deedPickerOpen ? t('bmShop.deed.pickerTitle') : t(resolveBmShopTitleKey(entry.shopKind))}
      subtitle={deedPickerOpen ? t('bmShop.deed.pickerSubtitle') : t(resolveBmShopSubtitleKey(entry.shopKind))}
      layout="panel"
      panelPrefix={panelPrefix}
      visualTheme={visualTheme}
      onClose={onClose}
      footer={
        <ArcOverlayFooterActions
          onCancel={deedPickerOpen ? () => setDeedPickerOpen(false) : onClose}
          onConfirm={deedPickerOpen ? handleClaimSelected : onClose}
          confirmLabel={deedPickerOpen ? t('bmShop.deed.claim') : undefined}
          cancelLabel={deedPickerOpen ? t('bmShop.deed.back') : undefined}
          confirmDisabled={deedPickerOpen && (!selectedPlanetId || deedClaiming)}
          visualTheme={visualTheme}
        />
      }
    >
      {deedPickerOpen ? (
        pickerRows.length === 0 ? (
          <Text style={styles.pickerHint}>{t('bmShop.deed.pickerEmpty')}</Text>
        ) : (
          pickerRows.map((row) => (
            <Pressable
              key={row.planetId}
              onPress={() => setSelectedPlanetId(row.planetId)}
              style={[styles.pickerRow, selectedPlanetId === row.planetId && styles.pickerRowSelected]}
            >
              <Text style={styles.pickerName}>{row.name}</Text>
              {row.systemName ? (
                <Text style={styles.pickerSystem}>{row.systemName}</Text>
              ) : null}
            </Pressable>
          ))
        )
      ) : (
        products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            actionLabel={resolveDeedActionLabel(
              t,
              product.id,
              actionLabel,
              deedClaimedPlanetId,
              deedPendingGrant,
            )}
            onAction={handleAction}
            isTactical={isTactical}
          />
        ))
      )}
    </ArcOverlayCard>
  );
});
