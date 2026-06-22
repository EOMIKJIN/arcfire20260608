import { BaseArcSubCore } from './BaseArcSubCore';
import { subscribeArcCoreCommands, type ArcCoreCommand } from '../ArcCoreCommandBus';
import { useWorldStore } from '../../store/worldStore';
import { useArcNpcTrafficStore } from '../../store/arcNpcTrafficStore';
import { useTavernBoardStore, type TavernNoticeTag } from '../../store/tavernBoardStore';
import type { I18nParams } from '../../i18n/types';
import { publishMegaFactionPgpDailyBriefingNotice } from '../../world/megaFactionPgpDailyBriefing';

const BOARD_SUMMARY_INTERVAL_SEC = 24 * 60 * 60;
const TRANSPORT_NOTICE_DEDUPE_PREFIX = 'seed_transport_daily_digest_';

type NoticeInput = {
  i18nKey: string;
  i18nParams?: I18nParams;
  title: string;
  body: string;
  tag: TavernNoticeTag;
  dedupeKey?: string;
};

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
    publishMegaFactionPgpDailyBriefingNotice();
  }

  override onShutdown(): void {
    this.unsubCommands?.();
    this.unsubCommands = null;
  }

  private publishBootNotice(): void {
    this.pushNotice({
      i18nKey: 'news.sync',
      title: '아크코어 공지 보드 동기화 완료',
      body: '월드 확장·수송선단·경제 지시 이벤트를 실시간 수집합니다.',
      tag: '아크코어',
      dedupeKey: 'arc_news_boot_notice',
    });
  }

  private onArcCoreCommand(cmd: ArcCoreCommand): void {
    if (cmd.type === 'world_system_unlocked') {
      this.pushNotice({
        i18nKey: 'news.worldUnlock',
        i18nParams: { systemName: cmd.systemName, systemId: cmd.systemId },
        title: `성계 개척: ${cmd.systemName}`,
        body: `아크코어가 ${cmd.systemName} 성계를 개방했습니다. (${cmd.systemId})`,
        tag: '작전',
        dedupeKey: `world_unlock_${cmd.systemId}`,
      });
      return;
    }
    if (cmd.type === 'npc_seed_transport_for_system') {
      const dayKey = new Date().toISOString().slice(0, 10);
      this.pushNotice({
        i18nKey: 'news.transport',
        i18nParams: { factionId: cmd.factionId },
        title: '수송선단 파견 보고',
        body: `${cmd.factionId} 소속 수송선단 파견이 감지되었습니다. 상세 파견 로그는 아크코어 내부에서 계속 집계합니다.`,
        tag: '외교',
        dedupeKey: `${TRANSPORT_NOTICE_DEDUPE_PREFIX}${dayKey}`,
      });
      return;
    }
    if (cmd.type === 'economy_trade_port_bulk') {
      this.pushNotice({
        i18nKey: 'news.economyBulk',
        i18nParams: {
          scopeKind: cmd.scope.kind === 'all_trade_ports' ? 'all' : 'planets',
          planetCount: cmd.scope.kind === 'all_trade_ports' ? 0 : cmd.scope.planetIds.length,
          action: cmd.action,
        },
        title:
          cmd.scope.kind === 'all_trade_ports'
            ? '경제 지시 반영: 전체 무역소'
            : `경제 지시 반영: ${cmd.scope.planetIds.length}개 행성 무역소`,
        body: `아크코어 경제 서브코어가 ${cmd.action} 정책을 반영했습니다.`,
        tag: '경제',
        dedupeKey: `economy_bulk_${cmd.action}_${cmd.scope.kind}`,
      });
      return;
    }
  }

  private publishWorldSummary(): void {
    const world = useWorldStore.getState();
    const unlocked = world.unlockedSystemIds.length;
    const total = Object.keys(world.systems).length;
    const traffic = useArcNpcTrafficStore.getState().ships.length;
    this.pushNotice({
      i18nKey: 'news.briefing',
      i18nParams: { unlocked, total, traffic },
      title: '아크코어 정기 브리핑',
      body: `개방 성계 ${unlocked}/${total}, 활성 수송선 ${traffic}척 상태입니다.`,
      tag: '아크코어',
    });
  }

  private pushNotice(input: NoticeInput): void {
    useTavernBoardStore.getState().pushNotice(input);
  }
}
