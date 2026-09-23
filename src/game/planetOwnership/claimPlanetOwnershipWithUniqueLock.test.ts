import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  appendUniqueDeedRowIfMissing,
  mergePlanetUniqueDeedRosterRows,
  type PlanetUniqueDeedRow,
} from '../../firebase/planetUniqueDeedModel';

function row(planetId: string, securedAt: number, ownerUid = 'u1'): PlanetUniqueDeedRow {
  return {
    planetId,
    ownerUid,
    nickname: 'tester',
    playerLevel: 2,
    megaFactionId: '',
    securedAt,
  };
}

describe('mergePlanetUniqueDeedRosterRows', () => {
  it('keeps cloud row when the same planet exists locally', () => {
    const merged = mergePlanetUniqueDeedRosterRows(
      [row('vega_base', 50, 'cloud')],
      [row('vega_base', 10, 'local')],
    );
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.ownerUid, 'cloud');
  });

  it('appends local-only planets and sorts by securedAt', () => {
    const merged = mergePlanetUniqueDeedRosterRows(
      [row('vega_base', 200)],
      [row('arcadia_prime', 100)],
    );
    assert.equal(merged.length, 2);
    assert.equal(merged[0]?.planetId, 'arcadia_prime');
    assert.equal(merged[1]?.planetId, 'vega_base');
  });
});

describe('appendUniqueDeedRowIfMissing', () => {
  it('appends a claimed planet that is not already in hold rows', () => {
    const out = appendUniqueDeedRowIfMissing([row('vega_base', 100)], row('arcadia_prime', 200, 'u1'));
    assert.equal(out.length, 2);
    assert.equal(out[1]?.planetId, 'arcadia_prime');
  });

  it('does not duplicate an already listed planet', () => {
    const out = appendUniqueDeedRowIfMissing([row('vega_base', 100)], row('vega_base', 200, 'u2'));
    assert.equal(out.length, 1);
    assert.equal(out[0]?.ownerUid, 'u1');
  });
});
