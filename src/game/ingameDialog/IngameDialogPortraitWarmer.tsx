/**
 * 릴리즈 번들 초상 디코드 — Image.prefetch 가 no-op 일 수 있어 오프스크린 마운트가 P0.
 * 본 카드와 별도. 세션 워밍 중에만 존재. persist 없음.
 */
import React, { memo, useEffect, useRef } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

type Props = {
  sources: readonly ImageSourcePropType[];
  onWarmed: () => void;
};

export const IngameDialogPortraitWarmer = memo(function IngameDialogPortraitWarmer({
  sources,
  onWarmed,
}: Props) {
  const doneRef = useRef(0);
  const firedRef = useRef(false);
  const onWarmedRef = useRef(onWarmed);
  onWarmedRef.current = onWarmed;
  const total = sources.length;

  const finish = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onWarmedRef.current();
  };

  useEffect(() => {
    doneRef.current = 0;
    firedRef.current = false;
    if (total <= 0) finish();
  }, [total]);

  const onOne = () => {
    doneRef.current += 1;
    if (doneRef.current >= total) finish();
  };

  if (total <= 0) return null;

  return (
    <View style={styles.hidden} pointerEvents="none" accessibilityElementsHidden>
      {sources.map((source, index) => (
        <Image
          key={index}
          source={source}
          style={styles.slot}
          resizeMode="contain"
          resizeMethod="resize"
          onLoad={onOne}
          onError={onOne}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  slot: {
    width: 240,
    height: 240,
  },
});
