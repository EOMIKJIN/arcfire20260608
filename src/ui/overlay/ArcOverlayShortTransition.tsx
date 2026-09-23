import React, { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  OVERLAY_SHORT_TRANSITION,
  OVERLAY_SHORT_TRANSITION_CLOSE_MS,
} from './overlayShortTransition';

type Props = {
  visible: boolean;
  onExited?: () => void;
  /** 오픈 시퀀스가 끝난 뒤 — 타이프라이터 등 컨텐츠 연출 시작 */
  onOpened?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const T = OVERLAY_SHORT_TRANSITION;
const easeOut = Easing.out(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);

/**
 * 범용 초단 오픈/클로징. 첫 onLayout(+1 rAF) 뒤에만 오픈.
 * visible 유지(페이지 패치)에는 재생하지 않는다.
 */
export const ArcOverlayShortTransition = memo(function ArcOverlayShortTransition({
  visible,
  onExited,
  onOpened,
  children,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(T.startOpacity)).current;
  const translateY = useRef(new Animated.Value(T.startTranslateY)).current;
  const scale = useRef(new Animated.Value(T.startScale)).current;
  const [mounted, setMounted] = useState(visible);
  const [layoutReady, setLayoutReady] = useState(false);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;
  const onOpenedRef = useRef(onOpened);
  onOpenedRef.current = onOpened;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutReadyRef = useRef(false);
  const openPlayedRef = useRef(false);
  const layoutRafRef = useRef<number | null>(null);

  const stop = () => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width < 2 || height < 2) return;
    if (layoutReadyRef.current) return;
    layoutReadyRef.current = true;
    if (layoutRafRef.current != null) cancelAnimationFrame(layoutRafRef.current);
    layoutRafRef.current = requestAnimationFrame(() => {
      layoutRafRef.current = null;
      setLayoutReady(true);
    });
  };

  useEffect(() => {
    return () => {
      if (layoutRafRef.current != null) cancelAnimationFrame(layoutRafRef.current);
    };
  }, []);

  useEffect(() => {
    stop();
    if (visible) {
      setMounted(true);
      if (openPlayedRef.current) {
        return stop;
      }
      opacity.setValue(T.startOpacity);
      translateY.setValue(T.startTranslateY);
      scale.setValue(T.startScale);
      if (!layoutReady) {
        return stop;
      }
      openPlayedRef.current = true;
      const open = Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: T.midOpenOpacity,
            duration: T.openRevealMs,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: T.midOpenTranslateY,
            duration: T.openRevealMs,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: T.openRevealMs,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: T.openSettleMs,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: T.openSettleMs,
            easing: easeOut,
            useNativeDriver: true,
          }),
        ]),
      ]);
      animRef.current = open;
      open.start(({ finished }) => {
        if (finished && visibleRef.current) {
          onOpenedRef.current?.();
        }
      });
      return stop;
    }

    openPlayedRef.current = false;

    if (!mounted) {
      return stop;
    }

    const finishExit = () => {
      if (visibleRef.current) return;
      setMounted(false);
      onExitedRef.current?.();
    };

    const close = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: T.midCloseOpacity,
          duration: T.closeSinkMs,
          easing: easeIn,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: T.midCloseTranslateY,
          duration: T.closeSinkMs,
          easing: easeIn,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: T.startScale,
          duration: T.closeSinkMs,
          easing: easeIn,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: T.closeFadeMs,
          easing: easeIn,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: T.endCloseTranslateY,
          duration: T.closeFadeMs,
          easing: easeIn,
          useNativeDriver: true,
        }),
      ]),
    ]);
    animRef.current = close;
    close.start(({ finished }) => {
      if (finished) finishExit();
    });
    safetyRef.current = setTimeout(finishExit, OVERLAY_SHORT_TRANSITION_CLOSE_MS + 40);
    return stop;
  }, [layoutReady, opacity, scale, translateY, visible]);

  if (!mounted && !visible) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      collapsable={false}
      onLayout={handleLayout}
      style={[styles.fill, style, { opacity, transform: [{ translateY }, { scale }] }]}
    >
      {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
  },
});
