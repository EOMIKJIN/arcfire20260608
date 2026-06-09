import type { MiningSessionState, MiningTickResult } from './types';
import { ORBIT_MINING_REWARD_GOOD_ID } from '../../game/miningConfig';
import { rollMiningDropGoodId } from '../../arcCore/economy/mineralMiningDropPolicy';
import { isArcCorePricedMineral } from '../../arcCore/economy/mineralTradePricing';
import { useMenuNotificationStore } from '../../store/menuNotificationStore';
import { usePlayerStore } from '../../store/playerStore';
import { scheduleMiningPlayerPersist } from './miningPlayerPersist';

const INITIAL_STATE: MiningSessionState = {
  planetId: null,
  miningGoodId: null,
  status: 'idle',
  startedAtMs: null,
  lastTickAtMs: null,
  orbitSessionOreTotal: 0,
};

export function createInitialMiningSessionState(): MiningSessionState {
  return { ...INITIAL_STATE };
}

export function startMiningSession(
  prev: MiningSessionState,
  planetId: string,
  miningGoodId: string,
  nowMs: number,
): MiningSessionState {
  return {
    ...prev,
    planetId,
    miningGoodId,
    status: 'running',
    startedAtMs: nowMs,
    lastTickAtMs: nowMs,
    orbitSessionOreTotal: 0,
  };
}

export function pauseMiningSession(prev: MiningSessionState, nowMs: number): MiningSessionState {
  return {
    ...prev,
    status: prev.status === 'running' ? 'paused' : prev.status,
    lastTickAtMs: nowMs,
  };
}

export function stopMiningSession(): MiningSessionState {
  return createInitialMiningSessionState();
}

/**
 * 광물 1사이클 — 아크코어 확률 드랍(존 풀 · 70% 주력 / 30% 부가).
 */
export function runMiningTick(prev: MiningSessionState, nowMs: number): MiningTickResult {
  if (prev.status !== 'running' || !prev.planetId) {
    return {
      grantedItems: [],
      nextState: {
        ...prev,
        lastTickAtMs: nowMs,
      },
    };
  }
  const rewardGoodId = rollMiningDropGoodId(prev.planetId);
  return {
    grantedItems: [{ goodId: rewardGoodId, quantity: 1 }],
    nextState: {
      ...prev,
      lastTickAtMs: nowMs,
      miningGoodId: rewardGoodId,
    },
  };
}

export function applyOrbitalMiningRewardForCurrentPlayerCycle(quantity = 1): boolean {
  const q = Math.max(1, Math.floor(Number.isFinite(quantity) ? quantity : 1));
  const playerState = usePlayerStore.getState();
  const player = playerState.player;
  const planetId = player?.currentPlanetId ?? null;
  if (!planetId) return false;

  for (let i = 0; i < q; i += 1) {
    const rewardGoodId = rollMiningDropGoodId(planetId);
    playerState.addInventoryItem(rewardGoodId, 1);
    if (isArcCorePricedMineral(rewardGoodId) || rewardGoodId === ORBIT_MINING_REWARD_GOOD_ID) {
      playerState.recordOrbitalMiningDelivery(planetId, rewardGoodId, 1);
    }
  }
  useMenuNotificationStore.getState().setBadge('trade', true);
  scheduleMiningPlayerPersist();
  return true;
}
