import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PlanetHubFeatureMenuItem } from '../../systems/planetHub/planetHubFeatureSystems';
import { SPACING } from '../../utils/theme';
import { PlanetHubActionTile } from './PlanetHubActionTile';

type Props = {
  items: readonly PlanetHubFeatureMenuItem[];
};

export const PlanetHubFeatureMenuRow = memo(function PlanetHubFeatureMenuRow({ items }: Props) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.id} style={styles.slot}>
          <PlanetHubActionTile
            label={item.label}
            icon={item.icon}
            onPress={item.onPress}
            primary={item.primary}
            disabled={item.disabled}
            showBadge={item.showBadge}
          />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    columnGap: SPACING.sm,
  },
  slot: {
    flex: 1,
  },
});
