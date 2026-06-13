/**
 * 행성 허브 — 전투 스택 lazy 로드 셸(Phase 2).
 * `PlanetEdenRaidTestLayer`는 active=true 일 때만 dynamic import.
 */

import React, {
  memo,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';

type CombatBinderProps = {
  orbitSize: number;
  active: boolean;
  paused: boolean;
  combatPlanetId: string | null;
  combatSystemId: string | null;
  children: ReactNode;
};

type CombatHeavyModule = typeof import('../components/planet/PlanetEdenRaidTestLayer');

let combatHeavyPromise: Promise<CombatHeavyModule> | null = null;

function loadCombatHeavyModule(): Promise<CombatHeavyModule> {
  if (!combatHeavyPromise) {
    combatHeavyPromise = import('../components/planet/PlanetEdenRaidTestLayer');
  }
  return combatHeavyPromise;
}

export function preloadPlanetCapitalCombatModule(): void {
  void loadCombatHeavyModule();
}

export const PlanetCapitalCombatRoot = memo(function PlanetCapitalCombatRoot({
  orbitSize,
  active,
  paused,
  combatPlanetId,
  combatSystemId,
  children,
}: CombatBinderProps) {
  const [Binder, setBinder] = useState<ComponentType<CombatBinderProps> | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void loadCombatHeavyModule().then((mod) => {
      if (cancelled) return;
      setBinder(() => mod.PlanetEdenRaidSimBinder);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!active || !Binder) {
    return <>{children}</>;
  }

  return (
    <Binder
      orbitSize={orbitSize}
      active={active}
      paused={paused}
      combatPlanetId={combatPlanetId}
      combatSystemId={combatSystemId}
    >
      {children}
    </Binder>
  );
});

export type PlanetCapitalCombatHeavyUi = {
  CombatSimRefBridge: ComponentType<{
    targetRef: React.MutableRefObject<import('../combat/capitalRealtimeTypes').CapitalRealtimeCombatSim | null>;
  }>;
  PlanetCapitalCombatOrbitForegroundOverlay: ComponentType<{
    backgroundChrome: { paddingTop: number; paddingBottom: number };
    planetStageScale: number;
  }>;
  CapitalRealtimeCombatHudOverlay: ComponentType<object>;
  PlanetMainStanceRow: ComponentType<{ routeFocused: boolean; planetId: string | null }>;
};

let heavyUiPromise: Promise<PlanetCapitalCombatHeavyUi> | null = null;

export function loadPlanetCapitalCombatHeavyUi(): Promise<PlanetCapitalCombatHeavyUi> {
  if (!heavyUiPromise) {
    heavyUiPromise = import('./planetCapitalCombatHeavyUi').then((m) => ({
      CombatSimRefBridge: m.CombatSimRefBridge,
      PlanetCapitalCombatOrbitForegroundOverlay: m.PlanetCapitalCombatOrbitForegroundOverlay,
      CapitalRealtimeCombatHudOverlay: m.CapitalRealtimeCombatHudOverlay,
      PlanetMainStanceRow: m.PlanetMainStanceRow,
    }));
  }
  return heavyUiPromise;
}

/** active 전환 시 heavy UI 번들 선로드 */
export function PlanetCapitalCombatPreloader({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    void loadCombatHeavyModule();
    void loadPlanetCapitalCombatHeavyUi();
  }, [active]);
  return null;
}

type LazyHeavySlotProps = {
  active: boolean;
  render: (ui: PlanetCapitalCombatHeavyUi) => ReactNode;
};

export function PlanetCapitalCombatHeavySlot({ active, render }: LazyHeavySlotProps) {
  const [ui, setUi] = useState<PlanetCapitalCombatHeavyUi | null>(null);

  useEffect(() => {
    if (!active) {
      setUi(null);
      return;
    }
    let cancelled = false;
    void loadPlanetCapitalCombatHeavyUi().then((mod) => {
      if (!cancelled) setUi(mod);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!active || !ui) return null;
  return <>{render(ui)}</>;
}
