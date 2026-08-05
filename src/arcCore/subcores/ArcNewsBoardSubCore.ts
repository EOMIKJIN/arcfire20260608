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
  /** Locale-neutral fallback (EN) — UI prefers i18nKey via noticeText */
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
    super('arc_news_board_subcore', 'Iris · Notice Board');
    this.registerTimedMission({
      id: 'arc_news_world_summary',
      name: 'ArcCore world summary briefing',
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
      title: 'ArcCore Notice Board Synced',
      body: 'Collecting world expansion, convoy, and economy directive events in real time.',
      tag: 'arccore',
      dedupeKey: 'arc_news_boot_notice',
    });
  }

  private onArcCoreCommand(cmd: ArcCoreCommand): void {
    if (cmd.type === 'world_system_unlocked') {
      this.pushNotice({
        i18nKey: 'news.worldUnlock',
        i18nParams: { systemName: cmd.systemName, systemId: cmd.systemId },
        title: `System Unlocked: ${cmd.systemName}`,
        body: `ArcCore has opened the ${cmd.systemName} system. (${cmd.systemId})`,
        tag: 'ops',
        dedupeKey: `world_unlock_${cmd.systemId}`,
      });
      return;
    }
    if (cmd.type === 'npc_seed_transport_for_system') {
      const dayKey = new Date().toISOString().slice(0, 10);
      this.pushNotice({
        i18nKey: 'news.transport',
        i18nParams: { factionId: cmd.factionId },
        title: 'Convoy Dispatch Report',
        body: `A ${cmd.factionId} convoy dispatch was detected. Detailed logs continue to aggregate in ArcCore.`,
        tag: 'diplomacy',
        dedupeKey: `${TRANSPORT_NOTICE_DEDUPE_PREFIX}${dayKey}`,
      });
      return;
    }
    if (cmd.type === 'economy_trade_port_bulk') {
      const scopeLabel =
        cmd.scope.kind === 'all_trade_ports'
          ? 'All trade ports'
          : `${cmd.scope.planetIds.length} planet trade ports`;
      this.pushNotice({
        i18nKey: 'news.economyBulk',
        i18nParams: {
          scopeKind: cmd.scope.kind === 'all_trade_ports' ? 'all' : 'planets',
          planetCount: cmd.scope.kind === 'all_trade_ports' ? 0 : cmd.scope.planetIds.length,
          action: cmd.action,
        },
        title: `Economy Directive Applied: ${scopeLabel}`,
        body: `ArcCore economy subcore applied the ${cmd.action} policy.`,
        tag: 'economy',
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
      title: 'ArcCore Routine Briefing',
      body: `Systems unlocked ${unlocked}/${total}, active convoys ${traffic} ships.`,
      tag: 'arccore',
    });
  }

  private pushNotice(input: NoticeInput): void {
    useTavernBoardStore.getState().pushNotice(input);
  }
}
