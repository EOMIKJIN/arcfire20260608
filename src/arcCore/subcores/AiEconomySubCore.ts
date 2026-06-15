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
  replaceTradePortCatalog,
  resetTradePortItemOverrides,
} from '../../world/planetTradePortDb';
import { runPlayScenarioEconomyPass } from '../balance/runPlayScenarioEconomyPass';
import { settleArcTransportDwellTrade } from '../economy/runArcTransportTradePass';
import { useEconomyPriceOverlayStore } from '../economy/economyPriceOverlayStore';
import { migrateLegacyArcCoreTempBankOnce } from '../economy/migrateLegacyTempBank';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';

/**
 * 경제 서브코어 — 무역소 런타임 진열·오버레이의 단일 실행 주체.
 * - `01_레벨업구조` 시나리오: `runPlayScenarioEconomyPass` → 무역소 카탈로그·경제 메타
 * - 상위는 `economy_trade_port_bulk` 또는 `dispatchEconomyTradePortBulk` 만 발행.
 */
export class AiEconomySubCore extends BaseArcSubCore {
  private unsubCommands: (() => void) | null = null;

  constructor() {
    super('economy_subcore', '경제 (무역소)');
  }

  override onBoot(): void {
    this.unsubCommands = subscribeArcCoreCommands((cmd) => this.onArcCoreCommand(cmd));
    void migrateLegacyArcCoreTempBankOnce().then(() => {
      void useArcCoreTransportFleetBankStore.getState().hydrate().then(() => {
        void useArcCoreVaultStore.getState().hydrate().then(() => {
          void useBlueTeamSharedVaultStore.getState().hydrate().then(() => {
            void usePlanetTradeFeeLedgerStore.getState().hydrate().then(() => {
              void useEconomyPriceOverlayStore.getState().loadAsync().then(() => {
                runPlayScenarioEconomyPass(true);
              });
            });
          });
        });
      });
    });
  }

  override onShutdown(): void {
    this.unsubCommands?.();
    this.unsubCommands = null;
  }

  private onArcCoreCommand(cmd: ArcCoreCommand): void {
    if (cmd.type === 'economy_transport_dwell_settled') {
      settleArcTransportDwellTrade(cmd.shipId, cmd.planetId);
      return;
    }
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
    if (cmd.action === 'set_catalog') {
      for (const planetId of planetIds) {
        replaceTradePortCatalog(planetId, cmd.itemIds);
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