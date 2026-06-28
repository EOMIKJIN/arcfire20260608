/**
 * Headless react-native stub — economy audit · CI (esbuild/tsx 경로 치환)
 */
export const Platform = {
  OS: 'ios' as const,
  Version: 0,
  select<T>(spec: { ios?: T; android?: T; default?: T }): T | undefined {
    return spec.ios ?? spec.default;
  },
};

export const InteractionManager = {
  runAfterInteractions(task: () => void) {
    queueMicrotask(task);
    return { cancel: () => {} };
  },
  createInteractionHandle: () => 0,
  clearInteractionHandle: (_handle: number) => {},
};

export const AppState = {
  currentState: 'active' as const,
  addEventListener: () => ({ remove: () => {} }),
};

export const DevSettings = { reload: () => {} };

/** 미사용 심볼 — 정적 import 해석용 no-op */
export const View = 'View';
export const Text = 'Text';
export const Pressable = 'Pressable';
export const ScrollView = 'ScrollView';
export const Image = 'Image';
export const StyleSheet = { create: <T>(s: T): T => s, absoluteFill: {} };
export const Animated = {
  Value: class {
    constructor(public value: number) {}
  },
  View: 'Animated.View',
  timing: () => ({ start: (cb?: () => void) => cb?.() }),
};
export const Easing = { linear: (t: number) => t };
export const PanResponder = { create: () => ({ panHandlers: {} }) };
export const useWindowDimensions = () => ({ width: 390, height: 844, scale: 2, fontScale: 1 });

export type ImageSourcePropType = number;
export type AppStateStatus = 'active' | 'background' | 'inactive';
export type StyleProp<T> = T;
export type ViewStyle = Record<string, unknown>;
export type TextStyle = Record<string, unknown>;
export type LayoutChangeEvent = { nativeEvent: { layout: { width: number; height: number } } };
