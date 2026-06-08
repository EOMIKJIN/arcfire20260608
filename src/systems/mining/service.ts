import type { MiningSessionState, MiningTickResult } from './types';
import { ORBIT_MINING_REWARD_GOOD_ID } from '../../game/miningConfig';
import { useMenuNotificationStore } from '../../store/menuNotificationStore';
import { usePlayerStore } from '../../store/playerStore';

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
 * TODO(mining): 실제 채광 규칙(보상 테이블/쿨다운/인벤 반영)을 연결한다.
 * 현재는 작업 기반만 제공하는 no-op tick.
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
  const rewardGoodId = (prev.miningGoodId && prev.miningGoodId.trim()) || ORBIT_MINING_REWARD_GOOD_ID;
  return {
    grantedItems: [{ goodId: rewardGoodId, quantity: 1 }],
    nextState: {
      ...prev,
      lastTickAtMs: nowMs,
    },
  };
}

/**
 * 아크코어 채굴 사이클 완료 시, 현재 착륙 행성이 채굴 가능하면 보상을 인벤토리에 자동 적재한다.
 * 반환값: 실제 적재 성공 여부.
 */
export function applyOrbitalMiningRewardForCurrentPlayerCycle(quantity = 1): boolean {
  const q = Math.max(1, Math.floor(Number.isFinite(quantity) ? quantity : 1));
  const playerState = usePlayerStore.getState();
  const player = playerState.player;
  const planetId = player?.currentPlanetId ?? null;
  if (!planetId) return false;

  const rewardGoodId = ORBIT_MINING_REWARD_GOOD_ID;
  playerState.addInventoryItem(rewardGoodId, q);
  if (rewardGoodId === ORBIT_MINING_REWARD_GOOD_ID) {
    playerState.recordOrbitalMiningOre1Delivery(planetId, q);
  }
  useMenuNotificationStore.getState().setBadge('trade', true);
  void playerState.persist();
  return true;
}
