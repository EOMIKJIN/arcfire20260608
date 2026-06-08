import { BaseArcSubCore } from './BaseArcSubCore';
import {
  subscribeArcCoreCommands,
  type ArcCoreCommand,
  type EconomyTradePortBulkScope,
} from '../ArcCoreCommandBus';
import {
  addTradePortItem,
  getPlanetRecord,
  listPlanetIdsWithTradePort,
  removeTradePortItem,
  resetTradePortItemOverrides,
} from '../../world/planetTradePortDb';

/**
 * 경제 서브코어 — 무역소 런타임 진열·오버레이의 단일 실행 주체.
 * - 상위(관리자·정책·허브)는 `economy_trade_port_bulk` 또는 `dispatchEconomyTradePortBulk` 만 발행.
 * - 실제 행성별 분배·적용은 이 클래스가 `planetTradePortDb` 에 위임한다.
 */
export class AiEconomySubCore extends BaseArcSubCore {
  private unsubCommands: (() => void) | null = null;

  constructor() {
    super('economy_subcore', '경제 (무역소)');
  }

  override onBoot(): void {
    this.unsubCommands = subscribeArcCoreCommands((cmd) => this.onArcCoreCommand(cmd));
  }

  override onShutdown(): void {
    this.unsubCommands?.();
    this.unsubCommands = null;
  }

  private onArcCoreCommand(cmd: ArcCoreCommand): void {
    if (cmd.type !== 'economy_trade_port_bulk') return;
    const planetIds = this.resolveTargetPlanetIds(cmd.scope);
    if (planetIds.length === 0) return;

    if (__DEV__) {
      console.log(
        `[ArcCore/Economy] bulk ${cmd.action} planets=${planetIds.length} items=${cmd.itemIds.length} origin=${cmd.meta?.origin ?? '?'}`,
        cmd.meta?.reason ?? '',
      );
    }

    if (cmd.action === 'reset_overrides') {
      for (const planetId of planetIds) {
        resetTradePortItemOverrides(planetId);
      }
      return;
    }
    if (cmd.action === 'add_items') {
      for (const planetId of planetIds) {
        for (const itemId of cmd.itemIds) {
          addTradePortItem(planetId, itemId);
        }
      }
      return;
    }
    for (const planetId of planetIds) {
      for (const itemId of cmd.itemIds) {
        removeTradePortItem(planetId, itemId);
      }
    }
  }

  private resolveTargetPlanetIds(scope: EconomyTradePortBulkScope): string[] {
    if (scope.kind === 'all_trade_ports') {
      return listPlanetIdsWithTradePort();
    }
    const out: string[] = [];
    for (const id of scope.planetIds) {
      const p = getPlanetRecord(id);
      if (p?.hasTradePort) out.push(id);
    }
    return out;
  }
}
