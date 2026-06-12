import { BaseArcSubCore } from './BaseArcSubCore';
import { dispatchArcCoreCommand } from '../ArcCoreCommandBus';
import {
  ARC_CORE_MESSAGE_DEFAULT_KO,
  ARC_CORE_MESSAGE_MISSILE_TRAVEL_MS,
  ARC_CORE_MESSAGE_WARNING_DURATION_SEC,
  ARC_CORE_MESSAGE_WARNING_LEAD_SEC,
} from '../message/arcCoreMessagePolicy';
import { ArcCoreMessageStrikeScheduleController } from '../message/arcCoreMessageStrikeScheduleController';
import { resolveArcCoreMessageTargetPlanetId } from '../message/resolveArcCoreMessageTargetPlanetId';

/**
 * 아크코어 메시지 서브코어 — 장거리 미사일(메시지 폭격) 스케줄.
 * 기본: 로컬 1일 12회 랜덤(`ArcCoreMessageDailyRandomStrikeScheduleProvider`).
 * 테스트: `ARC_CORE_MESSAGE_TEST_INTERVAL_STRIKES` — 60초 간격(`ArcCoreMessageIntervalTestStrikeScheduleProvider`).
 * 향후 `scheduleController.setProvider()` 로 전략 교체.
 */
export class ArcCoreMessageSubCore extends BaseArcSubCore {
  private readonly scheduleController = new ArcCoreMessageStrikeScheduleController();
  private lastScheduleTickMs = 0;

  constructor() {
    super('arc_core_message_subcore', 'Arc Core Message 서브코어', {
      onWallTick: () => this.onScheduleTick(),
    });
  }

  /** 전략 모듈이 스케줄 공급자를 바꿀 때 사용 */
  getStrikeScheduleController(): ArcCoreMessageStrikeScheduleController {
    return this.scheduleController;
  }

  private resolveTargetPlanetId(): string | null {
    return resolveArcCoreMessageTargetPlanetId();
  }

  private dispatchWarning(planetId: string): void {
    dispatchArcCoreCommand({
      type: 'arc_core_message_missile_warning',
      planetId,
      messageKo: ARC_CORE_MESSAGE_DEFAULT_KO,
      warningDurationSec: ARC_CORE_MESSAGE_WARNING_DURATION_SEC,
      strikeEtaSec: ARC_CORE_MESSAGE_WARNING_LEAD_SEC,
      meta: { origin: 'arc_core_policy', reason: 'arc_core_message_warning' },
    });
  }

  private dispatchInbound(planetId: string): void {
    dispatchArcCoreCommand({
      type: 'arc_core_message_missile_inbound',
      planetId,
      messageKo: ARC_CORE_MESSAGE_DEFAULT_KO,
      travelMs: ARC_CORE_MESSAGE_MISSILE_TRAVEL_MS,
      meta: { origin: 'arc_core_policy', reason: 'arc_core_message_inbound' },
    });
  }

  private onScheduleTick(): void {
    const nowMs = Date.now();
    // wall tick 이 초당 1회 미만일 수 있어 슬롯 누락 방지 — 최소 250ms 간격
    if (nowMs - this.lastScheduleTickMs < 250) return;
    this.lastScheduleTickMs = nowMs;

    this.scheduleController.tick(nowMs, {
      onWarning: () => {
        const planetId = this.resolveTargetPlanetId();
        if (!planetId) return false;
        this.dispatchWarning(planetId);
        return true;
      },
      onStrike: () => {
        const planetId = this.resolveTargetPlanetId();
        if (!planetId) return false;
        this.dispatchInbound(planetId);
        return true;
      },
    });
  }
}
