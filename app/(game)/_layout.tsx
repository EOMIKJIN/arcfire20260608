// ============================================================
// 아크파이어 온라인 - (game) 그룹 레이아웃
// ============================================================

import { Stack } from 'expo-router';
import { COLORS } from '../../src/utils/theme';

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: COLORS.bg_primary },
      }}
    >
      <Stack.Screen name="nickname" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="continue-warp" />
      <Stack.Screen name="planet" />
      <Stack.Screen name="worldmap" />
      <Stack.Screen name="combat" />
      <Stack.Screen name="skilltree" />
      <Stack.Screen name="trade" />
      <Stack.Screen name="shipyard" />
      <Stack.Screen name="tavern" />
    </Stack>
  );
}
