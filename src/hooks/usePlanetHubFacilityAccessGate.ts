// ============================================================
// 허브 시설 SUB-STAGE 진입 게이트 — 행성개발 Lv1 미설치 시 pop + 안내
// ============================================================

import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useT } from '../i18n';
import { usePlayerStore } from '../store/playerStore';
import { usePlanetCoreRuntimeStore } from '../store/planetCoreRuntimeStore';
import { useSafeRouterBack } from '../navigation/useSafeRouterBack';
import { showArcAlert } from '../utils/showArcAlert';
import {
  isPlanetHubResearchLabEnabled,
  isPlanetHubShipyardEnabled,
  isPlanetHubTavernEnabled,
  isPlanetHubTradePortEnabled,
} from '../game/planetDevelopment/planetHubFacilityGates';

export type PlanetHubFacilityGateKind = 'shipyard' | 'trade' | 'tavern' | 'research_lab';

const GATE_CHECKERS: Record<PlanetHubFacilityGateKind, (planetId: string) => boolean> = {
  shipyard: isPlanetHubShipyardEnabled,
  trade: isPlanetHubTradePortEnabled,
  tavern: isPlanetHubTavernEnabled,
  research_lab: isPlanetHubResearchLabEnabled,
};

/**
 * SUB-STAGE(조선소·무역소·선술집·연구소) 포커스 시 설치 여부 검사.
 * 미설치면 안내 후 planet 허브로 pop.
 */
export function usePlanetHubFacilityAccessGate(kind: PlanetHubFacilityGateKind): void {
  const t = useT();
  const player = usePlayerStore((s) => s.player);
  const planetId = player?.currentPlanetId ?? null;
  const safeBack = useSafeRouterBack();

  const devRev = usePlanetCoreRuntimeStore((s) => {
    if (!planetId) return '';
    return JSON.stringify(s.byPlanetId[planetId]?.detail?.development?.byModuleId ?? null);
  });

  useFocusEffect(
    useCallback(() => {
      if (!planetId) {
        safeBack();
        return undefined;
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { migrateLegacyPlanetDevModulesForPlanet } = require('../game/planetDevelopment/planetFacilityLegacyMigration') as typeof import('../game/planetDevelopment/planetFacilityLegacyMigration');
      migrateLegacyPlanetDevModulesForPlanet(planetId);
      const enabled = GATE_CHECKERS[kind](planetId);
      if (enabled) return undefined;

      showArcAlert(
        t('hubFacilityGate.title'),
        t(`hubFacilityGate.${kind}`),
        [{ text: t('hubFacilityGate.ok'), onPress: () => safeBack() }],
      );
      safeBack();
      return undefined;
    }, [devRev, kind, planetId, safeBack, t]),
  );
}
