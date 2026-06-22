// ============================================================
// Heavy UI Data Session — 대용량 정보 UI 공통 로딩·검증 계약
// preflight → hydrate → build 3단계. 오버레이·스테이지 공용.
// ============================================================

export type HeavyUiLoadPhase =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error';

export type HeavyUiPreflightCode =
  | 'missing_planet_id'
  | 'unknown_planet'
  | 'player_not_loaded'
  | 'facility_not_installed';

export type HeavyUiPreflightResult =
  | { ok: true }
  | { ok: false; code: HeavyUiPreflightCode };

export type HeavyUiHydrateStep = {
  id: string;
  run: () => Promise<void>;
  /** true면 hydrate 스킵(O(1) 게이트) */
  isReady?: () => boolean;
};

export type HeavyUiSessionConfig<TData> = {
  /** 세션 식별 — planetId 등. 변경 시 전체 파이프라인 재실행 */
  sessionKey: string;
  preflight?: () => HeavyUiPreflightResult | Promise<HeavyUiPreflightResult>;
  hydrateSteps?: HeavyUiHydrateStep[];
  build: () => TData | Promise<TData>;
  /** 로딩 UI 최소 표시(ms) — 깜빡임 방지 */
  minLoadingMs?: number;
};

export type HeavyUiSessionState<TData> = {
  phase: HeavyUiLoadPhase;
  data: TData | null;
  /** build 단계 예외 메시지 */
  error: string | null;
  /** preflight 실패 코드 */
  preflightCode: HeavyUiPreflightCode | null;
  retry: () => void;
};

export type HeavyUiRunResult<TData> =
  | { kind: 'ready'; data: TData }
  | { kind: 'preflight_failed'; code: HeavyUiPreflightCode }
  | { kind: 'build_failed'; error: string }
  | { kind: 'cancelled' };
