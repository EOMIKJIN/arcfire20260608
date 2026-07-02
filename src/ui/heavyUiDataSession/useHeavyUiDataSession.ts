import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { runHeavyUiDataSession } from './runHeavyUiDataSession';
import { registerHeavyUiSessionAbort } from './heavyUiSessionLifecycle';
import type { HeavyUiLoadPhase, HeavyUiPreflightCode, HeavyUiSessionConfig, HeavyUiSessionState } from './types';

export function useHeavyUiDataSession<TData>(
  config: HeavyUiSessionConfig<TData> | null,
  /** ready 이후 build-only 재실행 트리거(스토어 구독 revision 등) */
  revision?: unknown,
): HeavyUiSessionState<TData> {
  const [phase, setPhase] = useState<HeavyUiLoadPhase>('idle');
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preflightCode, setPreflightCode] = useState<HeavyUiPreflightCode | null>(null);
  const [attempt, setAttempt] = useState(0);

  const pipelineDoneRef = useRef(false);
  const configRef = useRef(config);
  // 렌더 중 ref.current 할당 — Freeze/Hermes에서 read-only TypeError (worldmap 진입 크래시)
  useLayoutEffect(() => {
    configRef.current = config;
  }, [config]);

  const retry = useCallback(() => {
    pipelineDoneRef.current = false;
    setAttempt((v) => v + 1);
  }, []);

  const sessionKey = config?.sessionKey ?? null;

  useEffect(() => {
    if (!config) {
      pipelineDoneRef.current = false;
      setPhase('idle');
      setData(null);
      setError(null);
      setPreflightCode(null);
      return;
    }

    pipelineDoneRef.current = false;
    const signal = { cancelled: false };
    const abortSession = () => {
      signal.cancelled = true;
      pipelineDoneRef.current = false;
      setData(null);
      setError(null);
      setPreflightCode(null);
      setAttempt((v) => v + 1);
    };
    const unregisterAbort = registerHeavyUiSessionAbort(config.sessionKey, abortSession);
    setPhase('loading');
    setError(null);
    setPreflightCode(null);
    setData(null);

    void runHeavyUiDataSession(config, signal)
      .then((result) => {
        if (signal.cancelled) return;
        if (result.kind === 'preflight_failed') {
          pipelineDoneRef.current = false;
          setPreflightCode(result.code);
          setPhase('error');
          return;
        }
        if (result.kind === 'build_failed') {
          pipelineDoneRef.current = false;
          setError(result.error);
          setPhase('error');
          return;
        }
        if (result.kind === 'cancelled') return;
        pipelineDoneRef.current = true;
        setData(result.data);
        setPhase('ready');
      })
      .catch((err) => {
        if (signal.cancelled) return;
        pipelineDoneRef.current = false;
        setError(err instanceof Error ? err.message : 'session_failed');
        setPhase('error');
      });

    return () => {
      signal.cancelled = true;
      unregisterAbort();
    };
  }, [sessionKey, attempt]);

  useEffect(() => {
    if (!configRef.current || phase !== 'ready' || !pipelineDoneRef.current) return;
    if (revision === undefined) return;
    let cancelled = false;
    void Promise.resolve(configRef.current.build())
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'build_failed');
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [revision, phase]);

  return useMemo(
    () => ({
      phase,
      data,
      error,
      preflightCode,
      retry,
    }),
    [phase, data, error, preflightCode, retry],
  );
}
