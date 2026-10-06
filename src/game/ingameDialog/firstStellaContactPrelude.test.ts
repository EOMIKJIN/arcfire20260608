import assert from 'node:assert/strict';
import test from 'node:test';
import { isUnseenFirstStellaLandScene } from './firstStellaContactPrelude';

test('unseen ingame_dialog_01 is the first land scene', () => {
  assert.equal(
    isUnseenFirstStellaLandScene(
      [{ id: 'ingame_dialog_01', triggerRepeat: 'once' }],
      [],
    ),
    true,
  );
});

test('seen welcome does not prelude', () => {
  assert.equal(
    isUnseenFirstStellaLandScene(
      [{ id: 'ingame_dialog_01', triggerRepeat: 'once' }],
      ['ingame_dialog_01'],
    ),
    false,
  );
});

test('another unseen land scene first does not prelude', () => {
  assert.equal(
    isUnseenFirstStellaLandScene(
      [
        { id: 'other_land', triggerRepeat: 'once' },
        { id: 'ingame_dialog_01', triggerRepeat: 'once' },
      ],
      [],
    ),
    false,
  );
});
