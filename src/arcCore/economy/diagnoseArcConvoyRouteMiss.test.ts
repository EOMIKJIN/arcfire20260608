import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatArcConvoyMissLog,
  pickDominantSkipReason,
  type ArcConvoyMissDiagnosis,
} from './arcConvoyMissLog';

describe('arcConvoyMissLog', () => {
  it('picks the most frequent skip reason', () => {
    assert.equal(pickDominantSkipReason({ stock_le_0: 4, net_le_0: 1 }), 'stock_le_0');
    assert.equal(pickDominantSkipReason({}), 'no_route');
  });

  it('formats a one-line miss log', () => {
    const diag: ArcConvoyMissDiagnosis = {
      planetId: 'core_prime',
      dominantReason: 'stock_le_0',
      skipCounts: { stock_le_0: 3, buy_price_le_0: 1 },
      candidateCount: 0,
    };
    assert.equal(
      formatArcConvoyMissLog(diag, 'no_route'),
      '[ArcCore/Convoy] miss planet=core_prime reason=stock_le_0 candidates=0 trip=no_route skips=stock_le_0=3,buy_price_le_0=1',
    );
  });
});
