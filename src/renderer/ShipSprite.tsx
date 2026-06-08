import React from 'react';
import { View, StyleSheet } from 'react-native';

const PALETTE: Record<number, string> = {
  0: 'transparent',
  1: '#3D3833',
  2: '#6A6050',
  3: '#A63D3D',
};

type Props = { sprite: number[][]; pixelSize?: number; flip?: boolean };

export function ShipSprite({ sprite, pixelSize = 8, flip }: Props) {
  const rows = sprite.length;
  const cols = sprite[0]?.length ?? 0;
  const w = cols * pixelSize;

  return (
    <View
      style={[
        styles.wrap,
        { width: w, height: rows * pixelSize },
        flip && { transform: [{ scaleX: -1 }] },
      ]}
    >
      {sprite.map((row, y) =>
        row.map((cell, x) => (
          <View
            key={`${y}-${x}`}
            style={{
              position: 'absolute',
              left: x * pixelSize,
              top: y * pixelSize,
              width: pixelSize,
              height: pixelSize,
              backgroundColor: PALETTE[cell] ?? 'transparent',
            }}
          />
        )),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
});
