/**
 * 행성개발 오버레이 — 활성 job 진행 UI 갱신 주기.
 * job 완료는 폴링 + 착륙 sync / ArcCore wall tick이 담당.
 * 500ms는 오버레이 열린 동안 초당 2회 전량 리렌더 → Hermes/Views 압력(2026-08-05 전수).
 * 2s면 진행바·남은 시간 인지에 충분하고 할당·리렌더를 4분의 1로 줄인다.
 */
export const PLANET_DEV_ACTIVE_JOB_UI_POLL_MS = 2000;
