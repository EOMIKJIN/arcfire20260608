# 김팀장 UI — 하단 함장정보 탭 터치 영역 가운데 3등분 (2026-10-10)

status: PENDING (김플레이 검수 · 커밋 대기)

## 대표님 지시

하단 함장정보 탭(가로로 긴 바)을 누르다 좌우 무역소·출발 버튼 대신 탭이 눌리는 오터치. 바 전체가 아니라 가로 3등분 중 가운데(「— 함장 정보 —」 글자와 화살표)만 터치되게.

## 변경

- `src/components/planet/PlanetMainPilotInfoPanel.tsx`
  - 바 외형은 그대로 `View`(`headerBtn` 스타일 · 높이 44 · 레이아웃 상수 불변).
  - 터치는 바 안쪽 절대배치 `Pressable`(`headerHitCenter`: left 33.333% · width 33.334% · 세로 전체)만.
  - `hitSlop` 8(사방) → 상하 8 · 좌우 0.
  - 눌림 피드백(opacity 0.9)은 `onPressIn/Out` 상태로 바 전체에 동일 적용.

## 게이트

```text
[pss-pre-dev] hot_path=터치 시에만 · alloc=0(틱 없음) · cache=없음
[pss-pre-dev] stage=허브 도크 UI만 · dispose 변화 없음 · risk=없음
[pss-pre-dev] verdict=PASS
```

- tsc: 본 파일 오류 0. 기존 미커밋 nativeReclaim 3파일의 `scheduleNativeHeapPurgeAfterSettle` 미export 오류 3건은 본 작업과 무관(사전 존재).
- `PLANET_MAIN_PILOT_HEADER_CHROME_PX` 등 상수 미변경.

## 실기 확인 요청

허브 하단: 바 좌·우 1/3 터치 → 반응 없음 · 가운데 터치 → 펼침/접힘.
