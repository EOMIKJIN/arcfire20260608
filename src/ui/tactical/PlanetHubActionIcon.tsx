import React, { memo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { PlanetHubActionIconSpec } from './planetHubActionIcons';

type Props = {
  spec: PlanetHubActionIconSpec;
  size: number;
  color: string;
};

export const PlanetHubActionIcon = memo(function PlanetHubActionIcon({ spec, size, color }: Props) {
  if (spec.family === 'material-community') {
    return <MaterialCommunityIcons name={spec.name} size={size} color={color} />;
  }
  return <Ionicons name={spec.name} size={size} color={color} />;
});
