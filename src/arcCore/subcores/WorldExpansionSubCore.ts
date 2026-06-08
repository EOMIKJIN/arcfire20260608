import { BaseArcSubCore } from './BaseArcSubCore';
import { usePlayerStore } from '../../store/playerStore';
import { useWorldStore } from '../../store/worldStore';
import { useTavernBoardStore } from '../../store/tavernBoardStore';
import { dispatchArcCoreAfterSystemUnlock } from '../worldExpansionUnlockDispatch';
import {
  getExpansionProbeIntervalSec,
  getExpansionUnlockIntervalSec,
  isArcExpansionTestOneShotConsumed,
  isArcExpansionTestOneShotEnvOn,
  markArcExpansionTestOneShotDoneAsync,
} from '../arcCoreExpansionTestFlags';
import { persistArcCoreDailyUnlockRecord } from '../arcCoreDailyUnlockVerification';
import { applyArcCoreLegacyGuaranteedUnlocks } from '../worldExpansionGuaranteedUnlocks';

/**
 * 아크코어 월드 확장(로컬 일일 개방)
 * - 레거시 보장 성계는 `applyArcCoreLegacyGuaranteedUnlocks`로 해금·명령 발행(일일 개방과 동일 경로).
 * - 실시간 기준 24h당 최대 1회(`lastExpansionAtMs`), 연결된 잠금 synth 프론티어만.
 * - 테스트: `EXPO_PUBLIC_ARCCORE_EXPANSION_TEST_INTERVAL_SEC`, 원샷 1회: `EXPO_PUBLIC_ARCCORE_EXPANSION_TEST_ONE_SHOT=1` (+선술집 공지).
 */
export class WorldExpansionSubCore extends BaseArcSubCore {
  private unlockProbeAccSec = 0;

  constructor() {
    super('world_expansion_subcore', 'World Expansion 서브코어');
    const initialInterval = getExpansionUnlockIntervalSec();
    this.onWallTick = ({ wallDeltaSec }) => {
      this.unlockProbeAccSec += wallDeltaSec;
      const probeSec = getExpansionProbeIntervalSec(getExpansionUnlockIntervalSec());
      if (this.unlockProbeAccSec < probeSec) return;
      this.unlockProbeAccSec = 0;
      this.tryDailyUnlock();
    };
    this.registerTimedMission({
      id: 'world_daily_unlock',
      name: '일일 미개척 성계 개방',
      stepDurationsSec: [initialInterval],
      repeat: true,
      onCompleted: () => {
        this.tryDailyUnlock();
      },
    });
  }

  override onBoot(): void {
    applyArcCoreLegacyGuaranteedUnlocks();
    this.tryDailyUnlock();
  }

  private tryDailyUnlock(): void {
    const world = useWorldStore.getState();
    if (!world.loaded) return;
    const now = Date.now();
    const last = world.lastExpansionAtMs ?? 0;
    const intervalSec = getExpansionUnlockIntervalSec();
    if (last > 0 && now - last < intervalSec * 1000) return;

    const currentSystemId = usePlayerStore.getState().player?.currentSystemId ?? null;
    const candidateId = world.pickArcCoreDailyUnlockCandidate(currentSystemId);
    if (!candidateId) return;

    const targetSystem = world.getSystem(candidateId);
    if (!targetSystem) return;
    const sourcePlanetId = targetSystem.planets[0]?.id;
    if (!sourcePlanetId) return;

    world.unlockSystem(candidateId, 'arc_core_daily');
    dispatchArcCoreAfterSystemUnlock(candidateId, 'daily');
    void persistArcCoreDailyUnlockRecord(candidateId);

    if (
      isArcExpansionTestOneShotEnvOn() &&
      !isArcExpansionTestOneShotConsumed()
    ) {
      void markArcExpansionTestOneShotDoneAsync();
      useTavernBoardStore.getState().pushNotice({
        title: '[테스트] 미개척 성계 개방',
        body: `아크코어 1회 테스트로 ${targetSystem.name}(${candidateId})이(가) 개방되었습니다. 이후 일일 주기는 24시간으로 돌아갑니다.`,
        tag: '아크코어',
        dedupeKey: 'arc_expansion_test_one_shot_v1',
      });
    }
  }
}
