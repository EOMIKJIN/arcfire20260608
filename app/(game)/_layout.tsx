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
        // 비활성(blur) 스크린의 렌더·Reanimated 워클릿 실행을 동결.
        // 스테이지 전환 중 stale 스크린의 워클릿이 계속 돌며 null-deref(SIGSEGV)로
        // 크래시하던 회귀 차단 + 비활성 스크린 자원 점유 감소. (tombstone_29/30 근거)
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen name="character-select" />
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
