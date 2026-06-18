import React, { memo, useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import {
  PLANET_DEV_MODULE_ORBIT_SHIPYARD,
  buildOrbitShipyardDevSnapshot,
  installPlanetOrbitShipyard,
} from '../../../game/planetDevelopment/planetOrbitShipyardDevelopment';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

function InfoRow({ label, value }: { label: string; value: string }) {
  const PH = OVERLAY_TOKENS.phosphorAccent;
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: PH }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: PH }]}>{value}</Text>
    </View>
  );
}

export const PlanetOrbitShipyardDevContent = memo(function PlanetOrbitShipyardDevContent({
  planetId,
  planetName,
  isHomePlanet,
  onBack,
  onClose,
}: PlanetDevelopmentModuleContext) {
  const t = useT();
  // 설치 직후 리렌더 — 런타임 정본 변경 구독
  const shipyardRev = usePlanetCoreRuntimeStore(
    useCallback((s) => {
      const dev = s.byPlanetId[planetId]?.detail?.development?.byModuleId?.[PLANET_DEV_MODULE_ORBIT_SHIPYARD];
      return JSON.stringify(dev ?? null);
    }, [planetId]),
  );
  void shipyardRev;

  const snapshot = buildOrbitShipyardDevSnapshot(planetId);
  const PH = OVERLAY_TOKENS.phosphorAccent;

  const handlePressInstall = useCallback(() => {
    if (!isHomePlanet) {
      showArcAlert(t('orbitShipyard.homeOnlyTitle'), t('orbitShipyard.homeOnlyBody'));
      return;
    }
    showArcAlert(
      t('orbitShipyard.installTitle'),
      t('orbitShipyard.installBody', { cost: formatCredits(snapshot.installCost, { suffix: true }) }),
      [
        { text: t('orbitShipyard.cancel'), style: 'cancel' },
        {
          text: t('orbitShipyard.install'),
          onPress: () => {
            const res = installPlanetOrbitShipyard(planetId);
            if (!res.ok) showArcAlert(t('orbitShipyard.installFailTitle'), res.reason);
          },
        },
      ],
    );
  }, [isHomePlanet, planetId, snapshot.installCost, t]);

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: PH }]}>{t('orbitShipyard.title')}</Text>
      <Text style={[styles.subtitle, { color: PH }]}>{planetName}</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.section, { color: PH }]}>{t('orbitShipyard.status')}</Text>
        <InfoRow
          label={t('orbitShipyard.stateLabel')}
          value={
            snapshot.baseOperational
              ? t('orbitShipyard.stateBase')
              : snapshot.installedByDev
                ? t('orbitShipyard.stateInstalled')
                : t('orbitShipyard.stateNotInstalled')
          }
        />
        <Text style={[styles.hint, { color: PH }]}>
          {snapshot.baseOperational
            ? t('orbitShipyard.hintBase')
            : t('orbitShipyard.hintInstall')}
        </Text>
      </ScrollView>

      <View style={styles.btnCol}>
        {!snapshot.operational ? (
          <ArcButton
            label={t('orbitShipyard.installBtn', { cost: formatCredits(snapshot.installCost, { suffix: true }) })}
            variant="cta"
            disabled={!isHomePlanet || !snapshot.canInstall}
            onPress={handlePressInstall}
          />
        ) : (
          <Text style={[styles.hint, { color: PH }]}>{t('orbitShipyard.operationalHint')}</Text>
        )}
        <ArcButton label={t('orbitShipyard.backToList')} variant="secondary" onPress={onBack} />
        <ArcButton label={t('orbitShipyard.close')} variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
});
