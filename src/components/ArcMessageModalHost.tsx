// ============================================================
// 시스템 Alert 대체 — 타이틀「이어하기」톤(반투명 패널 + 형광 텍스트)
// ============================================================

import * as NavigationBar from 'expo-navigation-bar';
import React, { memo, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../utils/theme';
import { useArcMessageModalStore } from '../store/arcMessageModalStore';

const PH = '#6BD4FF';

/** Modal 표시 시 OS가 하단 내비를 다시 올리면 insets·터치가 깨질 수 있어 루트와 동일하게 재적용 */
async function reapplyAndroidImmersiveNavBar(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await NavigationBar.setVisibilityAsync('hidden');
    await NavigationBar.setBehaviorAsync('overlay-swipe');
  } catch {
    // Expo Go / 미지원
  }
}

export const ArcMessageModalHost = memo(function ArcMessageModalHost() {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const visible = useArcMessageModalStore((s) => s.visible);
  const title = useArcMessageModalStore((s) => s.title);
  const message = useArcMessageModalStore((s) => s.message);
  const buttons = useArcMessageModalStore((s) => s.buttons);
  const hide = useArcMessageModalStore((s) => s.hide);

  const handleButton = useCallback(
    (onPress?: () => void | Promise<void>) => {
      hide();
      void Promise.resolve(onPress?.()).catch(() => {});
    },
    [hide],
  );

  useEffect(() => {
    if (!visible) return;
    void reapplyAndroidImmersiveNavBar();
    const t = setTimeout(() => {
      void reapplyAndroidImmersiveNavBar();
    }, 80);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.overlay,
        {
          width: winW,
          height: winH,
          paddingTop: SPACING.lg + insets.top,
          paddingBottom: SPACING.lg + insets.bottom,
          paddingLeft: SPACING.lg + insets.left,
          paddingRight: SPACING.lg + insets.right,
        },
      ]}
      pointerEvents="box-none"
      collapsable={false}
    >
      <Pressable style={styles.backdropTouch} onPress={hide} />
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={styles.card} collapsable={false}>
          <Text style={styles.title}>{title}</Text>
          {message.length > 0 ? <Text style={styles.body}>{message}</Text> : null}
          <View style={styles.btnRow}>
            {buttons.map((b, i) => {
              const destructive = b.style === 'destructive';
              const cancel = b.style === 'cancel';
              return (
                <Pressable
                  key={`${b.text}-${i}`}
                  style={({ pressed }) => [
                    styles.btn,
                    cancel && styles.btnSecondary,
                    destructive && styles.btnDestructive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => handleButton(b.onPress)}
                  android_disableSound
                >
                  <Text
                    style={[
                      styles.btnText,
                      destructive && styles.btnTextDestructive,
                      cancel && styles.btnTextMuted,
                    ]}
                  >
                    {b.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 10, 20, 0.78)',
    zIndex: 9999,
    elevation: 50,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 300,
    borderWidth: 1.5,
    borderColor: 'rgba(107, 212, 255, 0.35)',
    borderRadius: 6,
    padding: SPACING.xl,
    backgroundColor: 'rgba(107, 212, 255, 0.08)',
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: PH,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(107, 212, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  body: {
    marginTop: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: PH,
    lineHeight: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(107, 212, 255, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  btn: {
    borderWidth: 1.5,
    borderColor: 'rgba(107, 212, 255, 0.35)',
    borderRadius: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(107, 212, 255, 0.1)',
    minWidth: 72,
    alignItems: 'center',
  },
  btnSecondary: {
    borderColor: 'rgba(230, 238, 255, 0.22)',
    backgroundColor: 'rgba(230, 238, 255, 0.06)',
  },
  btnDestructive: {
    borderColor: 'rgba(227, 107, 107, 0.45)',
    backgroundColor: 'rgba(227, 107, 107, 0.12)',
  },
  btnPressed: {
    opacity: 0.88,
  },
  btnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: PH,
    letterSpacing: 1,
    textShadowColor: 'rgba(107, 212, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  btnTextMuted: {
    color: 'rgba(230, 238, 255, 0.88)',
    textShadowColor: 'rgba(107, 212, 255, 0.2)',
  },
  btnTextDestructive: {
    color: COLORS.danger,
    textShadowColor: 'rgba(227, 107, 107, 0.35)',
  },
});
