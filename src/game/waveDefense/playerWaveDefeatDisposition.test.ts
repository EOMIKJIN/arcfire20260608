import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolvePlayerWaveDefeatDisposition } from './playerWaveDefeatDisposition';

describe('resolvePlayerWaveDefeatDisposition', () => {
  it('크림슨 웨이브에 지면 블루·중립 모두 크림슨으로 바꾸고 기함을 보낸다', () => {
    const blue = resolvePlayerWaveDefeatDisposition({
      outcome: 'lose',
      crimsonWave: true,
      wasRedOccupied: false,
      sunk: false,
    });
    assert.equal(blue.occupyCrimson, true);
    assert.equal(blue.sendHome, true);
    assert.equal(blue.destroyShip, false);

    const sunk = resolvePlayerWaveDefeatDisposition({
      outcome: 'lose',
      crimsonWave: true,
      wasRedOccupied: false,
      sunk: true,
    });
    assert.equal(sunk.destroyShip, true);
  });

  it('이미 크림슨인 성계에서 지면 점유는 다시 쓰지 않고 기함만 보낸다', () => {
    const red = resolvePlayerWaveDefeatDisposition({
      outcome: 'lose',
      crimsonWave: true,
      wasRedOccupied: true,
      sunk: false,
    });
    assert.equal(red.occupyCrimson, false);
    assert.equal(red.sendHome, true);
    assert.equal(red.destroyShip, false);
  });

  it('승리하면 점유를 쓰지 않고 기함을 보내지 않는다', () => {
    const win = resolvePlayerWaveDefeatDisposition({
      outcome: 'win',
      crimsonWave: true,
      wasRedOccupied: false,
      sunk: true,
    });
    assert.equal(win.occupyCrimson, false);
    assert.equal(win.sendHome, false);
    assert.equal(win.destroyShip, false);
  });

  it('엔진 실패 패배는 점유와 귀환을 하지 않는다', () => {
    const stalled = resolvePlayerWaveDefeatDisposition({
      outcome: 'lose',
      crimsonWave: true,
      wasRedOccupied: false,
      sunk: true,
      failsafe: true,
    });
    assert.equal(stalled.occupyCrimson, false);
    assert.equal(stalled.sendHome, false);
    assert.equal(stalled.destroyShip, false);
  });

  it('크림슨 웨이브가 아닌 패배는 점유·귀환을 하지 않는다', () => {
    const quest = resolvePlayerWaveDefeatDisposition({
      outcome: 'lose',
      crimsonWave: false,
      wasRedOccupied: false,
      sunk: true,
    });
    assert.equal(quest.occupyCrimson, false);
    assert.equal(quest.sendHome, false);
  });
});
