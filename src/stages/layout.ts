/**
 * 스테이지 공통 레이아웃 상수
 * - 화면 최상단 “의도적 공백(카메라/시스템 UI 여유)”은 모든 스테이지에서 동일하게 유지
 */
export const STAGE_TOP_INSET_PX = 72;

/**
 * 하단 최소 여백(px). `expo-navigation-bar`로 내비를 숨기면 `insets.bottom`이 0에 가깝게 나와
 * 메인 스테이지 하단 공백이 사라질 수 있어, 시스템 값이 작을 때만 보충한다.
 * (StageShell: SafeArea 하단 + 보충으로 합산 ≈ max(insets.bottom, 이 값))
 */
export const STAGE_BOTTOM_MIN_INSET_PX = 54;
