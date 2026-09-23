import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatWorldChangeFactLine } from './orbitPresenceWorldChange';

test('digest 한 줄: hold · roster gone/back · board', () => {
  const hold = formatWorldChangeFactLine(
    { kind: 'hold' },
    {
      locale: 'ko',
      planetLabel: '아르카디아 프라임',
      prevHoldLabel: '스텔리움 연합',
      nextHoldLabel: '크림슨 레기온',
      captainLabel: '',
    },
  );
  assert.match(hold, /아르카디아 프라임/);
  assert.match(hold, /스텔리움 연합/);
  assert.match(hold, /크림슨 레기온/);

  const gone = formatWorldChangeFactLine(
    { kind: 'roster', direction: 'gone', captainId: 'npc_cpt_mireille' },
    {
      locale: 'ko',
      planetLabel: '뉴 에덴',
      prevHoldLabel: '',
      nextHoldLabel: '',
      captainLabel: '미레유 보스',
    },
  );
  assert.match(gone, /미레유 보스/);
  assert.match(gone, /없다/);

  const back = formatWorldChangeFactLine(
    { kind: 'roster', direction: 'back', captainId: 'npc_cpt_sela' },
    {
      locale: 'en',
      planetLabel: 'Minerva',
      prevHoldLabel: '',
      nextHoldLabel: '',
      captainLabel: 'Sela Moran',
    },
  );
  assert.match(back, /Sela Moran/);
  assert.match(back, /back/i);

  assert.equal(
    formatWorldChangeFactLine(undefined, {
      locale: 'ko',
      planetLabel: 'x',
      prevHoldLabel: '',
      nextHoldLabel: '',
      captainLabel: '',
    }),
    '',
  );
});
