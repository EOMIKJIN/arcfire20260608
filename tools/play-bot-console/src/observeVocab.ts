/**
 * 봇과 앱이 같은 행동 문자열을 쓰게 한다 (스텔라 설계 Part D · D1).
 * 봇 행동 순간에 noteObs 로 쌓고, 저널 한 줄을 쓸 때 takeObs 로 붙인다.
 * 한 줄에 여러 행동이 붙을 수 있다 (패배 = combat lose + destroy).
 */
import type { PlayerObserveVerb } from '../../../src/game/playerObserve/playerObserveSink';
import type { WorldState } from './types';

export { playerObserveDetail as obsDetail } from '../../../src/game/playerObserve/playerObserveDetail';

export type ObsEvent = { verb: PlayerObserveVerb; detail: string };

/** 'bot' = 봇이 만든다. 그 외 = 봇이 만들지 않는 이유. 새 동사를 추가하면 여기서 컴파일이 깨진다. */
export const BOT_OBSERVE_COVERAGE: Record<PlayerObserveVerb, 'bot' | string> = {
  quest: 'bot',
  combat: 'bot',
  trade: 'bot',
  annex: 'bot',
  skill: 'bot',
  ship: 'bot',
  mine: 'bot',
  develop: 'bot',
  land: 'bot',
  level: 'bot',
  destroy: 'bot',
  equip: 'bot',
  scan: 'bot_no_scan_ui',
  talk: 'bot_no_dialog',
  repair: 'bot_no_repair_model',
  session: 'bot_no_app_session',
};

const OBS_PENDING_MAX = 8;

export function noteObs(world: WorldState, verb: PlayerObserveVerb, detail: string): void {
  const q = world.obsPending ?? (world.obsPending = []);
  if (q.length >= OBS_PENDING_MAX) q.shift();
  q.push({ verb, detail });
}

/** 저널 한 줄에 붙일 행동. 없으면 undefined. */
export function takeObs(world: WorldState): ObsEvent[] | undefined {
  const q = world.obsPending;
  if (!q || q.length === 0) return undefined;
  world.obsPending = [];
  return q;
}
