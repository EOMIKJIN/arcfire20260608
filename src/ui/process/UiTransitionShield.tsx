import React, { memo, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  isUiTransitionBusy,
  subscribeUiTransitionBusy,
} from './uiTransitionGuard';

/**
 * 루트 1장. 전환 중에만 터치를 삼킨다. 연출·카피 없음.
 */
export const UiTransitionShield = memo(function UiTransitionShield() {
  const busy = useSyncExternalStore(
    subscribeUiTransitionBusy,
    isUiTransitionBusy,
    isUiTransitionBusy,
  );
  return (
    <View
      pointerEvents={busy ? 'auto' : 'box-none'}
      style={styles.root}
      collapsable={false}
    >
      {busy ? (
        <Pressable
          style={styles.fill}
          onPress={() => {}}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 10000,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
