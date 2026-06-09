import type { TradeProfitTip } from '../../game/tradeProfitTips';
import { useArcOverlayStore, type ArcOverlayTradeQuantityEntry } from './arcOverlayStore';

export type { ArcOverlayTradeQuantityEntry, TradeProfitTip };

export function presentArcOverlayTradeQuantity(
  input: Omit<ArcOverlayTradeQuantityEntry, 'id' | 'kind'> & { id?: string },
): void {
  useArcOverlayStore.getState().present({
    ...input,
    kind: 'tradeQuantity',
    dismissOnBackdrop: input.dismissOnBackdrop ?? true,
  });
}

export function dismissArcOverlayTradeQuantity(): void {
  const top = useArcOverlayStore.getState().top();
  if (top?.kind === 'tradeQuantity') {
    useArcOverlayStore.getState().dismiss();
  }
}
