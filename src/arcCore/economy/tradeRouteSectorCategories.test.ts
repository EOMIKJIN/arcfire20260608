import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { listSectorCargoSkuItemIds } from './tradeRouteSectorCategories';

describe('listSectorCargoSkuItemIds', () => {
  it('stocks food packs on early sector bands', () => {
    const early = listSectorCargoSkuItemIds('early');
    assert.equal(early.includes('food'), true);
    assert.equal(early.includes('minerals'), true);
    assert.equal(early.includes('tech'), false);
  });

  it('adds tech on mid_early and later', () => {
    assert.equal(listSectorCargoSkuItemIds('mid_early').includes('tech'), true);
    assert.equal(listSectorCargoSkuItemIds('late').includes('contraband'), true);
  });
});
