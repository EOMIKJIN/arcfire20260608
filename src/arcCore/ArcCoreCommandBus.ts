import type { ArcCoreInboundTrajectoryPattern } from './message/arcCoreInboundTrajectoryPattern';

// ============================================================
// 아크코어 런타임 명령 — 리빌드 없이 JS 번들만 갱신되면 즉시 반영
// 구독자(서브코어 등)는 `subscribeArcCoreCommands` 로 등록
//
// 현재: 개발용 브리지·수동 테스트가 `dispatchArcCoreCommand` 로 내림.
// 경제: `economy_trade_port_bulk` → `AiEconomySubCore` 가 행성별 무역소 오버레이에 분배·적용.
// 향후: 벽시계 틱·월드 상태를 읽는 **자율 정책/판단 프로세스**(Arc 코어 내부)가
//       동일 API로 명령을 발행해 서브코어를 조율하는 **자율형 의사결정**으로 확장한다.
//       출처 구분은 `meta.origin` (선택).
// ============================================================

/** 명령을 누가 올렸는지 — 정책 엔진·테스트·외부 권한 등 추적·분기용 */
export type ArcCoreCommandOrigin =
  | 'dev_runtime_bridge'
  | 'manual_debug'
  /** 아크코어 내부 판단 프로세스(예: 집결·해산·교전 지시) — 향후 구현 */
  | 'arc_core_policy'
  /** 관리자 일괄 지시(무역소·경제 도메인 등) — `economy_trade_port_bulk` */
  | 'admin_bulk';

export type ArcCoreCommandMeta = {
  origin?: ArcCoreCommandOrigin;
  /** 정책·리플레이용 짧은 메모 */
  reason?: string;
  /** 월드 개방 단계(기존/확장) */
  unlockTier?: 'base' | 'legacy_unexplored' | 'expansion_undiscovered';
};

/** 경제 서브코어 — 무역소 런타임 진열 일괄 조정 */
export type EconomyTradePortBulkScope =
  | { kind: 'all_trade_ports' }
  | { kind: 'planet_ids'; planetIds: readonly string[] };

export type EconomyTradePortBulkAction =
  | 'add_items'
  | 'remove_items'
  | 'reset_overrides'
  | 'set_catalog';

export type ArcCoreCommand =
  | { type: 'npc_gather_planet'; planetId: string; meta?: ArcCoreCommandMeta }
  | { type: 'npc_release_gather'; meta?: ArcCoreCommandMeta }
  | {
      type: 'world_system_unlocked';
      systemId: string;
      systemName: string;
      source: 'arc_core_daily' | 'arc_core_legacy_seed' | 'manual';
      meta?: ArcCoreCommandMeta;
    }
  | {
      type: 'npc_seed_transport_for_system';
      systemId: string;
      sourcePlanetId: string;
      factionId: string;
      meta?: ArcCoreCommandMeta;
    }
  | {
      type: 'economy_trade_port_bulk';
      action: EconomyTradePortBulkAction;
      scope: EconomyTradePortBulkScope;
      /** `add_items` / `remove_items` 에만 사용. `reset_overrides` 에서는 무시 */
      itemIds: readonly string[];
      meta?: ArcCoreCommandMeta;
    }
  | {
      type: 'economy_transport_dwell_settled';
      shipId: string;
      planetId: string;
      meta?: ArcCoreCommandMeta;
    }
  /** 아크코어 메시지 — 장거리 미사일 경고(공격 2분 전) */
  | {
      type: 'arc_core_message_missile_warning';
      planetId: string;
      messageKo: string;
      warningDurationSec: number;
      strikeEtaSec: number;
      meta?: ArcCoreCommandMeta;
    }
  /** 아크코어 메시지 — 장거리 미사일 궤도 통과(비명중) */
  | {
      type: 'arc_core_message_missile_inbound';
      planetId: string;
      messageKo: string;
      travelMs: number;
      /** 미지정 시 베지어 기하로 선판정(top_miss|center_strike|bottom_miss) */
      trajectoryPattern?: ArcCoreInboundTrajectoryPattern;
      meta?: ArcCoreCommandMeta;
    }
  /** 아크코어 메시지 — 근접 비명중 완료(행성 파라미터 패스 트리거) */
  | {
      type: 'arc_core_message_missile_near_miss';
      planetId: string;
      messageKo: string;
      defenseLevel?: number;
      interceptChancePct?: number;
      interceptRollFailed?: boolean;
      meta?: ArcCoreCommandMeta;
    }
  /** 아크코어 메시지 — 방위위성 요격 성공 */
  | {
      type: 'arc_core_message_missile_intercepted';
      planetId: string;
      messageKo: string;
      weaponId?: string;
      satelliteCount?: number;
      defenseLevel?: number;
      interceptChancePct?: number;
      meta?: ArcCoreCommandMeta;
    };

/**
 * 관리자·상위 정책에서 무역소 오버레이를 일괄 적용할 때 사용.
 * 실제 분배·실행은 `AiEconomySubCore`가 담당한다.
 */
export function dispatchEconomyTradePortBulk(input: {
  action: EconomyTradePortBulkAction;
  scope: EconomyTradePortBulkScope;
  itemIds?: readonly string[];
  meta?: ArcCoreCommandMeta;
}): void {
  const itemIds = input.itemIds ?? [];
  dispatchArcCoreCommand({
    type: 'economy_trade_port_bulk',
    action: input.action,
    scope: input.scope,
    itemIds,
    meta: {
      ...input.meta,
      origin: input.meta?.origin ?? 'admin_bulk',
    },
  });
}

type Listener = (command: ArcCoreCommand) => void;

const listeners = new Set<Listener>();

export function subscribeArcCoreCommands(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 동기 분배 — 벽시계 틱과 독립, 즉시 실행 */
export function dispatchArcCoreCommand(command: ArcCoreCommand): void {
  for (const l of listeners) {
    l(command);
  }
}
