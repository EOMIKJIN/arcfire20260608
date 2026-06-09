import { ORBIT_MINING_REWARD_GOOD_ID } from '../src/game/miningConfig';
import { getItemDef } from '../src/data/itemRegistry';
import {
  createEmptyInventorySlots,
  addToInventorySlotsMax,
  aggregateInventoryForTrade,
  countGoodInInventory,
} from '../src/game/playerInventory';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function run(): void {
  const rewardDef = getItemDef(ORBIT_MINING_REWARD_GOOD_ID);
  assert(rewardDef, `Missing item_def for ${ORBIT_MINING_REWARD_GOOD_ID}`);
  assert(rewardDef?.tradeable === true, `${ORBIT_MINING_REWARD_GOOD_ID} must be tradeable=true`);
  assert(rewardDef?.id === 'ore_ferrite', 'ORBIT_MINING_REWARD_GOOD_ID should be ore_ferrite');

  const empty = createEmptyInventorySlots();
  const added = addToInventorySlotsMax(empty, ORBIT_MINING_REWARD_GOOD_ID, 3, 0);
  assert(added.added === 3, `Expected added=3, got ${added.added}`);

  const invQty = countGoodInInventory(added.slots, ORBIT_MINING_REWARD_GOOD_ID);
  assert(invQty === 3, `Expected inventory qty=3, got ${invQty}`);

  const sellAgg = aggregateInventoryForTrade(added.slots);
  const sellRow = sellAgg.find((r) => r.goodId === ORBIT_MINING_REWARD_GOOD_ID);
  assert(Boolean(sellRow), 'Trade aggregate missing ore row');
  assert((sellRow?.quantity ?? 0) === 3, `Expected sell qty=3, got ${sellRow?.quantity ?? 0}`);

  console.log('OK mining smoke sim', {
    rewardId: ORBIT_MINING_REWARD_GOOD_ID,
    rewardName: rewardDef?.name,
    inventoryQty: invQty,
    tradeQty: sellRow?.quantity ?? 0,
  });
}

run();
