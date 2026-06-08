import { BaseArcSubCore } from './BaseArcSubCore';
import { subscribeArcCoreCommands, type ArcCoreCommand } from '../ArcCoreCommandBus';
import { useWorldStore } from '../../store/worldStore';
import { useArcNpcTrafficStore } from '../../store/arcNpcTrafficStore';
import { useTavernBoardStore, type TavernNoticeTag } from '../../store/tavernBoardStore';

const BOARD_SUMMARY_INTERVAL_SEC = 24 * 60 * 60;
const TRANSPORT_NOTICE_DEDUPE_PREFIX = 'seed_transport_daily_digest_';

/**
 * 아크코어 공지 보드 서브코어
 * - ArcCore 명령/월드 상태를 공지 피드로 축약한다.
 * - 선술집 소식판의 실데이터 공급원 역할.
 */
export class ArcNewsBoardSubCore extends BaseArcSubCore {
  private unsubCommands: (() => void) | null = null;

  constructor() {
    super('arc_news_board_subcore', 'Arc News Board 서브코어');
    this.registerTimedMission({
      id: 'arc_news_world_summary',
      name: '아크코어 월드 요약 브리핑',
      stepDurationsSec: [BOARD_SUMMARY_INTERVAL_SEC],
      repeat: true,
      onCompleted: () => this.publishWorldSummary(),
    });
  }

  override onBoot(): void {
    this.unsubCommands = subscribeArcCoreCommands((cmd) => this.onArcCoreCommand(cmd));
    this.publishBootNotice();
  }

  override onShutdown(): void {
    this.unsubCommands?.();
    this.unsubCommands = null;
  }

  private publishBootNotice(): void {
    this.pushNotice(
      '아크코어 공지 보드 동기화 완료',
      '월드 확장·수송선단·경제 지시 이벤트를 실시간 수집합니다.',
      '아크코어',
      'arc_news_boot_notice',
    );
  }

  private onArcCoreCommand(cmd: ArcCoreCommand): void {
    if (cmd.type === 'world_system_unlocked') {
      this.pushNotice(
        `성계 개척: ${cmd.systemName}`,
        `아크코어가 ${cmd.systemName} 성계를 개방했습니다. (${cmd.systemId})`,
        '작전',
        `world_unlock_${cmd.systemId}`,
      );
      return;
    }
    if (cmd.type === 'npc_seed_transport_for_system') {
      const dayKey = new Date().toISOString().slice(0, 10);
      this.pushNotice(
        '수송선단 파견 보고',
        `${cmd.factionId} 소속 수송선단 파견이 감지되었습니다. 상세 파견 로그는 아크코어 내부에서 계속 집계합니다.`,
        '외교',
        `${TRANSPORT_NOTICE_DEDUPE_PREFIX}${dayKey}`,
      );
      return;
    }
    if (cmd.type === 'economy_trade_port_bulk') {
      const scopeLabel =
        cmd.scope.kind === 'all_trade_ports'
          ? '전체 무역소'
          : `${cmd.scope.planetIds.length}개 행성 무역소`;
      this.pushNotice(
        `경제 지시 반영: ${scopeLabel}`,
        `아크코어 경제 서브코어가 ${cmd.action} 정책을 반영했습니다.`,
        '경제',
        `economy_bulk_${cmd.action}_${cmd.scope.kind}`,
      );
      return;
    }
  }

  private publishWorldSummary(): void {
    const world = useWorldStore.getState();
    const unlocked = world.unlockedSystemIds.length;
    const total = Object.keys(world.systems).length;
    const traffic = useArcNpcTrafficStore.getState().ships.length;
    this.pushNotice(
      '아크코어 정기 브리핑',
      `개방 성계 ${unlocked}/${total}, 활성 수송선 ${traffic}척 상태입니다.`,
      '아크코어',
      undefined,
    );
  }

  private pushNotice(title: string, body: string, tag: TavernNoticeTag, dedupeKey?: string): void {
    useTavernBoardStore.getState().pushNotice({ title, body, tag, dedupeKey });
  }
}

