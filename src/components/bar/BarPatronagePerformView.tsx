// ============================================================
// 바 후원 공연 — 영상통화형 프레임 + 정적 초상 + ♪ 숏컷 오버레이 (Skia 금지)
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_FACILITY as TF } from '../../ui/tactical/tacticalFacilityScreenTokens';
import { useT } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import {
  PlanetFacilitySectionHeader,
  planetFacilityScreenStyles as fs,
} from '../../ui/planetFacility/PlanetFacilityTitleHeader';
import { useBarPatronageStore } from '../../store/barPatronageStore';
import {
  getBarAttendantById,
  getBarPatronagePolicy,
  getBarSongById,
  listDialogTurnsForAttendant,
  listBarAnimClipsForSet,
} from '../../game/bar/patronage/barPatronageTables';
import { presentBarDialogTurns } from '../../game/bar/patronage/barPatronageDialog';
import { resolveBarAttendantPortraitSource } from '../../game/bar/patronage/barPatronagePortrait';
import { resolveBarVoiceClipForAttendant } from '../../game/bar/patronage/barVoiceResolve';

type Props = {
  onAddDrink: () => void;
  onLeave: () => void;
};

const CALL_FRAME_H = 252;

function formatRemain(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function BarPatronagePerformView({ onAddDrink, onLeave }: Props) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const session = useBarPatronageStore((s) => s.activeSession);
  const remainingMs = useBarPatronageStore((s) => s.remainingMs);
  const policy = getBarPatronagePolicy();
  const [remain, setRemain] = useState(() => remainingMs());
  const sway = useRef(new Animated.Value(0)).current;

  const attendant = useMemo(
    () => (session ? getBarAttendantById(session.attendantId) : undefined),
    [session],
  );
  const clips = useMemo(
    () => (attendant ? listBarAnimClipsForSet(attendant.animSetId) : []),
    [attendant],
  );
  const motion = clips[0]?.motionHint ?? 'sway';

  useEffect(() => {
    if (!session) return;
    const tickMs = Math.max(5_000, policy.timerUiTickSec * 1000);
    const id = setInterval(() => {
      const left = remainingMs();
      setRemain(left);
      if (left <= 0) {
        useBarPatronageStore.getState().endSession();
      }
    }, tickMs);
    setRemain(remainingMs());
    return () => clearInterval(id);
  }, [policy.timerUiTickSec, remainingMs, session]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: motion === 'bounce' ? 900 : 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: 0,
          duration: motion === 'bounce' ? 900 : 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [motion, sway]);

  const translateY = sway.interpolate({
    inputRange: [0, 1],
    outputRange: motion === 'bounce' ? [0, -10] : [0, -4],
  });
  const rotate = sway.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '3deg'],
  });

  if (!session || !attendant) {
    return (
      <View style={fs.stackCard}>
        <Text style={styles.hint}>{t('bar.patronage.noSession')}</Text>
      </View>
    );
  }

  const name = locale === 'en' ? attendant.displayNameEn : attendant.displayNameKo;
  const song = attendant.songId ? getBarSongById(attendant.songId) : undefined;
  const songTitle = song ? (locale === 'en' ? song.titleEn : song.titleKo) : '';
  const portrait = resolveBarAttendantPortraitSource(attendant.portraitImageAssetKey);
  const voiceClip = resolveBarVoiceClipForAttendant(attendant.attendantId);
  const songCaption = voiceClip
    ? locale === 'en'
      ? voiceClip.captionEn
      : voiceClip.captionKo
    : '';
  const voiceKb = voiceClip ? Math.max(1, Math.round(voiceClip.bytes / 1024)) : 0;
  const voiceSec = voiceClip ? (voiceClip.durationMs / 1000).toFixed(1) : '0';

  const openDialog = () => {
    const turns = listDialogTurnsForAttendant({
      dialogSetId: attendant.dialogSetId,
      maxBundleTier: session.unlockedBundleTier,
    });
    void presentBarDialogTurns({
      turns,
      locale: locale === 'en' ? 'en' : 'ko',
      label: name,
      planetId: session.planetId,
      attendantId: attendant.attendantId,
    });
  };

  return (
    <>
      <View style={fs.stackCard}>
        <PlanetFacilitySectionHeader inCard first title={t('bar.patronage.performTitle')} />
        <View style={styles.callFrame}>
          {portrait ? (
            <Image
              source={portrait}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              resizeMethod="resize"
              accessible={false}
              importantForAccessibility="no"
            />
          ) : (
            <View style={styles.portraitPlaceholder} accessible={false} importantForAccessibility="no" />
          )}
          <View style={styles.liveChip} pointerEvents="none">
            <Text style={styles.liveChipText}>{t('bar.patronage.callLive')}</Text>
          </View>
          <Animated.View
            style={[styles.danceLayer, { transform: [{ translateY }, { rotate }] }]}
            pointerEvents="none"
            accessibilityLabel={t('bar.patronage.danceA11y', { name })}
          >
            <Text style={styles.danceMark}>♪</Text>
          </Animated.View>
          <View style={styles.captionBar} pointerEvents="none">
            <Text style={styles.stageName} numberOfLines={1}>
              {name}
            </Text>
            {songTitle ? (
              <Text style={styles.stageSub} numberOfLines={1}>
                {t('bar.patronage.nowPlaying', { title: songTitle })}
              </Text>
            ) : (
              <Text style={styles.stageSub} numberOfLines={1}>
                {t('bar.patronage.dancing')}
              </Text>
            )}
            {songCaption ? (
              <Text style={styles.voiceCaption} numberOfLines={2}>
                {t('bar.patronage.voiceCaption', { text: songCaption })}
              </Text>
            ) : null}
          </View>
        </View>
        {voiceClip?.testClip ? (
          <Text style={styles.voiceMeta}>
            {t('bar.patronage.voiceTestMeta', {
              format: voiceClip.format,
              sec: voiceSec,
              kb: voiceKb,
            })}
          </Text>
        ) : null}
        <Text style={styles.timer}>{t('bar.patronage.remain', { time: formatRemain(remain) })}</Text>
        <Text style={styles.meta}>
          {t('bar.patronage.sessionMeta', {
            drinks: session.drinksPurchased,
            tier: session.unlockedBundleTier,
          })}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.btn} onPress={openDialog} accessibilityRole="button">
          <Text style={styles.btnText} numberOfLines={1}>
            {t('bar.patronage.talk')}
          </Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={onAddDrink} accessibilityRole="button">
          <Text style={styles.btnText} numberOfLines={1}>
            {t('bar.patronage.addDrink')}
          </Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={onLeave} accessibilityRole="button">
          <Text style={styles.btnText} numberOfLines={1}>
            {t('bar.patronage.leave')}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.mutedInk,
    textAlign: 'center',
  },
  callFrame: {
    alignSelf: 'stretch',
    height: CALL_FRAME_H,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TF.titleInk,
    backgroundColor: '#0C1018',
    overflow: 'hidden',
  },
  portraitPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#141C28',
  },
  liveChip: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    zIndex: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(244,241,232,0.55)',
    backgroundColor: 'rgba(8,10,14,0.62)',
  },
  liveChipText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: '#F4F1E8',
    letterSpacing: 1,
  },
  danceLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 78,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  danceMark: {
    fontSize: 40,
    color: '#F4F1E8',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  captionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(8,10,14,0.58)',
  },
  stageName: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: '#F4F1E8',
  },
  stageSub: {
    marginTop: 2,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: 'rgba(244,241,232,0.72)',
  },
  voiceCaption: {
    marginTop: 4,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: '#F4F1E8',
  },
  voiceMeta: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.mutedInk,
    textAlign: 'center',
  },
  timer: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: TF.titleInk,
    textAlign: 'center',
  },
  meta: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.mutedInk,
    textAlign: 'center',
  },
  actions: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  btn: {
    flex: 1,
    minWidth: 0,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TF.titleInk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.titleInk,
    textAlign: 'center',
  },
});
