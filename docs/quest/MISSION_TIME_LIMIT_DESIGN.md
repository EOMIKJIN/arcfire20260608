# 퀘스트 제한시간 — 구현 (2026-08-25)

> **상태**: 1.1안 구현. 표시 `1day (24h)` · 설명/할당 남은시간 · 만료 시 해당 미션 화물 삭제 · 인스턴스 보드 `listed` 복귀.  
> **전제**: 개발규칙 1순위 PSS · 화면 전용 `setInterval` 금지 · Table-First.

```text
[pss-pre-dev] hot_path=수락/허브진입/바탭/부트로드/일일배치 1회 스윕
[pss-pre-dev] alloc=활성 progress만 순회(통상 <10) · persist는 만료 있을 때만 1회
[pss-pre-dev] stage=허브/바/차원항로 · risk=P1·P6 · verdict=PASS
```

---

## 0. 확정 (대표님 1.1안)

| 항목 | 결정 |
|---|---|
| 트랙 | 튜토리얼 `mission_*` · 메인 `story_*` = **0 (없음)**. 샌드박스·ArcCore 인스턴스 = 성격별 1~3일 |
| 만료 화물 | **해당 미션의 buy_goods / deliver_cargo만 삭제**. 전역 quest 태그 와이프 없음 |
| 인스턴스 보드 | 만료 후 같은 의뢰 `accepted` → **`listed` 복귀** |

바 시설 바운티(`barBountyGenerator.expiresAtMs`)와 **다른 축**.

---

## 1. 시간 (벽시계)

| 성격 | `timeLimitHours` | 표시 |
|---|---|---|
| combat | 24 | `1day (24h)` |
| travel / explore / mixed / event / trade | 48 | `2day (48h)` |
| delivery | 72 | `3day (72h)` |
| 명시 `0` | 0 | 제한시간 없음 |

수락 시 `expiresAtMs` 스냅샷. 이후 CSV 변경은 이미 수락한 건에 소급하지 않는다.  
이 기능 이전에 수락된 활성 의뢰는 `startedAt + timeLimitHours`로 1회 백필한다.

---

## 2. 데이터

- `tables/content/missions.csv` — `timeLimitHours` 컬럼 (기존 제목·보상·목표 미변경)
- `tables/content/mission_time_limit_policy.csv` — 컬럼 비었을 때 트랙+성격 폴백
- `MissionProgress.expiresAtMs?`

---

## 3. 만료 (`sweepExpiredMissions`)

활성만. `now >= expiresAtMs`이면:

1. `progresses` 키 삭제 (complete/failed로 남기지 않음)
2. `activeMissionId` 승계 또는 null
3. 클리어 대화 대기열에서 제거
4. `arc_inst_*` 보드 `accepted` → `listed`
5. 그 미션 화물만 인벤에서 best-effort 삭제 후 persist
6. 1건 이상이면 `showArcAlert` 1회 (부트 로드는 알림 보류 → 차원항로/허브에서 flush)

---

## 4. 스윕 시점

`loadLocalMissions`(알림 없음) · `runContinueSessionPrewarm` · 허브 착륙 sync · 바 미션현황/신규의뢰 탭 · 수락·목표완료 직전 · 일일 배치 백스톱.

HUD 남은 시간: 공유 시계 1개(구독 0이면 해제). 1시간 미만 1초, 그 외 30초. persist 없음.

---

## 5. UI

- 설명: `제한시간 1day (24h)` / `제한시간 없음`
- 진행 중: `남은 시간 0day (18h)` (1시간 미만 `0day (0h 12m)`)
- QuestHUD: 목표 줄에 `▶ 0day (18h) · 목표` — 행 높이 상수 유지
