/**
 * 메인 스테이지(행성 허브) 레이아웃 — 단일 기준 모듈
 *
 * - 상단: `StageShell` 여백 + 탑바 + 퀘스트 HUD (포그라운드 스타일과 배경 `paddingTop` 동일 식)
 * - 세로 밴드: 스크롤 예약 ↔ 배경 패딩
 * 퀘스트 HUD는 타 화면에서도 동일 간격을 쓰면 이 모듈에서 가져간다.
 */
import type { ViewStyle } from 'react-native';
import { FONTS, SPACING } from '../utils/theme';
import { STAGE_TOP_INSET_PX } from './layout';

/** `StageShell` 최상단 고정 여백 — 배경 `paddingTop` 첫 항과 동일 */
export { STAGE_TOP_INSET_PX as PLANET_MAIN_SHELL_TOP_SPACER_PX } from './layout';

/** 탑바 하단 보더(포그라운드 `borderBottomWidth`) */
export const PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX = 1;

/** 탑바 세로·가로 패딩(포그라운드 `paddingVertical` / `paddingHorizontal`) */
export const PLANET_MAIN_TOPBAR_PADDING_VERTICAL = SPACING.sm;
export const PLANET_MAIN_TOPBAR_PADDING_HORIZONTAL = SPACING.sm;

/** 탑바 아이콘 버튼 한 변(포그라운드 `width`/`height`) */
export const PLANET_MAIN_TOPBAR_ICON_BUTTON_PX = 34;

/** 탑바 아이콘 버튼 `borderRadius` */
export const PLANET_MAIN_TOPBAR_ICON_BORDER_RADIUS = 8;

/** 탑바 한 줄 세로 점유(포그라운드 실측과 배경 추정 공통) */
export function getPlanetMainTopBarChromeHeightPx(): number {
  return (
    PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX +
    PLANET_MAIN_TOPBAR_PADDING_VERTICAL * 2 +
    PLANET_MAIN_TOPBAR_ICON_BUTTON_PX
  );
}

/**
 * 퀘스트 HUD 컨테이너 여백 — `QuestHUD`와 배경 `paddingTop` 추정에 공통 사용.
 */
export const planetMainQuestHudContainerStyle: ViewStyle = {
  marginTop: SPACING.xs,
  marginHorizontal: SPACING.md,
  paddingHorizontal: SPACING.sm,
  paddingVertical: SPACING.xs,
};

/** 헤더 행(아이콘+제목) 세로 추정 */
const PLANET_MAIN_QUEST_HUD_HEADER_BODY_EST_PX = 26;
/** 목표 2줄 블록 세로 추정 */
const PLANET_MAIN_QUEST_HUD_OBJECTIVE_BODY_EST_PX = 54;

/**
 * 활성 퀘스트 HUD가 있을 때 탑바 아래 추가 세로(추정).
 * = `planetMainQuestHudContainerStyle` 바깥/안쪽 여백 + 본문 블록(배경 `paddingTop`과 동기).
 */
export const PLANET_MAIN_QUEST_HUD_ACTIVE_EST_PX =
  SPACING.xs +
  SPACING.xs * 2 +
  PLANET_MAIN_QUEST_HUD_HEADER_BODY_EST_PX +
  PLANET_MAIN_QUEST_HUD_OBJECTIVE_BODY_EST_PX;

/**
 * 하단 메뉴·파일럿 박스 등 스크롤 하단 스택 높이(기본, 폰트 스케일에 곱함).
 * 배경 `PlanetStageBackground` 루트 `paddingBottom`과 동기 — 값을 줄이면 궤도 슬롯(flex)이 커져 행성이 세로로 밀릴 수 있음.
 */
export const PLANET_MAIN_BOTTOM_STACK_BASE_PX = 300;

/** 배경 `paddingBottom` 하한 */
export const PLANET_MAIN_BOTTOM_CHROME_MIN_PX = 72;

/** 스크롤 상단 투명 예약 — 행성 시야 밴드 기본 높이 */
export const PLANET_MAIN_STAGE_RESERVE_BASE_PX = 360;

/** 접근성 폰트 확대 시 예약 추가분(1pt당) */
export const PLANET_MAIN_RESERVE_PER_FONT_SCALE_PX = 72;

/** 예약 높이 화면 비율 하한 */
export const PLANET_MAIN_RESERVE_MIN_SCREEN_FRACTION = 0.34;

/**
 * 스크롤에서 메뉴·파일럿이 보이도록 남기는 세로 예산(캡 계산용).
 * `stageReservePx` 상한 = windowHeight - 이 값.
 */
export const PLANET_MAIN_SCROLL_CHROME_HEADROOM_PX = 380;

/** 스크롤 하단 확장 예약(파일럿 아래 투명 블록) */
export const PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX = 140;

/** 스캔·게이지 블록 ↔ 무역소 메뉴 행 간격 */
export const PLANET_MAIN_SCAN_MENU_GAP_PX = 5;

/**
 * 하단 도크 — 게이지(20) + 행간(4) + 액션 1행(52)
 * 5열 가로: 행성개발 · 채굴 · 대화 · 수색 · 스캔
 * @see PlanetHubActionGaugeSlot · PlanetHubActionTile · PlanetMainScanActionRow
 */
export const PLANET_MAIN_SCAN_ACTION_BLOCK_EST_PX = 76;

/**
 * 메뉴 행(52) + 헤더 간격(5) + 파일럿 헤더(44)
 */
export const PLANET_MAIN_BOTTOM_DOCK_BASE_PX = 101;

/** 스캔 행 포함 하단 도크 전체 높이 추정 — `ScrollView` `paddingBottom` */
export const PLANET_MAIN_BOTTOM_DOCK_WITH_SCAN_EST_PX =
  PLANET_MAIN_BOTTOM_DOCK_BASE_PX + PLANET_MAIN_SCAN_ACTION_BLOCK_EST_PX;

/** @deprecated 스캔 미포함 도크 — 전투 등 스캔 숨김 시 */
export const PLANET_MAIN_BOTTOM_DOCK_EST_PX = PLANET_MAIN_BOTTOM_DOCK_BASE_PX;

/**
 * 무역소·조선소 등 메뉴 행 + 파일럿 정보만 스크롤 안에서 아래로 내림.
 * 배경 `paddingBottom` / `backgroundChrome`과 무관 — 행성 위치를 바꾸지 않는다.
 */
export const PLANET_MAIN_FOREGROUND_MENU_STACK_OFFSET_TOP_PX = 34;

/**
 * 메인스테이지 전용: 탑바 + 퀘스트 HUD만 시각적으로 위로(translateY, 음수 방향).
 * 레이아웃 점유 높이·`backgroundChrome`·스크롤/하단 UI 박스는 그대로 — 배경 행성 매트릭스와 정렬 유지.
 */
export const PLANET_MAIN_FOREGROUND_TOP_CHROME_LIFT_PX = 10;

/** 궤도 씬(에덴·NPC·채굴 좌표계와 동일해야 함) */
export const PLANET_MAIN_ORBIT_SCENE_SIZE = 320;

/**
 * 궤도 채굴 소행성 경로를 `ORBIT_SCENE` 기하 중심(행성 도트 중심)에 맞춤.
 * `miningOrbitDelta*`의 `tx,ty`에 합산 — 타일·틸트와 별도로 미세 이동만 할 때 사용.
 */
export const PLANET_MAIN_ORBITAL_MINING_ORBIT_BIAS_X_PX = 0;
/** 한 번 더 중심 맞춤(음수 = 화면 위로) */
export const PLANET_MAIN_ORBITAL_MINING_ORBIT_BIAS_Y_PX = -4;

/**
 * 배경 상단 성계명: 줄 수·글자 수에 따라 `systemBadge` 높이가 달라지면 궤도가 세로로 흔들림 → 2줄 분 고정.
 */
export const PLANET_MAIN_BACKGROUND_SYSTEM_NAME_MIN_HEIGHT_PX = Math.round(FONTS.size.md * 1.45) * 2;

/**
 * 배경 AI 클랜 플레이트 슬롯(마크+소유 문구): `systemBadge` 내 고정 높이.
 * `safeAiClanPlate` 스타일과 동일( marginBottom + paddingVertical×2 + 아이콘 22 ).
 */
export const PLANET_MAIN_BACKGROUND_CLAN_PLATE_SLOT_HEIGHT_PX =
  SPACING.sm + SPACING.sm * 2 + 22;

/** 성계명 슬롯과 클랜 플레이트 슬롯 사이 간격 — `systemBadge` 추정에 포함 */
export const PLANET_MAIN_BACKGROUND_CLAN_PLATE_AFTER_NAME_GAP_PX = SPACING.xs;

/**
 * 클랜 마크/소유 슬롯만 시각 이동 — `transform`(레이아웃 점유·배지·궤도 동기 불변).
 * 위치만 손볼 때 이 두 값만 조정.
 */
export const PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_X_PX = 0;
export const PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_Y_PX = 0;

/** 배경 ◇ 함선 마크: 채굴 오버레이에서 숨겨도 열 높이 유지 */
export const PLANET_MAIN_BACKGROUND_PLAYER_SHIP_MARK_SLOT_HEIGHT_PX = 24;

/** 배경 `systemBadge` 첫 줄(구역 뱃지) 추정 높이 — `PlanetStageBackground`와 동기 */
export const PLANET_MAIN_BACKGROUND_ZONE_BADGE_EST_PX = 22;

/**
 * 배경 상단 `systemBadge` 블록 추정(구역 뱃지 + 성계명 + 클랜 플레이트 슬롯).
 * (`territorySubtitle`는 별도·현재 비활성)
 */
export const PLANET_MAIN_BACKGROUND_SYSTEM_BADGE_BLOCK_EST_PX =
  PLANET_MAIN_BACKGROUND_ZONE_BADGE_EST_PX +
  SPACING.sm +
  PLANET_MAIN_BACKGROUND_SYSTEM_NAME_MIN_HEIGHT_PX +
  PLANET_MAIN_BACKGROUND_CLAN_PLATE_AFTER_NAME_GAP_PX +
  PLANET_MAIN_BACKGROUND_CLAN_PLATE_SLOT_HEIGHT_PX;

/**
 * 태블릿에서 배경 `planetColumn`과 동일 스케일.
 */
export function getPlanetMainStageBackgroundScale(width: number, height: number): number {
  const minSide = Math.min(width, height);
  if (minSide < 700) return 1;
  const t = Math.min(1, (minSide - 700) / 380);
  return 1 + t * 0.22;
}

function clampFontScale(fontScale: number): number {
  return Math.min(Math.max(fontScale, 1), 1.28);
}

/**
 * 메인 스테이지 세로 메트릭 일괄 계산.
 * - `stageReservePx` → 포그라운드 `planetStageReserve` minHeight + 채굴 터치 밴드 등
 * - `backgroundChrome` → `PlanetStageBackground` 루트 paddingTop / paddingBottom (배경만)
 */
export function getPlanetMainStageVerticalMetrics(input: {
  windowHeight: number;
  windowWidth: number;
  fontScale: number;
  hasQuestHud: boolean;
}): {
  stageReservePx: number;
  backgroundChrome: { paddingTop: number; paddingBottom: number };
} {
  const { windowHeight, windowWidth, fontScale, hasQuestHud } = input;

  const fontBoost = Math.max(0, Math.round((fontScale - 1) * PLANET_MAIN_RESERVE_PER_FONT_SCALE_PX));
  const fromBase = PLANET_MAIN_STAGE_RESERVE_BASE_PX + fontBoost;
  const tabletBoost = windowWidth >= 900 ? Math.round((windowWidth - 900) * 0.12) : 0;
  const fromScreen = Math.round(windowHeight * PLANET_MAIN_RESERVE_MIN_SCREEN_FRACTION);
  const raw = Math.max(fromBase + tabletBoost, fromScreen);
  const reserveCap = Math.max(200, windowHeight - PLANET_MAIN_SCROLL_CHROME_HEADROOM_PX);
  const stageReservePx = Math.min(raw, reserveCap);

  const topBarH = getPlanetMainTopBarChromeHeightPx();
  const paddingTop =
    STAGE_TOP_INSET_PX + topBarH + (hasQuestHud ? PLANET_MAIN_QUEST_HUD_ACTIVE_EST_PX : 0);
  const paddingBottom = Math.max(
    PLANET_MAIN_BOTTOM_CHROME_MIN_PX,
    Math.round(PLANET_MAIN_BOTTOM_STACK_BASE_PX * clampFontScale(fontScale)),
  );

  return {
    stageReservePx,
    backgroundChrome: { paddingTop, paddingBottom },
  };
}
