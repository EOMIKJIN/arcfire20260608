import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import type { WorldObject, WorldObjectInteractionKind } from '../../worldObjects';

export interface WorldObjectInteractionComponentProps {
  object: WorldObject;
  onExecute?: (objectId: string, interaction: WorldObjectInteractionKind) => void;
}

export type WorldObjectInteractionComponent =
  (props: WorldObjectInteractionComponentProps) => React.ReactElement | null;

function PlaceholderActionButton({
  label,
  kind,
  object,
  onExecute,
}: {
  label: string;
  kind: WorldObjectInteractionKind;
  object: WorldObject;
  onExecute?: (objectId: string, interaction: WorldObjectInteractionKind) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={() => onExecute?.(object.id, kind)}
      accessibilityLabel={`${object.title} ${label}`}
    >
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const MiningInteractionComponent: WorldObjectInteractionComponent = ({ object, onExecute }) => (
  <View style={styles.block}>
    <Text style={styles.title}>채광</Text>
    <PlaceholderActionButton label="채광 시작" kind="mining" object={object} onExecute={onExecute} />
  </View>
);

const SalvageInteractionComponent: WorldObjectInteractionComponent = ({ object, onExecute }) => (
  <View style={styles.block}>
    <Text style={styles.title}>수거</Text>
    <PlaceholderActionButton label="잔해 수거" kind="salvage" object={object} onExecute={onExecute} />
  </View>
);

const DockInteractionComponent: WorldObjectInteractionComponent = ({ object, onExecute }) => (
  <View style={styles.block}>
    <Text style={styles.title}>도킹</Text>
    <PlaceholderActionButton label="기지 도킹" kind="dock" object={object} onExecute={onExecute} />
  </View>
);

export const WORLD_OBJECT_INTERACTION_COMPONENTS:
Record<WorldObjectInteractionKind, WorldObjectInteractionComponent | null> = {
  mining: MiningInteractionComponent,
  salvage: SalvageInteractionComponent,
  dock: DockInteractionComponent,
  trade: null,
  scan: null,
  none: null,
};

const styles = StyleSheet.create({
  block: {
    gap: 6,
  },
  title: {
    color: '#DDE8FF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    borderWidth: 1,
    borderColor: 'rgba(154, 180, 255, 0.55)',
    backgroundColor: 'rgba(22, 36, 64, 0.75)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionText: {
    color: '#F4F8FF',
    fontSize: 12,
    fontWeight: '700',
  },
});

