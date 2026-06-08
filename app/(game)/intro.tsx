// ============================================================
// 아크파이어 온라인 - 인트로 스토리 화면
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { TypewriterText } from '../../src/components/TypewriterText';
import { usePlayerStore } from '../../src/store/playerStore';
import { useMissionStore } from '../../src/store/missionStore';
import { StageShell } from '../../src/stages/StageShell';
import { STORY_SCENES_FROM_CSV } from '../../src/data/generated';

const STORY_IMAGE_ASSETS: Record<string, any> = {
  'assets/images/stella_aris_char001.png': require('../../assets/images/stella_aris_char001.png'),
};

export default function IntroScreen() {
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ sceneId?: string | string[]; flow?: string | string[] }>();
  const paramSceneId = Array.isArray(params.sceneId) ? params.sceneId[0] : params.sceneId;
  const paramFlow = Array.isArray(params.flow) ? params.flow[0] : params.flow;
  const isPreNicknameFlow = paramFlow === 'preNickname';
  const sceneId = typeof paramSceneId === 'string' && paramSceneId.trim().length > 0
    ? paramSceneId
    : 'intro01';
  const scene = STORY_SCENES_FROM_CSV[sceneId] ?? STORY_SCENES_FROM_CSV.intro01;
  const pages = scene?.pages ?? [];
  const [page, setPage] = useState(0);
  const [pageComplete, setPageComplete] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const player = usePlayerStore(s => s.player);
  const setPlayer = usePlayerStore(s => s.setPlayer);
  const persist = usePlayerStore(s => s.persist);
  const initMissions = useMissionStore(s => s.initMissions);

  const isLast = page === pages.length - 1;
  const current = pages[page];
  const currentViewMode = current?.viewMode ?? 'cinematic';
  const currentTextBoxPreset = current?.textBoxPreset ?? 'default';
  const popupImageScale = Math.max(40, Math.min(140, current?.imageScalePct ?? 100));
  const renderedText = (current?.text ?? '').replace(/\[닉네임\]/g, player?.nickname ?? '파일럿');
  const currentDialogImageSource = current?.imageAssetKey
    ? STORY_IMAGE_ASSETS[current.imageAssetKey]
    : undefined;

  const handleNext = useCallback(async () => {
    if (isTransitioning) return;
    if (!scene || pages.length === 0) {
      router.replace('/(game)/continue-warp?target=planet');
      return;
    }
    if (!pageComplete) {
      // 타이핑 스킵
      setPageComplete(true);
      return;
    }

    if (isLast) {
      setIsTransitioning(true);
      try {
        if (isPreNicknameFlow && !player) {
          router.replace('/(game)/nickname');
          return;
        }
        if (scene.completionPolicy === 'mark_intro_seen_and_start_first_mission') {
          if (player) {
            const updated = {
              ...player,
              flags: {
                ...player.flags,
                introSeen: true,
                firstMissionStarted: true,
              },
            };
            setPlayer(updated);
            await persist();
          }
          initMissions();
        }
        const nextRoute = (scene.nextRoute as '/(game)/planet') || '/(game)/planet';
        /** 첫 스토리 완료 후에도 이어하기와 동일: 항로 로딩 → 프리워arm → 행성 */
        if (nextRoute === '/(game)/planet') {
          router.replace('/(game)/continue-warp?target=planet');
        } else {
          router.replace(nextRoute);
        }
      } catch {
        setIsTransitioning(false);
      }
    } else {
      setPage(p => p + 1);
      setPageComplete(false);
    }
  }, [isTransitioning, pageComplete, isLast, isPreNicknameFlow, player, scene, pages.length, setPlayer, persist, initMissions]);

  return (
    <StageShell routeName="intro" background="stars">
      <View style={[styles.container, { width, height }]}>
        {/* 페이지 번호 */}
        <View style={styles.pageIndicator}>
          {pages.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === page && styles.dotActive]}
            />
          ))}
        </View>

        {/* 스토리 본문 */}
        <View style={styles.storyArea}>
          {currentViewMode === 'ingame_dialog' ? (
            <View style={styles.popupLayer} pointerEvents="none">
              <View style={styles.dialogRow}>
                {currentDialogImageSource ? (
                  <View style={[styles.popupImageCard, { transform: [{ scale: popupImageScale / 100 }] }]}>
                    <Image
                      source={currentDialogImageSource}
                      style={styles.popupImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View style={styles.popupImageCardPlaceholder} />
                )}
                <View style={styles.dialogHudBox}>
                  <Text style={styles.dialogHudLabel}>{current?.label ?? '통신'}</Text>
                  <TypewriterText
                    key={`dialog-${page}`}
                    text={renderedText}
                    speed={Math.max(1, scene?.typewriterSpeedMs ?? 40)}
                    onComplete={() => setPageComplete(true)}
                    style={styles.dialogHudText}
                  />
                </View>
              </View>
            </View>
          ) : null}
          {currentViewMode !== 'ingame_dialog' ? (
            <>
              <Text style={styles.sceneLabel}>{current?.label ?? ''}</Text>
              <View style={[styles.textBox, currentTextBoxPreset === 'compact' && styles.textBoxCompact]}>
                <TypewriterText
                  key={page}
                  text={renderedText}
                  speed={Math.max(1, scene?.typewriterSpeedMs ?? 40)}
                  onComplete={() => setPageComplete(true)}
                  style={styles.storyText}
                />
              </View>
            </>
          ) : null}
        </View>

        {/* 하단 버튼 */}
        <View style={styles.footer}>
          {scene?.skippable ? (
            <TouchableOpacity style={styles.skipBtn} disabled={isTransitioning} onPress={() => {
              setPage(Math.max(0, pages.length - 1));
              setPageComplete(false);
            }}>
              <Text style={styles.skipText}>[ 건너뛰기 ]</Text>
            </TouchableOpacity>
          ) : <View style={styles.skipBtn} />}

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={isTransitioning}>
            <Text style={styles.nextText}>
              {!pageComplete ? '[ 스킵 ]' : isLast ? (isPreNicknameFlow && !player ? '[ 파일럿 등록 ]' : '[ 게임 시작 ]') : '[ 다음 ▶ ]'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xl,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    rowGap: SPACING.sm, columnGap: SPACING.sm,
    paddingTop: SPACING.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.ink_dark,
  },
  storyArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  popupLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.xl + 6,
  },
  dialogRow: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'flex-end',
    columnGap: SPACING.md,
  },
  popupImageCard: {
    width: 150,
    height: 190,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#000',
    opacity: 0.92,
  },
  popupImage: {
    width: '100%',
    height: '100%',
  },
  popupImageCardPlaceholder: {
    width: 150,
    height: 190,
  },
  dialogHudBox: {
    flex: 1,
    minHeight: 132,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    backgroundColor: 'rgba(8, 12, 20, 0.85)',
  },
  dialogHudLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  dialogHudText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.bg_primary,
    lineHeight: 20,
  },
  sceneLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_light,
    letterSpacing: 2,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  textBox: {
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: SPACING.xl,
    minHeight: 200,
    justifyContent: 'center',
  },
  textBoxCompact: {
    minHeight: 148,
    padding: SPACING.lg,
  },
  storyText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_dark,
    lineHeight: 26,
    textAlign: 'left',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  skipBtn: {
    padding: SPACING.md,
  },
  skipText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_light,
  },
  nextBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.ink_dark,
    borderRadius: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.ink_dark,
  },
  nextText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.bg_primary,
    fontWeight: FONTS.weight.bold,
  },
});
