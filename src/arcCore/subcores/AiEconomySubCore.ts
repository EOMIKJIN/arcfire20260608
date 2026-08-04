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
import { resyncAllCoreOpenTradePortCatalogs } from '../balance/tradePortCatalogPolicy';
import { integrateUnlockedSynthFrontierStatEconomyAsync } from '../planetCore/integrateUnlockedSynthFrontierStatEconomy';
import { rehydrateSynthFrontierConvoyTradeFromInstalledPorts } from '../economy/synthFrontierConvoyTradeBridge';
import { settleArcTransportDwellTrade } from '../economy/runArcTransportTradePass';
import { useEconomyPriceOverlayStore } from '../economy/economyPriceOverlayStore';
import { migrateLegacyArcCoreTempBankOnce } from '../economy/migrateLegacyTempBank';
import { reseedCorruptConvoyFleetEconomyOnce } from '../economy/reseedArcCoreConvoyFleetBank';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import { useNeutralNationVaultStore } from '../../store/factionVault/neutralNationVaultStore';
import { usePlayerIndependentNationVaultStore } from '../../store/factionVault/playerIndependentNationVaultStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import { useWorldStore } from '../../store/worldStore';

/**
 * 경제 서브코어 — 무역소 런타임 진열·오버레이의 단일 실행 주체.
 * - `01_레벨업구조` 시나리오: `runPlayScenarioEconomyPass` → 무역소 카탈로그·경제 메타
 * - 상위는 `economy_trade_port_bulk` 또는 `dispatchEconomyTradePortBulk` 만 발행.
 */
/**
 * __DEV__ bulk 커맨드 로그 합산 — 전행성 무역소 카탈로그 resync 등은 행성마다 별도
 * `economy_trade_port_bulk` 커맨드(planets=1)를 발행해, 예전엔 최대 757줄까지 콘솔에
 * 찍혔다(대표님 logcat 확인). 같은 (action,origin,reason) 조합은 짧은 창(0ms) 안에서
 * 합산해 1줄만 찍는다 — 커맨드 처리·상태 반영 자체는 완전히 그대로(로그 표현만 압축).
 * 2026-08-04 대표님 지시 · 김팀장 Wave R2.
 */
const devBulkLogAggregate = new Map<
  string,
  { action: string; origin: string; reason: string; calls: number; planets: number; items: number }
>();
let devBulkLogFlushScheduled = false;

function scheduleDevBulkLogFlush(): void {
  if (devBulkLogFlushScheduled) return;
  devBulkLogFlushScheduled = true;
  setTimeout(() => {
    devBulkLogFlushScheduled = false;
    for (const agg of devBulkLogAggregate.values()) {
      if (agg.calls <= 1) {
        console.log(
          `[ArcCore/Economy] bulk ${agg.action} planets=${agg.planets} items=${agg.items} origin=${agg.origin}`,
          agg.reason,
        );
      } else {
        console.log(
          `[ArcCore/Economy] bulk ${agg.action} x${agg.calls} calls(합산) planets=${agg.planets} origin=${agg.origin}`,
          agg.reason,
        );
      }
    }
    devBulkLogAggregate.clear();
  }, 0);
}

export class AiEconomySubCore extends BaseArcSubCore {
  private unsubCommands: (() => void) | null = null;

  constructor() {
    super('economy_subcore', '플루토스 · 무역소·경제');
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
          // [5축] task_id=economy-vault-5axis-upgrade-20260804
          await useNeutralNationVaultStore.getState().hydrate();
          await usePlayerIndependentNationVaultStore.getState().hydrate();
          await usePlanetTradeFeeLedgerStore.getState().hydrate();
          await reseedCorruptConvoyFleetEconomyOnce();
          await useEconomyPriceOverlayStore.getState().loadAsync();
          await integrateUnlockedSynthFrontierStatEconomyAsync();
          rehydrateSynthFrontierConvoyTradeFromInstalledPorts();
          if (useWorldStore.getState().loaded) {
            resyncAllCoreOpenTradePortCatalogs();
          }
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
      // 커맨드 핸들러 자체는 sync 계약 유지 — 내부 hydrate await는 settleArcTransportDwellTrade가 보장.
      void settleArcTransportDwellTrade(cmd.shipId, cmd.planetId);
      return;
    }
    if (cmd.type !== 'economy_trade_port_bulk') return;
    const planetIds = this.resolveTargetPlanetIds(cmd.scope, cmd.action);
    if (planetIds.length === 0) return;

    if (__DEV__) {
      const origin = cmd.meta?.origin ?? '?';
      const reason = cmd.meta?.reason ?? '';
      const key = `${cmd.action}|${origin}|${reason}`;
      const agg = devBulkLogAggregate.get(key);
      if (agg) {
        agg.calls += 1;
        agg.planets += planetIds.length;
        agg.items = cmd.itemIds.length;
      } else {
        devBulkLogAggregate.set(key, {
          action: cmd.action,
          origin,
          reason,
          calls: 1,
          planets: planetIds.length,
          items: cmd.itemIds.length,
        });
      }
      scheduleDevBulkLogFlush();
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