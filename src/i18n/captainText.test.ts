import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveNpcCaptainRank } from './captainText';
import { resolveGovernorTitle } from './governorText';

test('New Contracts client rank uses English titles', () => {
  assert.equal(
    resolveNpcCaptainRank({ rank: '관문순찰대장' }, 'en'),
    'Gate Patrol Captain',
  );
  assert.equal(resolveNpcCaptainRank({ rank: '외곽초계' }, 'en'), 'Outer Patrol');
  assert.equal(resolveNpcCaptainRank({ rank: '관문순찰대장' }, 'ko'), '관문순찰대장');
  assert.equal(resolveNpcCaptainRank({ rank: '외곽초계' }, 'ko'), '외곽초계');
});

test('rankEn field overrides lexicon', () => {
  assert.equal(
    resolveNpcCaptainRank({ rank: '관문순찰대장', rankEn: 'Gate Watch Captain' }, 'en'),
    'Gate Watch Captain',
  );
});

test('planet info governor title uses English', () => {
  assert.equal(
    resolveGovernorTitle({ governorTitleKo: '무역호위총감' }, 'en'),
    'Trade Escort Inspector',
  );
  assert.equal(
    resolveGovernorTitle({ governorTitleKo: '관문순찰대장' }, 'en'),
    'Gate Patrol Captain',
  );
  assert.equal(
    resolveGovernorTitle({ governorTitleKo: '무역호위총감' }, 'ko'),
    '무역호위총감',
  );
});
