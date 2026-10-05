import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolvePlayerWaveDefeatDisposition } from './playerWaveDefeatDisposition';

describe('resolvePlayerWaveDefeatDisposition', () => {
  it('크림슨 공격에 지면 블루·중립 모두 크림슨으로 바꾸고 기함을 보낸다', () => {
    const blue = resolvePlayerWaveDefeatDisposition({
      outcome: 'lose',
      territorialAttack: true,
      wasRedOccupied: false,
      sunk: false,
    });
    assert.equal(blue.occupyCrimson, true);
    assert.equal(blue.sendHome, true);
    assert.equal(blue.destroyShip, false);

    const sunk = resolvePlayerWaveDefeatDisposition({
      outcome: 'lose',
      territorialAttack: true,
      wasRedOccupied: false,
      sunk: true,
    });
    assert.equal(sunk.destroyShip, true);
  });

  it('이미 크림슨인 성계에서 지면 점유는 다시 쓰지 않고 기함만 보낸다', () => {
    const red = resolvePlayerWaveDefeatDisposition({
      outcome: 'lose',
      territorialAttack: false,
      wasRedOccupied: true,
      sunk: false,
    });
    assert.equal(red.occupyCrimson, false);
    assert.equal(red.sendHome, true);
  });

  it('승리하면 블루를 유지하고 기함을 보내지 않는다', () => {
    const win = resolvePlayerWaveDefeatDisposition({
      outcome: 'win',
      territorialAttack: true,
      wasRedOccupied: false,
      sunk: true,
    });
    assert.equal(win.occupyCrimson, false);
    assert.equal(win.sendHome, false);
    assert.equal(win.destroyShip, false);
  });

  it('분쟁 공격이 아닌 패배는 점유·귀환을 하지 않는다', () => {
    const quest = resolvePlayerWaveDefeatDisposition({
      outcome: 'lose',
      territorialAttack: false,
      wasRedOccupied: false,
      sunk: true,
    });
    assert.equal(quest.occupyCrimson, false);
    assert.equal(quest.sendHome, false);
  });
});
