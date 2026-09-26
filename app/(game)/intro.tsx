// ============================================================
// 아크파이어 온라인 - 인트로 스토리 화면
// cinematic(프롤로그) · ingame_dialog(범용 대사) 분기
// ============================================================

import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { SPACING } from '../../src/utils/theme';
import { usePlayerStore } from '../../src/store/playerStore';
import { runIntroSeenAndStartFirstMissionPolicy } from '../../src/game/ingameDialog';
import { StageShell } from '../../src/stages/StageShell';
import { STORY_SCENES_FROM_CSV } from '../../src/data/generated';
import { NarrativeDialogRow } from '../../src/ui/overlay/NarrativeDialogRow';
import { resolveStoryPageText, resolveStoryPageLabel } from '../../src/i18n/storyText';
import { useAppSettingsStore } from '../../src/store/appSettingsStore';
import { splitNarrativeDialogSegments } from '../../src/ui/overlay/splitNarrativeDialogSegments';
import { NARRATIVE_DIALOG_LAYOUT } from '../../src/ui/overlay/narrativeDialogLayout';
import { useNarrativeDialogNextReveal } from '../../src/ui/overlay/useNarrativeDialogNextReveal';
import { resolveIngameDialogPortraitSource } from '../../src/game/ingameDialog/resolveIngameDialogPortraitSource';
import {
  INGAME_DIALOG_READY_TIMEOUT_MS,
  buildIntroIngameDialogSessionPack,
  findIntroPackStep,
  type IngameDialogSessionPack,
} from '../../src/game/ingameDialog/ingameDialogSessionPack';
import { IngameDialogPortraitWarmer } from '../../src/game/ingameDialog/IngameDialogPortraitWarmer';
import { prefetchImageSources } from '../../src/assetPipeline/prefetchImageSources';
import { useT } from '../../src/i18n';
import { CinematicPrologueScene } from '../../src/ui/onboarding/CinematicPrologueScene';
import { CinematicPrologueFooter } from '../../src/ui/onboarding/CinematicPrologueFooter';
import { CINEMATIC_PROLOGUE } from '../../src/ui/onboarding/cinematicPrologueTokens';
import { useMainStoryProgressStore } from '../../src/store/mainStoryProgressStore';
import type { Href } from 'expo-router';
import { runStageNavAfterTeardown } from '../../src/navigation/stageNavGate';
import { usePreHubWorldOpsAlertSuppress } from '../../src/navigation/usePreHubWorldOpsAlertSuppress';
import { ArcButton } from '../../src/ui/overlay/ArcButton';

export default function IntroScreen() {
  usePreHubWorldOpsAlertSuppress();
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
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [pageComplete, setPageComplete] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  /** 스킵으로 도달한 페이지 — 타이핑 애니메이션 없이 텍스트를 즉시 전체 표시한다. */
  const [skipRevealPage, setSkipRevealPage] = useState<number | null>(null);
  const introNavScheduledRef = useRef(false);
  const introPackRef = useRef<IngameDialogSessionPack | null>(null);
  const [introPack, setIntroPack] = useState<IngameDialogSessionPack | null>(null);
  const [introDialogReady, setIntroDialogReady] = useState(false);
  const appLocale = useAppSettingsStore(s => s.locale);
  const player = usePlayerStore(s => s.player);

  const isLast = page === pages.length - 1;
  const current = pages[page];
  const currentViewMode = current?.viewMode ?? 'cinematic';
  const isCinematicPage = currentViewMode === 'cinematic';
  const popupImageScale = Math.max(40, Math.min(140, current?.imageScalePct ?? 100)) / 100;
  const renderedText = current
    ? resolveStoryPageText(current, appLocale, player?.nickname)
    : '';
  const renderedLabel = current ? resolveStoryPageLabel(current, appLocale) : '';
  const ingameMaxLines = NARRATIVE_DIALOG_LAYOUT.maxLinesDefault;
  const ingameSplitOptions = useMemo(
    () => ({
      windowWidth: width,
      widthInsets: {
        safeLeft: insets.left,
        safeRight: insets.right,
        hostHorizontalPadPx: NARRATIVE_DIALOG_LAYOUT.hostHorizontalPadPx,
      },
    }),
    [width, insets.left, insets.right],
  );
  useLayoutEffect(() => {
    if (!scene) return;
    const existing = introPackRef.current;
    if (existing && existing.sceneId === scene.id) return;
    const pack = buildIntroIngameDialogSessionPack({
      scene,
      locale: appLocale,
      nickname: player?.nickname,
      splitOptions: ingameSplitOptions,
    });
    introPackRef.current = pack;
    setIntroPack(pack);
    setIntroDialogReady(pack.uniquePortraitSources.length === 0);
  }, [scene, appLocale, player?.nickname, ingameSplitOptions]);

  useEffect(() => {
    if (introDialogReady) return;
    const timer = setTimeout(() => setIntroDialogReady(true), INGAME_DIALOG_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [introDialogReady]);

  useEffect(() => {
    const sources = introPack?.uniquePortraitSources;
    if (!sources || sources.length === 0) return;
    void prefetchImageSources(sources);
  }, [introPack]);

  const introPackStep = introPack && currentViewMode === 'ingame_dialog'
    ? findIntroPackStep(introPack, page, segmentIndex)
    : null;

  const ingameTextSegments = useMemo(() => {
    if (introPackStep) return [introPackStep.text];
    if (currentViewMode !== 'ingame_dialog') return [renderedText];
    return splitNarrativeDialogSegments(renderedText, ingameMaxLines, ingameSplitOptions);
  }, [introPackStep, currentViewMode, renderedText, ingameMaxLines, ingameSplitOptions]);
  const ingameSegmentText = introPackStep?.text ?? ingameTextSegments[segmentIndex] ?? '';
  const isLastIngameSegment = introPackStep
    ? !introPackStep.hasMoreDialogue
    : segmentIndex >= Math.max(0, ingameTextSegments.length - 1);
  // 스킵으로 이 페이지에 도달했고, 아직 세그먼트 0(스킵 직후 첫 표시)일 때만 즉시 전체 표시.
  const skipRevealActive = skipRevealPage === page && segmentIndex === 0;

  const typingRevealKey = isCinematicPage
    ? `intro-cinematic-${page}`
    : `intro-ingame-${page}-${segmentIndex}`;
  const { revealReady: typingRevealReady, awaitingReveal, onTypingComplete, skipToReady } =
    useNarrativeDialogNextReveal(typingRevealKey, () => setPageComplete(true));

  useEffect(() => {
    setSegmentIndex(0);
    setPageComplete(false);
  }, [page]);

  const currentDialogImageSource = introPackStep?.imageSource
    ?? (current && currentViewMode === 'ingame_dialog' && !introPack
      ? resolveIngameDialogPortraitSource(current)
      : undefined);

  const scheduleIntroNavigate = useCallback((href: Href) => {
    if (introNavScheduledRef.current) return;
    introNavScheduledRef.current = true;
    runStageNavAfterTeardown({
      teardown: () => {},
      navigate: () => router.replace(href),
    });
  }, []);

  const handleNext = useCallback(async () => {
    if (isTransitioning) return;
    if (!scene || pages.length === 0) {
      scheduleIntroNavigate('/(game)/continue-warp?target=planet');
      return;
    }
    if (!pageComplete) {
      skipToReady();
      return;
    }

    if (currentViewMode === 'ingame_dialog' && introPack) {
      const step = findIntroPackStep(introPack, page, segmentIndex);
      if (step && !step.isFinalStep) {
        const next = introPack.steps[step.stepIndex + 1];
        if (next) {
          if (next.pageIndex !== page) {
            setPage(next.pageIndex);
          }
          setSegmentIndex(next.segmentIndex);
          setPageComplete(false);
          return;
        }
      }
    } else if (currentViewMode === 'ingame_dialog' && !isLastIngameSegment) {
      setSegmentIndex((i) => i + 1);
      setPageComplete(false);
      return;
    }

    if (isLast) {
      setIsTransitioning(true);
      try {
        if (isPreNicknameFlow && !player) {
          scheduleIntroNavigate('/(game)/character-select');
          return;
        }
        if (scene.completionPolicy === 'return_hub_after_chapter_story') {
          useMainStoryProgressStore.getState().markChapterEndSeen(scene.id);
        } else if (scene.completionPolicy === 'mark_intro_seen_and_start_first_mission') {
          runIntroSeenAndStartFirstMissionPolicy();
        }
        const nextRoute = (scene.nextRoute as '/(game)/planet') || '/(game)/planet';
        if (nextRoute === '/(game)/planet') {
          scheduleIntroNavigate('/(game)/continue-warp?target=planet');
        } else {
          scheduleIntroNavigate(nextRoute);
        }
      } catch {
        setIsTransitioning(false);
      }
    } else {
      setPage(p => p + 1);
      setPageComplete(false);
    }
  }, [
    isTransitioning,
    pageComplete,
    skipToReady,
    isLast,
    isLastIngameSegment,
    currentViewMode,
    introPack,
    page,
    segmentIndex,
    isPreNicknameFlow,
    player,
    scene,
    pages.length,
    scheduleIntroNavigate,
  ]);

  const handleSkipScene = useCallback(() => {
    const lastPageIndex = Math.max(0, pages.length - 1);
    setSkipRevealPage(lastPageIndex);
    setPage(lastPageIndex);
    setPageComplete(false);
  }, [pages.length]);

  const nextLabel = !typingRevealReady
    ? t('intro.btn.skipTyping')
    : currentViewMode === 'ingame_dialog' && !isLastIngameSegment
      ? t('intro.btn.next')
      : isLast
        ? (isPreNicknameFlow && !player
            ? t('intro.btn.registerPilot')
            : t('intro.btn.startGame'))
        : t('intro.btn.next');

  return (
    <StageShell
      routeName="intro"
      background={isCinematicPage ? 'none' : 'stars'}
      safeAreaBackgroundColor={isCinematicPage ? CINEMATIC_PROLOGUE.screenBg : undefined}
      topInset={!isCinematicPage}
    >
      <View
        style={[
          styles.container,
          { width, height },
          isCinematicPage && styles.containerCinematic,
        ]}
      >
        {introPack && introPack.uniquePortraitSources.length > 0 ? (
          <IngameDialogPortraitWarmer
            key={introPack.sceneId ?? sceneId}
            sources={introPack.uniquePortraitSources}
            onWarmed={() => setIntroDialogReady(true)}
          />
        ) : null}
        {isCinematicPage ? (
          <>
            <CinematicPrologueScene
              pageKey={page}
              label={renderedLabel}
              text={renderedText}
              typewriterSpeedMs={scene?.typewriterSpeedMs ?? 40}
              fadeInEnabled={scene?.fadeInEnabled ?? true}
              fadeInDurationMs={scene?.fadeInDurationMs ?? CINEMATIC_PROLOGUE.fadeDefaultMs}
              onTextComplete={onTypingComplete}
              onPressAdvance={handleNext}
              skipAnimation={skipRevealActive}
            />
            <CinematicPrologueFooter
              pageCount={pages.length}
              pageIndex={page}
              skipLabel={t('intro.btn.skipScene')}
              nextLabel={nextLabel}
              showSkip={Boolean(scene?.skippable)}
              disabled={isTransitioning || awaitingReveal}
              busy={isTransitioning}
              onSkip={handleSkipScene}
              onNext={handleNext}
            />
          </>
        ) : (
          <>
            <View style={styles.storyArea}>
              <View style={styles.ingameDialogSlot} collapsable={false}>
                {introDialogReady ? (
                  <NarrativeDialogRow
                    label={introPackStep?.label || renderedLabel || t('intro.commLabel')}
                    text={ingameSegmentText}
                    typewriterKey={introPackStep?.typewriterKey ?? `intro-dialog-${page}-${segmentIndex}`}
                    typewriterSpeedMs={introPackStep?.typewriterSpeedMs ?? scene?.typewriterSpeedMs ?? 40}
                    typewriterActive={introDialogReady}
                    onTextComplete={onTypingComplete}
                    imageSource={currentDialogImageSource ?? introPackStep?.imageSource}
                    portraitScale={introPackStep?.portraitScale ?? popupImageScale}
                    maxLines={ingameMaxLines}
                    showActionButton={false}
                    skipAnimation={skipRevealActive}
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.footer}>
              {scene?.skippable ? (
                <ArcButton
                  label={t('intro.btn.skipScene')}
                  variant="secondary"
                  disabled={isTransitioning || !introDialogReady}
                  onPress={handleSkipScene}
                  style={styles.skipBtn}
                />
              ) : (
                <View style={styles.skipBtn} />
              )}
              <ArcButton
                label={nextLabel}
                variant="panel"
                disabled={awaitingReveal || !introDialogReady}
                busy={isTransitioning}
                onPress={handleNext}
                style={styles.nextBtn}
              />
            </View>
          </>
        )}
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
  containerCinematic: {
    backgroundColor: CINEMATIC_PROLOGUE.screenBg,
    paddingVertical: 0,
  },
  storyArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  ingameDialogSlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
    marginHorizontal: -SPACING.xl,
    paddingHorizontal: NARRATIVE_DIALOG_LAYOUT.hostHorizontalPadPx,
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
