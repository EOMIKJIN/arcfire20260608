import React, { memo, useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { listPlanetDevelopmentCatalogRows } from '../../../game/planetDevelopment/planetDevelopmentCatalog';
import { buildOrbitShipyardDevSnapshot } from '../../../game/planetDevelopment/planetOrbitShipyardDevelopment';
import { buildDefenseSatelliteDevSnapshot } from '../../../systems/planetaryDefense/planetDefenseSatelliteDevelopment';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

type Props = {
  planetId: string;
  planetName: string;
  credits: number;
  isHomePlanet: boolean;
  onSelectModule: (moduleId: string) => void;
  onClose: () => void;
};

export const PlanetDevelopmentListContent = memo(function PlanetDevelopmentListContent({
  planetId,
  planetName,
  credits,
  isHomePlanet,
  onSelectModule,
  onClose,
}: Props) {
  const t = useT();
  const PH = OVERLAY_TOKENS.phosphorAccent;
  const catalogRows = listPlanetDevelopmentCatalogRows();
  const defenseSnapshot = buildDefenseSatelliteDevSnapshot(planetId);
  const shipyardSnapshot = buildOrbitShipyardDevSnapshot(planetId);

  const resolveLabel = useCallback((row: { id: string; labelKo: string }) => {
    const key = `planetDev.label.${row.id}`;
    const val = t(key);
    return val === key ? row.labelKo : val;
  }, [t]);
  const resolveSummary = useCallback((row: { id: string; summaryKo: string }) => {
    const key = `planetDev.summary.${row.id}`;
    const val = t(key);
    return val === key ? row.summaryKo : val;
  }, [t]);

  const handlePressRow = useCallback((id: string, enabled: boolean, label: string) => {
    if (enabled) {
      onSelectModule(id);
      return;
    }
    showArcAlert(t('planetDev.comingSoonTitle'), t('planetDev.comingSoonBody', { label }));
  }, [onSelectModule, t]);

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: PH }]}>{t('planetDev.title')}</Text>
      <Text style={[styles.subtitle, { color: PH }]}>
        {t('planetDev.subtitle', { name: planetName, credits: formatCredits(credits, { suffix: true }) })}
      </Text>
      {!isHomePlanet ? (
        <Text style={[styles.hint, { color: PH }]}>
          {t('planetDev.notHomeHint')}
        </Text>
      ) : null}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {catalogRows.map((row) => {
          const isDefense = row.id === 'defense_satellite';
          const isShipyard = row.id === 'dev_orbit_shipyard';
          const meta = isDefense
            ? (defenseSnapshot.installed
              ? t('planetDev.defenseInstalled', { level: defenseSnapshot.level, count: defenseSnapshot.activeSatelliteCount })
              : t('planetDev.notInstalledTap'))
              + (defenseSnapshot.isUpgrading ? t('planetDev.upgrading') : '')
            : isShipyard
              ? (shipyardSnapshot.operational
                ? (shipyardSnapshot.baseOperational ? t('planetDev.shipyardBase') : t('planetDev.shipyardInstalled'))
                : t('planetDev.notInstalledTap'))
              : t('planetDev.summaryComingSoon', { summary: resolveSummary(row) });
          return (
            <Pressable
              key={row.id}
              style={({ pressed }) => [
                styles.listItem,
                !row.enabled && styles.listItemDisabled,
                pressed && styles.listItemPressed,
              ]}
              onPress={() => handlePressRow(row.id, row.enabled, resolveLabel(row))}
            >
              <Text
                style={[
                  styles.listItemTitle,
                  !row.enabled && styles.listItemTitleDisabled,
                  { color: PH },
                ]}
              >
                {isDefense && defenseSnapshot.installed ? '🛰 ' : ''}
                {isShipyard && shipyardSnapshot.operational ? '⚓ ' : ''}
                {resolveLabel(row)}
              </Text>
              <Text style={[styles.listItemMeta, { color: PH }]}>{meta}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.btnRow}>
        <ArcButton label={t('planetDev.close')} variant="primary" onPress={onClose} />
      </View>
    </View>
  );
});
