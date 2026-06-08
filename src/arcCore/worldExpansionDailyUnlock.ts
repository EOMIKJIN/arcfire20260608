import { usePlayerStore } from '../store/playerStore';
import { useWorldStore } from '../store/worldStore';
import { useTavernBoardStore } from '../store/tavernBoardStore';
import { dispatchArcCoreAfterSystemUnlock } from './worldExpansionUnlockDispatch';
import {
  getExpansionUnlockIntervalSec,
  isArcExpansionTestOneShotConsumed,
  isArcExpansionTestOneShotEnvOn,
  markArcExpansionTestOneShotDoneAsync,
} from './arcCoreExpansionTestFlags';
import { persistArcCoreDailyUnlockRecord } from './arcCoreDailyUnlockVerification';

/** 월드 확장 일일 개방 — `WorldExpansionSubCore`·일일 운영 배치 공용 */
export function tryArcCoreWorldDailyUnlock(): boolean {
  const world = useWorldStore.getState();
  if (!world.loaded) return false;
  const now = Date.now();
  const last = world.lastExpansionAtMs ?? 0;
  const intervalSec = getExpansionUnlockIntervalSec();
  if (last > 0 && now - last < intervalSec * 1000) return false;

  const currentSystemId = usePlayerStore.getState().player?.currentSystemId ?? null;
  const candidateId = world.pickArcCoreDailyUnlockCandidate(currentSystemId);
  if (!candidateId) return false;

  const targetSystem = world.getSystem(candidateId);
  if (!targetSystem) return false;
  const sourcePlanetId = targetSystem.planets[0]?.id;
  if (!sourcePlanetId) return false;

  world.unlockSystem(candidateId, 'arc_core_daily');
  dispatchArcCoreAfterSystemUnlock(candidateId, 'daily');
  void persistArcCoreDailyUnlockRecord(candidateId);

  if (isArcExpansionTestOneShotEnvOn() && !isArcExpansionTestOneShotConsumed()) {
    void markArcExpansionTestOneShotDoneAsync();
    useTavernBoardStore.getState().pushNotice({
      title: '[테스트] 미개척 성계 개방',
      body: `아크코어 1회 테스트로 ${targetSystem.name}(${candidateId})이(가) 개방되었습니다. 이후 일일 주기는 24시간으로 돌아갑니다.`,
      tag: '아크코어',
      dedupeKey: 'arc_expansion_test_one_shot_v1',
    });
  }
  return true;
}
