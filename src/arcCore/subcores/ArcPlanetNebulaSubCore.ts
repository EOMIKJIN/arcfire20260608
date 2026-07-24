import { BaseArcSubCore } from './BaseArcSubCore';
import { subscribeArcCoreCommands, type ArcCoreCommand } from '../ArcCoreCommandBus';
import { useWorldStore } from '../../store/worldStore';
import { usePlanetNebulaStore } from '../../store/planetNebulaStore';
import { planetSkiaNebulaProfileNotNeeded } from '../../game/mainStageSkiaBackdrop';
import { useTavernBoardStore } from '../../store/tavernBoardStore';

const DAILY_ECOLOGY_SHIFT_INTERVAL_SEC = 24 * 60 * 60;

/**
 * 행성 성운 자동 생성 서브코어
 * - 성계 활성화(해금) 시 해당 성계 행성의 성운 프로필(베이크 재생성 시드)을 자동 생성.
 * - `planets.csv`에서 성운 레이어가 꺼진 행성은 제외한다.
 */
export class ArcPlanetNebulaSubCore extends BaseArcSubCore {
  private unsubCommands: (() => void) | null = null;

  constructor() {
    super('arc_planet_nebula_subcore', '아스트라이아 · 성운');
    this.registerTimedMission({
      id: 'planet_nebula_daily_ecology_shift',
      name: '행성 성운 생태계 일일 변조',
      stepDurationsSec: [DAILY_ECOLOGY_SHIFT_INTERVAL_SEC],
      repeat: true,
      onCompleted: () => this.applyDailyEcologyShift(),
    });
  }

  override onBoot(): void {
    this.unsubCommands = subscribeArcCoreCommands((cmd) => this.onArcCoreCommand(cmd));
    usePlanetNebulaStore.getState().pruneOrphanProfiles();
    this.backfillUnlockedSystems();
    this.applyDailyEcologyShift();
  }

  override onShutdown(): void {
    this.unsubCommands?.();
    this.unsubCommands = null;
  }

  private onArcCoreCommand(cmd: ArcCoreCommand): void {
    if (cmd.type !== 'world_system_unlocked') return;
    usePlanetNebulaStore.getState().pruneOrphanProfiles();
    this.generateForSystem(cmd.systemId);
  }

  private backfillUnlockedSystems(): void {
    const world = useWorldStore.getState();
    for (const systemId of world.unlockedSystemIds) {
      this.generateForSystem(systemId);
    }
  }

  private generateForSystem(systemId: string): void {
    const world = useWorldStore.getState();
    const system = world.getSystem(systemId);
    if (!system) return;
    const nebula = usePlanetNebulaStore.getState();
    for (const planet of system.planets) {
      if (planetSkiaNebulaProfileNotNeeded(planet)) continue;
      nebula.ensureProfileForPlanet(planet.id);
    }
  }

  private applyDailyEcologyShift(): void {
    const result = usePlanetNebulaStore.getState().applyDailyEcologyShiftIfDue();
    if (!result.applied || result.changedCount <= 0) return;
    useTavernBoardStore.getState().pushNotice({
      title: '행성 성운 생태계 정기 조정',
      body: `아크코어가 일일 주기 기준으로 ${result.changedCount}개 행성 성운 파라미터를 미세 조정했습니다.`,
      tag: '아크코어',
      dedupeKey: `planet_nebula_daily_shift_${new Date().toISOString().slice(0, 10)}`,
    });
  }
}

