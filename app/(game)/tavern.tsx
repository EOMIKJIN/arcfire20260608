// ============================================================
// 아크파이어 온라인 - 선술집(공지 보드)
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import { usePlanetSubStageMemory } from '../../src/hooks/usePlanetSubStageMemory';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import { useTavernBoardStore } from '../../src/store/tavernBoardStore';
import { usePlayerStore } from '../../src/store/playerStore';
import { NPC_CAPTAINS_FROM_CSV } from '../../src/data/generated';
import { ArcStageBackButton } from '../../src/ui/overlay/ArcStageBackButton';
import { PlanetFacilityTabBar } from '../../src/ui/planetFacility/PlanetFacilityTabBar';
import { useArcNarrativeOverlay } from '../../src/ui/overlay/useArcNarrativeOverlay';
import type { ArcNarrativeOverlayConfig } from '../../src/ui/overlay/useArcNarrativeOverlay';
import { resolveNpcCaptainPortraitSource } from '../../src/game/npcCaptainPortraitAssets';

const TAVERN_BOTTOM_STAGE_RESERVE_PX = PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX;

function formatPostedAt(postedAtMs: number): string {
  const now = Date.now();
  const d = new Date(postedAtMs);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (now - postedAtMs < 24 * 60 * 60 * 1000) return `오늘 ${hm}`;
  if (now - postedAtMs < 48 * 60 * 60 * 1000) return `어제 ${hm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}

export default function TavernScreen() {
  const player = usePlayerStore((s) => s.player);
  const notices = useTavernBoardStore((s) => s.notices);
  const currentPlanetId = player?.currentPlanetId ?? null;
  const [hostDialogVisible, setHostDialogVisible] = useState(false);
  const [hostDialogDone, setHostDialogDone] = useState(false);
  const boardMeta = useMemo(
    () => `자동 갱신 · 공지 ${notices.length}건`,
    [notices.length],
  );
  const tavernHostCaptain = useMemo(() => {
    const retiredPool = NPC_CAPTAINS_FROM_CSV.filter((captain) => captain.tavernPlanetIds.length > 0);
    if (retiredPool.length === 0) return null;
    if (currentPlanetId) {
      const direct = NPC_CAPTAINS_FROM_CSV.find((captain) => captain.tavernPlanetIds.includes(currentPlanetId));
      if (direct) return direct;
      const hash = Array.from(currentPlanetId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      return retiredPool[hash % retiredPool.length] ?? retiredPool[0] ?? null;
    }
    return retiredPool[0] ?? null;
  }, [currentPlanetId]);
  const hostGreeting = useMemo(() => {
    if (!tavernHostCaptain) return '';
    const nickname = player?.nickname ?? '파일럿';
    return `어서오세요! ${nickname} 함장님`;
  }, [player?.nickname, tavernHostCaptain]);
  const tavernHostImage = useMemo(
    () =>
      resolveNpcCaptainPortraitSource(tavernHostCaptain?.portraitImageAssetKey)
      ?? resolveNpcCaptainPortraitSource('assets/images/npc/mia_bello_char002.png')
      ?? undefined,
    [tavernHostCaptain?.portraitImageAssetKey],
  );

  useEffect(() => {
    setHostDialogDone(false);
    if (!tavernHostCaptain) {
      setHostDialogVisible(false);
      return;
    }
    setHostDialogVisible(true);
  }, [tavernHostCaptain]);

  // 같은 행성에서 선술집을 다시 열어도 주인장 인게임 대화창을 재표시한다.
  useFocusEffect(
    useCallback(() => {
      if (!tavernHostCaptain) return;
      setHostDialogDone(false);
      setHostDialogVisible(true);
    }, [tavernHostCaptain]),
  );

  const safeBack = useSafeRouterBack();
  const stageFrameReady = useStageFirstFrameReady();
  usePlanetSubStageMemory('tavern', () => {
    setHostDialogVisible(false);
    setHostDialogDone(false);
  });

  const tavernNarrativeConfig = useMemo((): ArcNarrativeOverlayConfig | null => {
    if (!tavernHostCaptain) return null;
    return {
      anchor: 'bottom',
      label: `[ 선술집 주인 · ${tavernHostCaptain.displayName} ]`,
      text: hostGreeting,
      typewriterKey: `${tavernHostCaptain.id}:${player?.nickname ?? 'pilot'}`,
      typewriterSpeedMs: 42,
      onTextComplete: () => setHostDialogDone(true),
      imageSource: tavernHostImage,
      onPressNext: () => setHostDialogVisible(false),
      nextDisabled: !hostDialogDone,
      buttonText: '[ 확인 ]',
    };
  }, [tavernHostCaptain, hostGreeting, hostDialogDone, tavernHostImage, player?.nickname]);

  useArcNarrativeOverlay(
    'tavern-host-greeting',
    hostDialogVisible && Boolean(tavernHostCaptain),
    tavernNarrativeConfig,
  );

  return (
    <StageShell routeName="tavern" background="none" edges={['bottom']}>
      <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <ArcStageBackButton onPress={safeBack} style={styles.backBtn} />
        <Text style={styles.headerTitle}>선술집</Text>
      </View>

      <PlanetFacilityTabBar
        tabs={[{ id: 'board', label: '공지판' }]}
        activeId="board"
        onSelect={() => {}}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {tavernHostCaptain ? (
          <View style={styles.hostCard}>
            <Text style={styles.hostCardTitle}>— 선술집 주인 —</Text>
            <Text style={styles.hostMeta}>
              {tavernHostCaptain.displayName} · {tavernHostCaptain.rank} (퇴역 함장)
            </Text>
          </View>
        ) : null}

        <View style={styles.boardHeader}>
          <Text style={styles.boardTitle}>— 은하계 소식판 —</Text>
          <Text style={styles.boardSub}>{boardMeta}</Text>
        </View>

        {notices.map((notice) => (
          <View key={notice.id} style={styles.noticeCard}>
            <View style={styles.noticeTopRow}>
              <Text style={styles.noticeTag}>[{notice.tag}]</Text>
              <Text style={styles.noticeTime}>{formatPostedAt(notice.postedAtMs)}</Text>
            </View>
            <Text style={styles.noticeTitle}>{notice.title}</Text>
            <Text style={styles.noticeBody}>{notice.body}</Text>
          </View>
        ))}

        <View style={{ height: TAVERN_BOTTOM_STAGE_RESERVE_PX }} />
      </ScrollView>

      <StageLoadingOverlay visible={!stageFrameReady} overlayId="stage-loading-tavern" />
      </View>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg_panel,
  },
  backBtn: { marginRight: SPACING.sm },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  boardHeader: {
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  hostCard: {
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border_dark,
    borderRadius: 4,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  hostCardTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.info,
    marginBottom: 3,
  },
  hostMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_dark,
  },
  boardTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
  },
  boardSub: {
    marginTop: 3,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
  },
  noticeCard: {
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  noticeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noticeTag: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.info,
    fontWeight: FONTS.weight.bold,
  },
  noticeTime: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_faint,
  },
  noticeTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
    marginBottom: 4,
  },
  noticeBody: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
    lineHeight: 18,
  },
});

