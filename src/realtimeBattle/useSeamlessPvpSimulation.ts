import { useEffect, useMemo, useRef, useState } from 'react';
import { createMockSeamlessUsers } from './mockSeamlessPvpUsers';
import { tickSeamlessBattle } from './seamlessPvpEngine';
import type { FirestoreUserDocMock, SeamlessCombatantRuntime, Vec2 } from './seamlessPvpTypes';

type Options = {
  enabled: boolean;
  planetPos: Vec2;
  isLowSpec: boolean;
  /** local mock users를 외부에서 주입하지 않으면 기본 20명 생성 */
  initialUsers?: FirestoreUserDocMock[];
};

/**
 * 시작/종료 없는 난입형 루프용 로컬 시뮬 훅.
 * Firebase 실연동 전, Firestore users/{uid} 스키마를 모사해 전투 흐름만 검증한다.
 */
export function useSeamlessPvpSimulation(options: Options) {
  const [users, setUsers] = useState<FirestoreUserDocMock[]>(() =>
    options.initialUsers ? options.initialUsers.map(u => ({ ...u, position: { ...u.position } })) : createMockSeamlessUsers(20),
  );
  const [activeCombatants, setActiveCombatants] = useState<string[]>([]);
  const runtimesRef = useRef<Record<string, SeamlessCombatantRuntime>>({});
  const activeCombatantsRef = useRef<string[]>([]);
  const optionsRef = useRef(options);
  const [targetScanIntervalMs, setTargetScanIntervalMs] = useState(500);
  const [particleScale, setParticleScale] = useState(1);

  useEffect(() => {
    activeCombatantsRef.current = activeCombatants;
  }, [activeCombatants]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (options.enabled) return;
    // 비활성 구간에는 전투 런타임 버퍼를 즉시 비워 장시간 세션 누적을 막는다.
    runtimesRef.current = {};
    activeCombatantsRef.current = [];
    setActiveCombatants([]);
  }, [options.enabled]);

  useEffect(() => {
    if (!options.enabled) return;
    let alive = true;
    let raf = 0;
    const loop = () => {
      if (!alive) return;
      const opts = optionsRef.current;
      if (!opts.enabled) return;
      const now = Date.now();
      setUsers(prevUsers => {
        const out = tickSeamlessBattle({
          users: prevUsers,
          activeCombatants: activeCombatantsRef.current,
          runtimes: runtimesRef.current,
          planetPos: opts.planetPos,
          nowMs: now,
          isLowSpec: opts.isLowSpec,
        });
        setActiveCombatants(out.activeCombatants);
        runtimesRef.current = out.runtimes;
        setTargetScanIntervalMs(out.performance.targetScanIntervalMs);
        setParticleScale(out.performance.particleScale);
        return out.users;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [options.enabled]);

  const combatants = useMemo(
    () => activeCombatants.map(uid => runtimesRef.current[uid]).filter(Boolean),
    [activeCombatants],
  );

  return {
    users,
    setUsers,
    activeCombatants,
    combatants,
    runtimesRef,
    targetScanIntervalMs,
    particleScale,
  };
}
