import React, { memo, useRef } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { narrativeDialogPortraitSourceKey } from './narrativeDialogPortraitSourceKey';

export { narrativeDialogPortraitSourceKey } from './narrativeDialogPortraitSourceKey';

type Props = {
  source?: ImageSourcePropType;
  scale?: number;
};

/**
 * 같은 초상은 native Image 를 유지한다.
 * [ 다음 ] 때 Typewriter remount / source 참조 교체로 디코드가 다시 돌면 얼굴이 깜박인다.
 */
export const NarrativeDialogPortrait = memo(function NarrativeDialogPortrait({
  source,
  scale = 1,
}: Props) {
  const shownRef = useRef<ImageSourcePropType | undefined>(source);
  const shownKeyRef = useRef(narrativeDialogPortraitSourceKey(source));
  const nextKey = narrativeDialogPortraitSourceKey(source);
  if (source != null && nextKey !== '' && nextKey !== shownKeyRef.current) {
    shownRef.current = source;
    shownKeyRef.current = nextKey;
  } else if (source != null && shownRef.current == null) {
    shownRef.current = source;
    shownKeyRef.current = nextKey;
  }
  const shown = shownRef.current;
  const resolvedScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const transform = resolvedScale !== 1 ? [{ scale: resolvedScale }] : undefined;

  if (!shown) {
    return <View style={styles.placeholder} collapsable={false} />;
  }

  return (
    <View style={styles.imageWrap} collapsable={false}>
      <Image
        source={shown}
        fadeDuration={0}
        progressiveRenderingEnabled={false}
        style={[styles.image, transform ? { transform } : null]}
        resizeMode="contain"
      />
    </View>
  );
}, (prev, next) => (
  narrativeDialogPortraitSourceKey(prev.source) === narrativeDialogPortraitSourceKey(next.source)
  && prev.scale === next.scale
));

const styles = StyleSheet.create({
  imageWrap: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#05070d',
  },
});
