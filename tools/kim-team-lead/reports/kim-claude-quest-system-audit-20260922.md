# 퀘스트 시스템 정밀 전수 조사 + 김팀장 리팩토링 설계 재검수 (2026-09-22)

```text
status=PENDING
task_id=quest-system-audit-and-redesign-review-20260922
kind=AUDIT + DESIGN_REVIEW   (코드 변경 0 · 임시 스크립트 전량 삭제)
대상 정본=docs/코드작업을_위한_퀘스트_시스템_리팩토링.md (김팀장 · 2026-09-22 04:07 · 코드 미착수)
self-check=코드 diff 없음 → tsc 해당 없음
```

## 0. 결론 (한 장)

1. **김팀장 설계의 "병목 = 전량 순회·persist" 진단은 방향은 맞지만 크기가 작다.** 실측상 1단계의 핵심(활성 id 인덱스·타입 버킷)은 이득이 거의 없다. 반면 **설계가 다루지 않은 더 큰 결함**을 코드에서 확인했다 (§2 A).
2. **P0 후보 1건**: 주간 보드 갱신 후 **인스턴스 id가 재사용**되어, 이전에 완료한 id와 충돌 → 새 의뢰가 「완료」로 표시되고 수락 불가 (§2 A1).
3. **설계 1단계 §5-1-③(1.5초 코얼레스)는 그대로 넣으면 보상 이중 지급 창을 키운다** (§2 A2). 수정안 제시.
4. 일반 모바일 게임 대비 부족 요소 12건 (§4).

## 1. 김팀장 설계 재검수 (AGREE / PARTIAL / DISAGREE)

| # | 김팀장 전제 | 판정 | 근거 |
|---|---|---|---|
| 1 | 진행 blob 하나(`arcfire_missions_v1`)에 완료까지 보관, 이벤트마다 전체 stringify | **AGREE** | `missionStore.ts:567-571` |
| 2 | `listActiveMissionBundles`가 완료 키까지 순회 | **AGREE (사실) / 이득 DISAGREE** | `missionActiveBundles.ts:13`. 실측: N=3000에서 순회 **0.05ms**, N=336에서 0.002ms. 인덱스·타입 버킷(§5-1 ①②)은 복잡도만 늘고 체감 이득 없음 |
| 3 | persist가 sweep·완료로 이중 쓰기 | **PARTIAL** | backfill이 바뀔 때만 (`missionStore.ts:527-530`). 정상 상태에선 이벤트당 1회. 만료 발생 이벤트에서만 2회 |
| 4 | 클라우드 동기화가 비코얼레스 (P6) | **DISAGREE** | `userCloudSyncSchedule.ts:8-18` 이미 900ms 디바운스 + 최소 120초 간격. 설계 §7의 "1.5초 지연" 논거는 무의미 |
| 5 | 앱이 죽으면 클리어 대사가 다시 안 뜬다 (§2-3) | **DISAGREE** | `missionStore.ts:492-507` 하이드레이트가 active·전목표완료 진행에서 대사를 복구, `planetHubTalkRoster.ts:109` requeue도 있음. 진짜 위험은 **대사 미복구가 아니라 보상 재지급** (§2 A2) |
| 6 | 백그라운드 이탈 시 기존 flush 지점에 미션 flush 추가 (§6-4) | **PARTIAL** | 전역 flush 지점이 **없다**. `_layout.tsx:324` AppState 핸들러는 `active`만 처리, flush는 `planet.tsx:375`(허브 화면 한정)·`worldmap.tsx:767`(월드맵 한정). 새 리스너 필요 |
| 7 | 계정 초기화 시 대기 쓰기 flush (§5-1 ③) | **DISAGREE (방향 반대)** | reset은 **cancel**이어야 한다. flush 뒤 `removeItem`이면 순서 의존, 타이머가 reset 이후 발화하면 키가 재생성돼 게이트 "초기화 후 키 없음" 실패 |
| 8 | 2단계 저장 형식 분리 필요 | **PARTIAL** | 진행 누적 문제는 실재하나(§2 B1), 현재는 id 재사용 버그가 우연히 상한을 만들고 있다. 형식 분리 전에 **id/정리 정책**을 먼저 정해야 함 |
| 9 | 계정 초기화가 미션·보드·스토리 진행을 함께 지움 | **AGREE** | `localAccountReset.ts` |
| 10 | 목표 boolean 유지·MissionEngine 미연결 | **AGREE** | 스토어 경로만 사용, `deliver_cargo`는 CSV 사용 0행 (objectives 91행: reach_system 30 · buy_goods 27 · defeat_enemy 25 · reach_planet 6 · talk_npc 3) |

## 2. 신규 발견 (설계 문서에 없음)

### A. 정확성·안정성

**A1 [P0 후보] 주간 갱신 후 인스턴스 id 재사용 → 새 의뢰가 「완료」·수락 불가**
- `refreshArcCoreInstanceMissionBoardState`(`arcCoreInstanceMissionGenerator.ts:124`)는 `accepted`만 남기고 `listed`·`cleared`를 삭제. 발동 조건: listed ≥ 7 이고 사이클 7일 경과 (`:111-118`) — 일일 배치에서 매주 발동.
- id는 `arc_inst_<행성>_<seq 2자리>` (`arcCoreInstanceMissionIds.ts:8-12`)이고 `allocateUniqueArcCoreInstanceId`는 **현재 보드에 남은 id만** 회피. cleared가 지워지면 `_01`부터 재발급.
- 진행 키 = 미션 id = instanceId (`arcCoreInstanceMissionResolver.ts:49`). 완료 진행(`status:'complete'`)은 **어디서도 지워지지 않음**(만료만 삭제 `missionTimeLimit.ts:191-197`, 일일 배치는 progresses 미접촉).
- 결과: 재발급 id 수락 시 `already_complete` (`missionStore.ts:666`) → 문구 `bar.newMissions.acceptFailComplete`. 신규 의뢰 목록에서도 `resolveQuestOfferState`가 `completed`로 표시 (`barMissionBoard.ts:148,273`).
- **재현 수준**: 순수 id 함수로 재현(완료 `_01~_03` → 갱신 후 `_01~_03` 재발급, 충돌 3/3). 스토어 통합 E2E는 generator가 RN 모듈을 끌어와 tsx에서 실행 불가 → **코드 경로 확정, 통합 재현은 미실시**. 실기 세이브에서 `cycleStartedAtMs`가 7일 지난 보드와 완료 진행 교차 확인 권장.
- 영향: 주 단위로 완료 id가 누적 → 갱신마다 앞 k칸 수락 불가, 시간이 갈수록 악화.
- 수정 방향(택1): (a) 갱신 시 유지되지 않는 `arc_inst_*`의 `complete` 진행을 미션 스토어에서 정리 + 완료 카운터만 보존 (권장) (b) id에 사이클 번호 포함. (b)는 진행 무한 증가를 풀어버리므로 반드시 정리 정책과 함께.

**A2 [P1] 보상 지급과 미션 완료 저장의 순서·원자성**
- `finalizeMissionCompletion`(`missionStore.ts:873-909`): 메모리 완료 → `applyMissionCompletionRewards`(플레이어 `void ps.persist()` 즉시, `:343`) → `persistMissions`. 두 쓰기는 독립.
- 사이에 프로세스가 죽으면: 지갑은 저장, 미션은 `active`·전목표완료 → 다음 부팅에서 하이드레이트가 대사 복구(`:492-507`) → **보상 재지급**.
- 현재 창은 수 ms. 설계 §5-1 ③의 1.5초 코얼레스를 그대로 적용하면 **창이 1.5초로 확대**.
- 수정: 완료 전이(`finalize`·직접 완료)는 코얼레스 제외하고 **미션 상태를 먼저 await 저장 → 그 뒤 보상**. 목표 진행 boolean·수락은 코얼레스 가능.

**A3 [P2] 화물 회수가 "그 미션이 준 화물"을 구분하지 않음** (`missionTimeLimit.ts:106-128`, `missionStore.ts:551-559`)
- 만료 시 `buy_goods` 목표의 품목을 인벤에서 quantity만큼 제거. 무역용으로 미리 보유한 동일 품목도 차감. 현재 CSV는 27행 모두 quantity가 있어 안전하나, `quantity` 누락 시 `MAX_SAFE_INTEGER` → 그 품목 **전량** 제거되는 잠재 결함.

**A4 [P2] 클라우드 sync 디바운스 드롭** (`userCloudSyncSchedule.ts:13`)
- 마지막 sync 후 120초 이내 타이머가 발화하면 **그냥 return**(재예약 없음). 이 시각의 변경은 다음 `scheduleUserCloudSync` 호출까지 동기화되지 않음. 완료 직후 앱 종료 시 클라우드 최신성 손실 가능. (30분 백업 사이클이 보완)

### B. 효율·용량

**B1 [P2] 진행 blob 크기 — 실측 표**

| N(진행 수) | JSON 바이트 | stringify (데스크톱) |
|---|---:|---:|
| 336 | 97 KB | 0.9 ms |
| 1,000 | 289 KB | 3.3 ms |
| 3,000 | 875 KB | 9.9 ms |

- 진행 1건 ≈ 290 B. 모바일은 통상 5~10배 → 3,000건에서 50~100ms.
- 클라우드 문서(`userDataSync.ts:142-145,173`)에 `progresses` 전량 포함(주석대로 다른 필드는 1MB 대비 캡 적용, 미션만 무상한). 875 KB면 **사용자 문서 1 MiB 한도에 단독 근접** → sync 전체가 실패(`catch`로 삼켜짐). 단 `stageProgress`를 읽어오는 경로는 코드에 없음(쓰기 전용) → 손실이 아니라 **동기화 정지** 위험.
- 현재는 A1 버그 덕에 진행 수가 ≈ 행성 21 × 16 = 336 상한으로 묶여 있음. **A1을 고치는 순간 무한 증가로 바뀌므로** A1 수정과 정리 정책은 한 묶음.

**B2 [P3] 보드 변이마다 전체 재구성** (`arcCoreInstanceMissionBoardStore.ts:47-57` → `syncArcCoreInstanceMissionMaterializedCache` 전 엔트리 clone)
- 코어 개방 행성 **21개**(실측) × ≤16 = ≤336엔트리, clone 1건 0.14ms(데스크톱) → 수락·클리어마다 ≈ 47ms(모바일 추정 수백 ms 이하). 현재 규모에선 무해. **행성 수가 늘면 O(N×P)** — 확장 전 재점검 항목.

**B3 [P3] 완료 이력이 화면에서 사라짐** (`missionCatalog.ts:29-31`, `arcCoreInstanceMissionResolver.ts:79`)
- `cleared` 엔트리는 materialize 제외 → `getMissionById`가 undefined → `listCompletedMissionStatusRows`(`barMissionBoard.ts:125-141`)가 그 행을 건너뜀. **바 의뢰 완료 기록이 「완료」 탭에 뜨지 않음.** 제목·보상 등 이력 스냅샷이 없다.

**B4 [P3] 1.5초 코얼레스 재사용 시 고려**: persist 예약 타이머는 모듈 전역 하나(`playerStore.ts:489`). 미션 전용 타이머를 별도로 두고, reset에서는 cancel, 완료 전이는 즉시 flush.

### C. 테스트 공백
- `missionStore.ts`(수락·완료·만료·하이드레이트·persist) 단위 테스트 **없음**. 있는 테스트는 `missionObjectiveSequence`·`missionCategory`·`missionNeighborReach`·`missionCombatEncounter`·`missionTimeLimit` 등 순수 함수뿐.
- `refreshArcCoreInstanceMissionBoardState` + id 재할당 교차 테스트 없음(A1이 놓친 이유).
- 보상 재지급 회귀 테스트 없음(A2).

## 3. 김팀장 설계 보완 제안 (1단계 재구성)

기존 4단계(활성 id·타입 버킷·코얼레스·flush) 대신:

| 순서 | 항목 | 이유 |
|---|---|---|
| 0 | **A1 수정 + 갱신 시 완료 진행 정리 + 완료 카운터** | 기능 결함 · B1 상한 · 2단계 필요성 재판정 |
| 1 | **A2 완료 전이 원자화**: 상태 먼저 저장→보상, 이중 지급 방지 키(예: `rewardedAt`) | 코얼레스 도입의 선행 조건 |
| 2 | persist 코얼레스(진행 boolean·수락 한정), reset은 cancel, 전역 AppState background flush 신설 | 설계 §5-1 ③ 수정판 |
| 3 | 클라우드 `progresses` 요약·캡(활성 전량 + 완료 최근 N) | B1 |
| — | 활성 id 인덱스·타입 버킷 | **보류** — 이득 실측 무의미 |
| — | 2단계 저장 형식 분리 | 0단계 결과 후 재판정 |

게이트 추가: 갱신 후 재발급 id가 완료 진행과 충돌하지 않음 · 완료 후 강제 종료 시 보상 1회 · reset 후 키 없음.

## 4. 일반 모바일 게임 대비 부족한 퀘스트 요소

현재 있는 것: 시간제한, 수락 상한 없는 다중 활성, 함장 개인 퀘스트, 메인 스토리 골격, 보드 일일 보충, 클리어 대사, 목표 진행 알림.

| # | 부족 요소 | 근거·현황 | 우선 |
|---|---|---|---|
| 1 | **퀘스트 포기/재도전** | 미션 모듈에 abandon 계열 없음 (grep 0). 만료 외 이탈 경로 없음 | 중 |
| 2 | **동시 활성 상한·슬롯 UX** | 수락 상한 코드 없음. HUD 슬롯만 정렬 | 중 |
| 3 | **일일/주간 반복 퀘스트·리셋 스트릭** | 타입에 반복 개념 없음 | 상 (리텐션) |
| 4 | **목표 수량 카운터**(3체 격파 등) | boolean만. `defeat_enemy.quantity` 미사용. 설계도 금지 상태 → 대표님 결정 사항 | 상 |
| 5 | **만료 임박 알림 / 푸시** | `expo-notifications` 사용 0. 만료는 조용히 삭제+사후 알림 | 중 |
| 6 | **신규 의뢰·완료 가능 배지** | 바/퀘스트 배지 setter 사용처 0 | 중 |
| 7 | **자동 경로 안내 / 목표 위치 추적** | HUD는 텍스트 목표. 항로 자동설정 연결 미확인 | 중 |
| 8 | **완료 이력 보존·통계(누적 완료 수·보상)** | B3 — 이력 사라짐. A1 정리 정책과 함께 카운터 필요 | 상 |
| 9 | **보드 수동 새로고침·재굴림·희소 슬롯** | 주간 갱신 고정. 유저 개입 없음 | 하 |
| 10 | **미수령 보상 보관함/재수령** | 보상은 대사 종료 콜백에 결합 (`ingameDialogCompletion.ts:67`). 대사 스킵/중단 경로 복구는 하이드레이트에만 의존 | 중 |
| 11 | **텔레메트리(수락→완료 퍼널, 만료율, 포기율)** | 관련 로깅 미확인 | 중 |
| 12 | **시계 조작 방어** | `expiresAtMs`가 기기 벽시계 (`missionTimeLimit.ts:78`). 시간 되감기로 제한시간 연장 가능 | 하 (싱글 정책 결정) |

## 5. 미확인·한계
- A1: 스토어 통합 E2E 미실행(RN 의존). 순수 id 재현 + 코드 경로만 확정. 실기 세이브 검증 필요.
- 모바일 시간 추정은 데스크톱 실측 ×5~10 가정.
- Firestore 1 MiB 여유는 다른 필드 크기(player·inventory·skillDb) 실측 미실시.
- `deliver_cargo` 인도 UI 연결·타 퀘스트 UI(QuestHUD 상세) 미정밀.
- 조사 중 임시 재현·벤치 스크립트를 만들었고 전부 삭제 확인(`tools/_tmp_*` 0건). 이 작업으로 인한 소스 변경 0.
- "동시 활성 상한 없음"은 `acceptQuestMission` 전 경로와 grep(MAX_ACTIVE 등 0건)으로 판단. 런타임 실측 아님.

## 6. 김팀장(Cursor 본창) 검수 요청 항목
1. A1 P0 인정 여부 및 수정안 (a)/(b) 선택
2. 설계 §5-1 ①② 보류·③ 수정판·④ 신설 리스너 승인
3. 수량 카운터(부족 #4)·반복 퀘스트(#3)는 대표님 결정 사항으로 승격할지

**김팀장(Cursor 본창) 검수 요청.**
