# 김플레이 검수 — [개발대응] 버그 리스트 2026-10-07 처리분

- 대상: `docs/buglist/[개발대응] arcfire_bug_list_2026-10-07.md` 의 처리됨 1·8·10·11·13·14
- 검수: 김플레이 · 2026-10-07 19:0x · 코드 수정 없음 (게임 본체 = 김팀장)
- 종합: **조건부 PASS** — 회귀 1건(R14-1) 수정 요청, 리스크 3건 판단 요청

## 게이트

| 항목 | 결과 |
|---|---|
| tsc (client) | PASS |
| 테스트 | questCombatLock 13 · deliveryBuyHold 1 · galaxyMapQuestAcceptMarks 14 · stelliumAnnexEligibility · cancelStelliumColonizeForAnnex 2 · stelliumColonizeEngine 16 · hubCombatEndPresentContract 8 · transitCombatPostFlow 9 — 전부 fail 0 |
| audit:memory:all | PASS (worklet-contract 37/37 · 7/7 · hits=0) |
| 메모리·PSS | 틱·프레임 할당 없음. 새 맵 3개(배달 홀드·튜토리얼 인덱스·함장 순번) 모두 미션/성계 수로 상한 |

## 건별 판정

| # | 판정 | 근거 |
|---|---|---|
| 1 퀘스트 전투 잠금 | PASS | 현재 세부미션만 잠금. 실기 c 단계 결과 팝업은 미측정 |
| 8 홉별 조우 | PASS | 홉마다 1회 롤. 무조우 홉만 애니 전 커밋. `takeTransitCaptainPickOrdinal`은 전투 시작 1회 — HEAD엔 호출이 없어 순번 회전이 죽어 있었는데 같이 살아남 |
| 10 편입·개척 | PASS (리스크 R10) | 개척 미완 시 편입 숨김 · 블루 행성 개척 정리 · 슬롯 반환 |
| 11 대화 같은 창 | PASS | 바 `barPatronageDialog`와 같은 `replaceActiveAdhoc + bypassScreenShell` |
| 13 튜토리얼 녹색 다이아 | PASS | 목표 id 변경 시만 재계산 · CSV 인덱스 모듈 1회 |
| 14 식량 배달 | **PARTIAL** (R14-1 회귀) | 홀드 로직은 맞음. 아래 회귀 |

## 수정 요청

**R14-1 (회귀)** — `reconcileActiveMissionProgressAfterEvent` 에서 `applyLandedMissionObjectives` 호출을 뺐다.
- 첫 세부미션이 수락 행성 도착인 메인퀘가 있다: `story_008`(obj_a draco_haven) · `story_016`(obj_a sirius_border).
- 예전엔 수락 즉시 a 완료. 지금은 떠났다가 다시 착륙해야 완료된다.
- 홀드는 `applyReachSystemMissionObjectives` 안에서 이미 막는다(`isDeliveryReachDeferred`). 그래서 착륙 판정 호출을 되살려도 14번 수정은 유지된다.
- 1안: reconcile 에 `applyLandedMissionObjectives(currentPlanetId)` 복구. buy → 홀드 기록 → landed → reach 보류 순서 그대로.

## 판단 요청 (대표님/김팀장)

- **R14-2** 홀드는 persist 안 함. 같은 성계에서 구매 후 앱 재시작 → 허브 진입 sync 에서 배달이 바로 완료될 수 있다. 빈도 낮음.
- **R8** 홉마다 롤이라 다홉 경로의 조우 확률이 오른다(예: 홉 3개 × 0.3 → 약 66%). 연료는 경로 전체 선불이라 중간 조우 시 남은 구간 연료는 소모된 채다. 중간 성계 통과만으로 배달·도착 목표가 닫힌다.
- **R10** `fail_wait` 재시도에 상한이 없다. 개척이 계속 실패하면 그 행성 편입이 영구히 막힌다.
