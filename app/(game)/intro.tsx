// ============================================================
// 아크파이어 온라인 - 인트로 스토리 화면
// ============================================================

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { TypewriterText } from '../../src/components/TypewriterText';
import { usePlayerStore } from '../../src/store/playerStore';
import { useMissionStore } from '../../src/store/missionStore';
import { StageShell } from '../../src/stages/StageShell';
import { STORY_SCENES_FROM_CSV } from '../../src/data/generated';
import { NarrativeDialogRow } from '../../src/ui/overlay/NarrativeDialogRow';
import { resolveOverlayBottomAnchorPad } from '../../src/ui/overlay/overlayInsets';
import { ArcButton } from '../../src/ui/overlay/ArcButton';
import { resolveStoryPageText, resolveStoryPageLabel } from '../../src/i18n/storyText';
import { useAppSettingsStore } from '../../src/store/appSettingsStore';
import { useT } from '../../src/i18n';

const STORY_IMAGE_ASSETS: Record<string, any> = {
  'assets/images/stella_aris_char001.png': require('../../assets/images/stella_aris_char001.png'),
};

export default function IntroScreen() {
  const t = useT();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
  const appLocale = useAppSettingsStore(s => s.locale);
  const player = usePlayerStore(s => s.player);
  const setPlayer = usePlayerStore(s => s.setPlayer);
  const persist = usePlayerStore(s => s.persist);
  const initMissions = useMissionStore(s => s.initMissions);

  const isLast = page === pages.length - 1;
  const current = pages[page];
  const currentViewMode = current?.viewMode ?? 'cinematic';
  const currentTextBoxPreset = current?.textBoxPreset ?? 'default';
  const popupImageScale = Math.max(40, Math.min(140, current?.imageScalePct ?? 100)) / 100;
  const renderedText = current
    ? resolveStoryPageText(current, appLocale, player?.nickname)
    : '';
  const renderedLabel = current ? resolveStoryPageLabel(current, appLocale) : '';
  const currentDialogImageSource = current?.imageAssetKey
    ? STORY_IMAGE_ASSETS[current.imageAssetKey]
    : undefined;
  const ingameDialogBottomPad = resolveOverlayBottomAnchorPad(insets, SPACING.md);

  const handleNext = useCallback(async () => {
    if (isTransitioning) return;
    if (!scene || pages.length === 0) {
      router.replace('/(game)/continue-warp?target=planet');
      return;
    }
    if (!pageComplete) {
      setPageComplete(true);
      return;
    }

    if (isLast) {
      setIsTransitioning(true);
      try {
        if (isPreNicknameFlow && !player) {
          router.replace('/(game)/character-select');
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

  const nextLabel = !pageComplete
    ? t('intro.btn.skipTyping')
    : isLast
      ? (isPreNicknameFlow && !player
          ? t('intro.btn.registerPilot')
          : t('intro.btn.startGame'))
      : t('intro.btn.next');

  return (
    <StageShell routeName="intro" background="stars">
      <View style={[styles.container, { width, height }]}>
        <View style={styles.pageIndicator}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.storyArea}>
          {currentViewMode === 'ingame_dialog' ? (
            <View style={[styles.ingameDialogSlot, { paddingBottom: ingameDialogBottomPad }]}>
              <NarrativeDialogRow
                label={renderedLabel || t('intro.commLabel')}
                text={renderedText}
                typewriterKey={`intro-dialog-${page}`}
                typewriterSpeedMs={scene?.typewriterSpeedMs ?? 40}
                onTextComplete={() => setPageComplete(true)}
                imageSource={currentDialogImageSource}
                portraitScale={popupImageScale}
                showActionButton={false}
              />
            </View>
          ) : (
            <>
              <Text style={styles.sceneLabel}>{renderedLabel}</Text>
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
          )}
        </View>

        <View style={styles.footer}>
          {scene?.skippable ? (
            <ArcButton
              label={t('intro.btn.skipScene')}
              variant="secondary"
              disabled={isTransitioning}
              onPress={() => {
                setPage(Math.max(0, pages.length - 1));
                setPageComplete(false);
              }}
              style={styles.skipBtn}
            />
          ) : (
            <View style={styles.skipBtn} />
          )}
          <ArcButton
            label={nextLabel}
            variant="panel"
            disabled={isTransitioning}
            onPress={handleNext}
            style={styles.nextBtn}
          />
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
    rowGap: SPACING.sm,
    columnGap: SPACING.sm,
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
  ingameDialogSlot: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
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
    minWidth: 96,
  },
  nextBtn: {
    minWidth: 120,
  },
});
