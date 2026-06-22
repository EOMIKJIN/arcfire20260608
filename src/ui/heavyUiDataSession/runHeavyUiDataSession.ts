import type {
  HeavyUiPreflightCode,
  HeavyUiRunResult,
  HeavyUiSessionConfig,
} from './types';

const DEFAULT_MIN_LOADING_MS = 180;

function normalizeBuildError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return 'build_failed';
}

export function normalizeHeavyUiPreflightMessage(code: HeavyUiPreflightCode): string {
  return code;
}

export async function runHeavyUiDataSession<TData>(
  config: HeavyUiSessionConfig<TData>,
  signal: { cancelled: boolean },
): Promise<HeavyUiRunResult<TData>> {
  const startedAt = Date.now();

  if (config.preflight) {
    const pf = await Promise.resolve(config.preflight());
    if (signal.cancelled) return { kind: 'cancelled' };
    if (!pf.ok) return { kind: 'preflight_failed', code: pf.code };
  }

  const steps = config.hydrateSteps ?? [];
  const pending = steps.filter((step) => !(step.isReady?.() ?? false));
  if (pending.length > 0) {
    await Promise.all(
      pending.map(async (step) => {
        await step.run();
      }),
    );
  }
  if (signal.cancelled) return { kind: 'cancelled' };

  let data: TData;
  try {
    data = await Promise.resolve(config.build());
  } catch (err) {
    return { kind: 'build_failed', error: normalizeBuildError(err) };
  }
  if (signal.cancelled) return { kind: 'cancelled' };

  const minMs = config.minLoadingMs ?? DEFAULT_MIN_LOADING_MS;
  const elapsed = Date.now() - startedAt;
  if (elapsed < minMs) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, minMs - elapsed);
    });
  }
  if (signal.cancelled) return { kind: 'cancelled' };

  return { kind: 'ready', data };
}

/** hydrate 없이 build만 — 스토어 revision 갱신용(비동기 build 미지원) */
export async function rebuildHeavyUiData<TData>(
  build: () => TData | Promise<TData>,
): Promise<TData> {
  return Promise.resolve(build());
}
