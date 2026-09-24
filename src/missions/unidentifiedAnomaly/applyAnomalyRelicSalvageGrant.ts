import { onQuestRelicAcquired } from '../../game/questRelic/questRelicEffectRegistry';
import { applyBuyGoodsMissionObjectives } from '../applyBuyGoodsMissionObjectives';

export function applyAnomalyRelicSalvageGrant(itemId: string): void {
  const { usePlayerStore } =
    require('../../store/playerStore') as typeof import('../../store/playerStore');
  usePlayerStore.getState().addInventoryItem(itemId, 1);
  onQuestRelicAcquired(itemId);
  applyBuyGoodsMissionObjectives();
}
