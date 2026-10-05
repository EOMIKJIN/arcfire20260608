# 김클로드 검수 — 「플레이어 웨이브 패배 → 크림슨 점령 + 기함 아르카디아」 설계 v0.1

```text
task_id=review-wave-defeat-crimson-home-20261005
대상=docs/combat/PLAYER_WAVE_DEFEAT_CRIMSON_AND_HOME_DESIGN.md (김팀장 v0.1 · 구현 금지)
kind=REVIEW (코드 변경 0)
판정=AGREE (대표님 지시 반영 정확) · 구현 전 결정·보완 6건
```

## 1. 대표님 지시 반영 — AGREE

| 지시 | 설계 | 판정 |
|---|---|---|
| 내가 직접 체류해 싸운 결과가 우선 | §2-1·2 「직접 전투 승패 우선 · 자동전이 먼저 쓰지 않음」 | ✓ |
| 승리 → 블루 점유 유지 · 그 자리 체류 | §1 표 · §3 승리 | ✓ |
| 패배 → **즉각 크림슨 점유** | §2-3 · §3-2 | ✓ |
| 패배 시 기함 안 부서졌어도 아르카디아 귀환 | §3-4 「전함 유지, 위치만 거점」 | ✓ |
| 파괴됐으면 기존처럼 생존포드 귀환 | §3-3 | ✓ |
| 레드 점령지 체류 불가 | §2-6 | ✓ |

현재 코드와의 차이(§4) 확인: `app/(game)/planet.tsx:1267` `handleWaveDefenseRunEnded` — 지금은 **RED 행성 승리만** 중립화(1301~), 블루 행성 패배는 점유를 쓰지 않음. 설계 서술과 일치.

## 2. §5 충돌 항목 판정

| §5 항목 | 판정 | 근거 / 필요한 결정 |
|---|---|---|
| ① RED 쓰기가 소유권 증서를 비우는가 | **비운다** | `clanWarFoundationStore.applyArcCoreTerritorialHold`(624~) 새 hold에 `deedOwnerClanId: null` · `homePlayerUid: null`. → **플레이어가 증서를 산 행성은 패배 1번에 증서 소멸.** 대표님 결정 필요(소멸이 의도인지, 증서 보유 행성은 별도 규칙인지) |
| ①-b 클라우드 증서 잠금 | **보완 필요** | 반란 전복은 hold 변경 시 `scheduleReleasePlanetUniqueDeedLocks([planetId])` 호출(`applyRebellionOverthrowHold.ts:102`). `applyArcCoreTerritorialHold`는 호출 안 함 → 패배 RED 쓰기 경로에서 로컬 증서는 비고 Firestore 잠금은 남는 불일치 위험. 같은 해제 호출 필요 |
| ② 동적 분쟁 편입 | **결정 필요** | 편입 판단 `wasRedOccupied`는 `handleWaveDefenseRunEnded` 시점에 계산(1288). 설계대로 RED 쓰기가 **결과창 닫힌 뒤**면 이 핸들러는 「원래 블루」로 보고 편입하지 않는다 → 잃은 행성이 탈환 순환(분쟁 풀)에 안 들어감. 패배로 RED가 된 행성을 분쟁 풀에 넣을지 결정 + 편입 호출 위치를 RED 쓰기 단계로 |
| ③ `applyOnPlayerWave=false` | AGREE | `applyTheaterNpcPassSideEffects.ts:29` 플레이어 웨이브는 주둔·승리금 미적용 — 점유만 바꾸는 설계와 맞음 |
| ④ 결과창 vs 레드 체류 퇴거 겹침 | AGREE(조건) | 설계가 「점유 쓰기 + 이동을 결과창 뒤 한 단계」로 묶어 겹침을 피함. 구현 시 기존 「RED 점유 행성 퇴거」(`runCombatEndOutcomeFlow` `shouldSkipMissionClear`·`shouldStopAfterLevelUp` 경로)가 같은 이동을 **두 번** 하지 않게 한 곳으로 |
| ⑤ 승리 블루 유지가 패배 분기에 붙는가 | AGREE | 설계가 결과별 분기를 따로 둠 |

## 3. 추가 보완

| # | 내용 |
|---|---|
| A1 | **중립 행성에서 패배** 규칙 없음 — 설계 표는 「블루였으면」만. 중립에서 크림슨 공격에 지면 RED인지 중립 유지인지 대표님 확인 |
| A2 | 귀환지 하드코딩 — 생존포드 경로는 `resolvePlayerHomePlanetId`(거점, 기본 arcadia·추후 지정 가능 `playerSurvivalPod.ts:48`). 기함 유지 귀환도 같은 함수 사용 권장 |
| A3 | 기함 유지 귀환은 「`currentPlanetId`·`currentSystemId`만 변경」이 아니라 **STAGE 이동**이 따른다 — CLAUDE 규칙: `replace()`만 · 이전 STAGE dispose. 생존포드 귀환의 기존 화면 전환 경로를 재사용 |
| A4 | 퀘스트 R0(대표님 2026-10-04: 기함 격침 = 퀘스트 실패 최우선)와의 관계 — 기함은 살았지만 웨이브에 진 경우 진행 중 퀘스트 처리(실패/유지) 명시 |
| A5 | 플레이봇 반영 — 사람과 같은 과정 원칙상 같은 규칙(패배 → RED + 귀환)이 트윈 `fightHere`/분쟁 처리에도 들어가야 실기·봇 결과가 같아짐 (구현 시 함께) |

## 3-1. 대표님 결정 (2026-10-05)

| 항목 | 결정 | 설계 v0.2 반영 내용 |
|---|---|---|
| ① 소유권 증서 | **패배 시 소유권 삭제·초기화** | 현 `applyArcCoreTerritorialHold`의 `deedOwnerClanId:null`·`homePlayerUid:null` 그대로 + 클라우드 증서 잠금 해제(`scheduleReleasePlanetUniqueDeedLocks`) 필수 |
| ② 잃은 행성 분쟁 편입 | **이전 분쟁 조건과 다른 상황이 아니면 분쟁 로테이션에 다시 들어간다** | 패배로 RED가 된 행성도 기존 동적 분쟁 편입 조건(`promoteDynamicContestedZone` 판정)을 그대로 적용 — 편입 호출을 RED 쓰기 단계로 옮기거나 그 시점에 재판정 |
| A1 중립 행성 패배 | **크림슨 레기온과 전투해서 진 성계는 레드가 된다** (블루·중립 무관) | §1 표·§3 패배 처리의 「블루였으면」 조건 삭제 → 「크림슨 공격 전투 패배 = 그 행성 RED」 |

## 4. 결론

설계는 대표님 지시를 정확히 옮겼다. 구현 착수 전 **대표님 결정 3건**(① 증서 소멸 여부 · ② 잃은 행성 분쟁 풀 편입 · A1 중립 패배)과 **보완 4건**(클라우드 증서 잠금 해제 · 이동 1회화 · 거점 함수·STAGE 전환 · 퀘스트 처리)을 설계에 반영하면 된다.
