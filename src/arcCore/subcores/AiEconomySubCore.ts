import { InteractionManager } from 'react-native';
import { BaseArcSubCore } from './BaseArcSubCore';
import {
  subscribeArcCoreCommands,
  type ArcCoreCommand,
  type EconomyTradePortBulkScope,
} from '../ArcCoreCommandBus';
import {
  addTradePortItem,
  listPlanetIdsWithTradePort,
  removeTradePortItem,
  replaceTradePortCatalog,
  resetTradePortItemOverrides,
} from '../../world/planetTradePortDb';
import type { EconomyTradePortBulkAction } from '../ArcCoreCommandBus';
import { runPlayScenarioEconomyPass } from '../balance/runPlayScenarioEconomyPass';
import { integrateUnlockedSynthFrontierStatEconomyAsync } from '../planetCore/integrateUnlockedSynthFrontierStatEconomy';
import { rehydrateSynthFrontierConvoyTradeFromInstalledPorts } from '../economy/synthFrontierConvoyTradeBridge';
import { settleArcTransportDwellTrade } from '../economy/runArcTransportTradePass';
import { useEconomyPriceOverlayStore } from '../economy/economyPriceOverlayStore';
import { migrateLegacyArcCoreTempBankOnce } from '../economy/migrateLegacyTempBank';
import { reseedCorruptConvoyFleetEconomyOnce } from '../economy/reseedArcCoreConvoyFleetBank';
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
    // 명령 구독은 즉시(경량) — 부트 프레임 영향 없음.
    this.unsubCommands = subscribeArcCoreCommands((cmd) => this.onArcCoreCommand(cmd));
    // 무역소 카탈로그 강제 재빌드 등 무거운 경제 부팅 패스는 첫 렌더 이후로 분리한다.
    InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          await migrateLegacyArcCoreTempBankOnce();
          await useArcCoreTransportFleetBankStore.getState().hydrate();
          await useArcCoreVaultStore.getState().hydrate();
          await useBlueTeamSharedVaultStore.getState().hydrate();
          await usePlanetTradeFeeLedgerStore.getState().hydrate();
          await reseedCorruptConvoyFleetEconomyOnce();
          await useEconomyPriceOverlayStore.getState().loadAsync();
          await integrateUnlockedSynthFrontierStatEconomyAsync();
          rehydrateSynthFrontierConvoyTradeFromInstalledPorts();
          runPlayScenarioEconomyPass(false, { skipCatalog: true });
        } catch (err) {
          if (__DEV__) {
            console.warn('[ArcCore/Economy] deferred boot chain failed', err);
          }
        }
      })();
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
    const planetIds = this.resolveTargetPlanetIds(cmd.scope, cmd.action);
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

  private resolveTargetPlanetIds(
    scope: EconomyTradePortBulkScope,
    action?: EconomyTradePortBulkAction,
  ): string[] {
    if (scope.kind === 'all_trade_ports') {
      return listPlanetIdsWithTradePort();
    }
    if (scope.kind === 'planet_ids' && action === 'set_catalog') {
      // 정책·개방 연동이 명시한 행성 — listPlanetIdsWithTradePort 선행 필터로 synth 카탈로그가
      // 조용히 drop 되는 회귀 방지(B→A 코어개방 synth 포함).
      return scope.planetIds.map((id) => String(id ?? '').trim()).filter(Boolean);
    }
    const active = new Set(listPlanetIdsWithTradePort());
    const out: string[] = [];
    for (const id of scope.planetIds) {
      if (active.has(id)) out.push(id);
    }
    return out;
  }
}