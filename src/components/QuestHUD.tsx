import React, { useMemo } from 'react';
import { formatMissionTimeLimitRemaining } from '../missions/missionTimeLimit';
import { useMissionTimeLimitNow } from '../missions/useMissionTimeLimitNow';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { FONTS } from '../utils/theme';
import { TACTICAL_HUB } from '../ui/tactical/tacticalHubTokens';
import { useMissionStore } from '../store/missionStore';
import { useT } from '../i18n';
import { useAppSettingsStore } from '../store/appSettingsStore';
import {
  resolveMissionObjectiveDescription,
  resolveMissionTitle,
} from '../i18n/missionText';
import { resolveMissionTrack, type MissionTrack } from '../missions/missionTrack';
import {
  listAllMissionHudBundles,
  type MissionHudBundle,
} from '../missions/missionHudSlots';
import { resolveHudCurrentObjective } from '../missions/resolveHudCurrentObjective';
import { resolveMainQuestDetailCursor } from '../missions/mainStory/mainStoryDetailSequence';
import { usePlayerStore } from '../store/playerStore';

/**
 * 겹치는 활성 미션(튜토리얼+수락 의뢰 등)이 화면 다른 요소와 겹치지 않게 한 영역 안에서 스크롤.
 * 대표님 지시(2026-08-20): 「헤더(진행 중인 임무) 아래 한 개 미션만 보이고, 나머지는 스크롤」 —
 * 스크롤 영역 높이를 행 1개(제목 1줄+목표 1줄) 높이에 정확히 맞춘다. 여러 개를 동시에 보여주지 않는다.
 */
const QUEST_HUD_ROW_VERTICAL_PAD_PX = 6;
const QUEST_HUD_ROW_TITLE_LINE_PX = 16;
const QUEST_HUD_ROW_OBJECTIVE_GAP_PX = 2;
const QUEST_HUD_ROW_OBJECTIVE_LINE_PX = 16;
/** 구분선도 행 높이에 포함(첫 행은 투명) — 스냅 간격이 행마다 정확히 같아지도록 */
const QUEST_HUD_ROW_DIVIDER_PX = 1;
const QUEST_HUD_ROW_CONTENT_HEIGHT_PX =
  QUEST_HUD_ROW_VERTICAL_PAD_PX * 2
  + QUEST_HUD_ROW_TITLE_LINE_PX
  + QUEST_HUD_ROW_OBJECTIVE_GAP_PX
  + QUEST_HUD_ROW_OBJECTIVE_LINE_PX;
const QUEST_HUD_ROW_UNIT_HEIGHT_PX = QUEST_HUD_ROW_CONTENT_HEIGHT_PX + QUEST_HUD_ROW_DIVIDER_PX;
const QUEST_HUD_SCROLL_THRESHOLD = 1;

function buildQuestHudSnapOffsets(count: number): number[] {
  const offsets: number[] = [];
  for (let i = 0; i < count; i++) {
    offsets.push(i * QUEST_HUD_ROW_UNIT_HEIGHT_PX);
  }
  return offsets;
}

function trackIcon(track: MissionTrack | null): string {
  if (track === 'tutorial') return '📖';
  if (track === 'main_story') return '📜';
  return '📋';
}

/** 진행 중 + 목표 1개 이상 완료 — 행 파생만, persist/틱 없음 */
function hasHudQuestActionUpdate(bundle: MissionHudBundle): boolean {
  if (bundle.progress.status !== 'active') return false;
  const objs = bundle.mission.objectives;
  for (let i = 0; i < objs.length; i += 1) {
    const id = objs[i]?.id;
    if (id && bundle.progress.objectives[id]) return true;
  }
  return false;
}

/** 목록 행 하나 — 헤더 트리트먼트 없음(아이콘+제목 한 줄 + 목표 한 줄) */
function HudMissionRow({
  bundle,
  inventorySlots,
  nowMs,
}: {
  bundle: MissionHudBundle;
  inventorySlots: ReadonlyArray<{ goodId: string; quantity: number } | null> | undefined;
  nowMs: number;
}) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const { mission, progress } = bundle;
  const { objective: incompleteObj, cargoShort } = resolveHudCurrentObjective(
    mission,
    progress,
    inventorySlots,
  );

  const titleText = resolveMissionTitle(mission, locale);
  const objText = incompleteObj
    ? resolveMissionObjectiveDescription(incompleteObj, locale)
    : '';
  const remain =
    progress.status === 'active' && progress.expiresAtMs
      ? formatMissionTimeLimitRemaining(progress.expiresAtMs, nowMs)
      : null;
  const objBase = cargoShort && objText
    ? `${objText} · ${t('mission.hud.cargoShort')}`
    : objText;
  const objLine = remain ? `${remain} · ${objBase}` : objBase;

  const track = resolveMissionTrack(mission.id);
  const detailCursor =
    track === 'main_story' ? resolveMainQuestDetailCursor(mission.id, progress) : null;
  const objWithCursor =
    detailCursor && objLine
      ? `${detailCursor.index1}/${detailCursor.total} ${objLine}`
      : objLine;
  const showUpdated = hasHudQuestActionUpdate(bundle);

  return (
    <View style={styles.row}>
      <View style={styles.rowIconBox}>
        <Text style={styles.rowIcon} allowFontScaling={false}>
          {trackIcon(track)}
        </Text>
      </View>
      <View style={styles.rowTextCol}>
        <Text style={styles.rowTitle} numberOfLines={1} allowFontScaling={false}>
          {titleText}
        </Text>
        {incompleteObj ? (
          <Text style={styles.rowObjective} numberOfLines={1} allowFontScaling={false}>
            ▶ {objWithCursor}
          </Text>
        ) : null}
      </View>
      {showUpdated ? (
        <View style={styles.updatedBadge} accessibilityLabel={t('mission.hud.updated')}>
          <Text style={styles.updatedBadgeText} allowFontScaling={false}>
            {t('mission.hud.updated')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function QuestHUD() {
  const t = useT();
  const progresses = useMissionStore((s) => s.progresses);
  const activeMissionId = useMissionStore((s) => s.activeMissionId);
  const inventorySlots = usePlayerStore((s) => s.player?.inventorySlots);
  const bundles = useMemo(
    () => listAllMissionHudBundles(progresses),
    [progresses],
  );
  // 핀(activeMissionId)을 맨 위로 — 캠페인 우선 정렬은 목록 순서에서 이미 반영됨
  const ordered = useMemo(() => {
    if (!activeMissionId) return bundles;
    const idx = bundles.findIndex((b) => b.mission.id === activeMissionId);
    if (idx <= 0) return bundles;
    const pinned = bundles[idx]!;
    return [pinned, ...bundles.slice(0, idx), ...bundles.slice(idx + 1)];
  }, [bundles, activeMissionId]);
  const snapOffsets = useMemo(
    () => buildQuestHudSnapOffsets(ordered.length),
    [ordered.length],
  );
  const nearestExpiryMs = useMemo(() => {
    let min: number | undefined;
    for (let i = 0; i < ordered.length; i += 1) {
      const exp = ordered[i]!.progress.expiresAtMs;
      if (typeof exp !== 'number') continue;
      if (min == null || exp < min) min = exp;
    }
    return min;
  }, [ordered]);
  const nowMs = useMissionTimeLimitNow(nearestExpiryMs);

  if (bundles.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* 헤더는 화면에 딱 1개만 — 개별 항목은 아래 리스트 행으로만 표시 */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerIcon}>🗒️</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('mission.hud.title')}
          </Text>
        </View>
        <View style={styles.headerCountBadge}>
          <Text style={styles.headerCountText}>{ordered.length}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={ordered.length > QUEST_HUD_SCROLL_THRESHOLD}
        nestedScrollEnabled
        snapToOffsets={snapOffsets}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        bounces={false}
        overScrollMode="never"
      >
        {ordered.map((bundle, i) => (
          <View key={bundle.mission.id} style={styles.rowUnit}>
            <View style={i > 0 ? styles.divider : styles.dividerHidden} />
            <HudMissionRow bundle={bundle} inventorySlots={inventorySlots} nowMs={nowMs} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: TACTICAL_HUB.chromeBg,
    borderWidth: 1,
    borderColor: TACTICAL_HUB.chromeBorder,
    borderRadius: 4,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TACTICAL_HUB.chromeBorder,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  headerIcon: { fontSize: 12 },
  headerTitle: {
    flexShrink: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: TACTICAL_HUB.topBarIconInk,
    letterSpacing: 0.5,
  },
  headerCountBadge: {
    flexShrink: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(210, 216, 224, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCountText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: FONTS.weight.bold,
    color: 'rgba(20, 24, 30, 0.92)',
    letterSpacing: 0.2,
  },
  scroll: {
    height: QUEST_HUD_ROW_UNIT_HEIGHT_PX,
  },
  scrollContent: {
    flexGrow: 0,
  },
  /** 스냅 단위 — 실측이 interval과 어긋나면 2번째부터 스냅이 빠짐 */
  rowUnit: {
    height: QUEST_HUD_ROW_UNIT_HEIGHT_PX,
    overflow: 'hidden',
  },
  row: {
    height: QUEST_HUD_ROW_CONTENT_HEIGHT_PX,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: QUEST_HUD_ROW_VERTICAL_PAD_PX,
    overflow: 'hidden',
  },
  rowIconBox: {
    width: 16,
    height: QUEST_HUD_ROW_TITLE_LINE_PX,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowIcon: { fontSize: 13, lineHeight: QUEST_HUD_ROW_TITLE_LINE_PX, includeFontPadding: false },
  rowTextCol: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: QUEST_HUD_ROW_TITLE_LINE_PX,
    height: QUEST_HUD_ROW_TITLE_LINE_PX,
    color: TACTICAL_HUB.chromeInk,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  rowObjective: {
    marginTop: QUEST_HUD_ROW_OBJECTIVE_GAP_PX,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_HUB.topBarIconInk,
    lineHeight: QUEST_HUD_ROW_OBJECTIVE_LINE_PX,
    height: QUEST_HUD_ROW_OBJECTIVE_LINE_PX,
    includeFontPadding: false,
  },
  updatedBadge: {
    flexShrink: 0,
    alignSelf: 'center',
    height: 14,
    minWidth: 14,
    paddingHorizontal: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(210, 216, 224, 0.22)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(210, 216, 224, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updatedBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: FONTS.weight.bold,
    color: TACTICAL_HUB.tileIconLedActive,
    letterSpacing: 0.15,
    includeFontPadding: false,
  },
  divider: {
    height: QUEST_HUD_ROW_DIVIDER_PX,
    backgroundColor: TACTICAL_HUB.chromeBorder,
    marginHorizontal: 8,
  },
  /** 첫 행 위 — 구분선과 같은 높이만 차지(투명), 스냅 간격을 행마다 동일하게 유지 */
  dividerHidden: {
    height: QUEST_HUD_ROW_DIVIDER_PX,
    backgroundColor: 'transparent',
  },
});
