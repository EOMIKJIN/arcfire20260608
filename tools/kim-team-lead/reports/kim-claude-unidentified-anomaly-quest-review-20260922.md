# 미확인 이상현상 퀘스트 설계 — 전수 검사 · 유지조건/퀘스트 유지시간 보완 (2026-09-22)

```text
status=PENDING
task_id=unidentified-anomaly-quest-design-review-20260922
kind=DESIGN_REVIEW (코드 변경 0 — 설계 문서만 검토. 구현 없음)
대상=docs/UNIDENTIFIED_ANOMALY_QUEST_DESIGN.md (김팀장 · 2026-09-22 13:14 · 코드 미착수)
초점=대표님 지시 — 유지조건·퀘스트 유지시간 보완
```

## 0. 총평

설계 골자(트랙 분리·자격 3조건·동시1·일2·보라 링 재사용·`collect_item` DSL 신설·유물 훅만)는 기존 계약과 잘 맞물린다. **다만 "얼마나 오래 떠 있는가"·"만료·완료 때 무엇이 정리되는가"를 결정하는 유지조건 쪽에 구멍이 3개** 있다 — 설계 의도(§6-1 "링 소거"·§9 "만료: … 링 소거")를 실제로 수행할 코드 경로가 지정돼 있지 않거나, 기존 헬퍼가 새 접두사(`arc_anom_`)를 모른다. 코드 없이 설계 단계에서 잡는 게 싸게 먹히는 항목들이라 구현 착수 전에 문서에 반영을 권한다.

## 1. [P1] 두 스토어의 만료 동기화 지점이 설계에 없음

퀘스트 진행은 `missionStore.progresses['arc_anom_...']`(제한시간 `expiresAtMs`, 기존 만료 워치가 벽시계로 스윕)에 있고, 링·동시1슬롯·미수락 TTL은 **별도 스토어** `arcfire_unidentified_anomaly_v1.active`(§8-2)에 있다. 설계는 "만료 시 … 링 소거"(§9)라고만 쓰고 **어느 쪽이 트리거하는지** 정하지 않았다.

- 미션 만료 워치(`missionExpireRealtimeWatch.ts` 계열)가 `arc_anom_*` progress를 지워도, `arcfire_unidentified_anomaly_v1.active`는 자동으로 안 지워진다 — **별개의 저장소**이기 때문이다.
- 그 결과 진짜 발생 가능한 결함: 수락 후 48h가 지나 미션은 `complete`/삭제됐는데 anomaly 스토어의 `active`는 그대로 남아 **동시1 슬롯이 계속 잠기고 보라 링도 안 사라짐** — 이후 신규 스폰(트리거 A/B)이 영구히 막힘.
- **보완**: 미션 만료 스윕이 `arc_anom_*`를 지울 때 콜백으로 anomaly 스토어를 함께 정리하거나(권장 — 기존 `afterCaptainPersonalMissionSettled` 패턴과 동일하게 `missionStore`에 `arc_anom_` 전용 after-settle 훅 추가), 아니면 anomaly 스토어가 **자기 소유의 realtime watch**(이번 세션에 검수한 `planetDevJobRealtimeWatch.ts`/`missionExpireRealtimeWatch.ts`/`barPatronageExpireRealtimeWatch.ts`와 동일한 전역 setTimeout 패턴)를 따로 갖고 `unacceptedExpiresAtMs`뿐 아니라 **수락 후 48h도 자체적으로 다시 계산**해 정리한다. 후자가 더 안전하다 — 두 스토어가 서로의 내부 필드를 몰라도 되게 분리된다.
- 부팅 시 리컨사일도 필요: 앱이 며칠 꺼져 있다가 켜졌을 때, `active`가 이미 만료(TTL이든 48h든)인 채로 로드되면 **부팅 직후 1회** 정리하고 새 스폰 여지를 여는 로직이 있어야 한다(§8-3 PSS가 "전역 1 timeout"만 언급하고 부팅 캐치업은 언급 안 함).

## 2. [P1] `collect_item`이 기존 만료 화물회수 대상에서 빠짐 — §6-1 자체 모순

§6-1: "퀘스트 유물이 인벤에 있으면 **회수(삭제)**해 이벤트 전용 아이템이 남지 않게 한다"고 명시했지만, 이 회수는 실제로 `missionTimeLimit.ts`의 `collectMissionCargoRemovals` → `isCargoObjective`가 수행하는데, 그 함수는

```ts
function isCargoObjective(type: MissionObjective['type']): boolean {
  return type === 'buy_goods' || type === 'deliver_cargo';
}
```

로 **정의가 고정**돼 있다(`src/missions/missionTimeLimit.ts:101-103`). 신설 타입 `collect_item`은 여기 없다. **설계가 요구하는 동작(만료 시 유물 회수)을 지금 기술한 대로 구현하면 실제로는 회수되지 않는다.** 구현 단계(§10 P2)에서 `isCargoObjective`에 `collect_item`을 추가하거나, `collect_item` 전용 회수 경로를 새로 만들어야 한다는 점을 P2 게이트에 명시해야 한다.

## 3. [P1] `arc_anom_`이 기존 "퀘스트 트랙" 판별 헬퍼들에 안 걸림 → 유지 기간 동안 UI에서 사라질 수 있음

설계 §2 "판정: `isUnidentifiedAnomalyMissionId` — HUD 트랙은 quest 부선"이라고만 쓰고, 실제로 quest 취급을 하는 코드는 **접두사별로 흩어진 OR 목록**이라 하나하나 추가해야 한다는 사실이 빠져 있다. 확인한 목록:

| 파일:함수 | 현재 인식 접두사 | `arc_anom_` 포함 여부 |
|---|---|---|
| `missionTrack.ts:isQuestMissionId` | `sandbox_`만 | ❌ |
| `missionTrack.ts:resolveMissionTrack` | tutorial/main_story/`isQuestMissionId`/개인 | ❌ (null 반환) |
| `missionStore.ts:findFallbackActiveMissionId` | main_story·`isQuestMissionId`·`isArcCoreInstanceMissionId`·개인 | ❌ |
| `barMissionBoard.ts:listActiveQuestStatusRows`/`listCompletedQuestStatusRows` | `isQuestMissionId` 또는 `isArcCoreInstanceMissionId` | ❌ |

`missionHudSlots.ts`/`listActiveMissionBundles`(트랙 무관, `status==='active'`만 봄)는 문제없이 뜬다. 하지만 **바의 "진행 중 의뢰"·"완료" 상태 탭**과 **다른 주선 미션 완료 후 activeMissionId 승계**는 위 표의 헬퍼를 쓰므로, 수락한 이상현상 퀘스트가 유지되는 동안:

- 바 상태 탭에서 안 보임(수락도·완료도 어느 목록에도 안 잡힘)
- 이 퀘스트가 `activeMissionId`인 상태에서 다른 주선(튜토리얼/메인스토리)이 끝나면, fallback 로직이 이 퀘스트를 후보로 안 봐서 **주선이 갑자기 사라진 것처럼 보임**(quest 진행은 살아있는데 HUD 핀만 놓침)

**보완**: 구현 착수 시 `isUnidentifiedAnomalyMissionId`를 위 4개 지점(과 비슷한 패턴이 더 있을 수 있으니 `grep isArcCoreInstanceMissionId`로 재확인)에 OR로 추가하는 것을 P1 체크리스트에 명시해야 한다. 설계 문서 §2에 "판정 함수 이름"만 있고 "어디에 꽂아야 하는지"가 없다.

## 4. [P2] 미수락 TTL — "그날 KST 종료 또는 12시간 중 짧은 쪽"의 불공평 구간

§3-2 식대로면 23:00 KST에 스폰되면 TTL은 **약 1시간**(자정까지), 00:30 KST에 스폰되면 **12시간** 전부 받는다 — 스폰 시각에 따라 실사용 가능 시간이 최대 12배 차이난다. 오프라인 플레이어는 저녁 늦게 스폰된 이벤트를 사실상 놓친다. 게다가 이 스폰은 **일일 2회 예산 중 하나를 이미 소비**했으므로(§3-2 "발동 횟수"), 하루의 방문 타이밍이 나쁘면 그날 예산 절반이 사실상 버려진다.

**보완안(택1, 구현 전 결정 필요)**:
- (a) TTL을 자정 컷 없이 고정 `unacceptedTtlHours=12`만 적용(날짜 경계 넘어가도 됨). 대신 자정 넘어간 뒤의 "오늘 스폰 카운트"는 스폰 **시각** 기준으로 이미 고정(스토어에 `spawnDayKeyKst` 스냅샷)이므로 이중 집계 문제는 없음.
- (b) 자정 컷을 유지하되 최소 바닥 시간(예: 3~4h)을 보장 — `min(자정까지, 12h)`가 바닥 미만이면 바닥으로 올림.
문서에 어느 쪽인지 확정해 §3-2에 명문화 권장.

## 5. [P2] 동시 1 슬롯이 "수락 후 48h 전체"를 잠금 — 포기 경로 없음

동시성 규칙(§3-2 "listed 또는 accepted 이벤트가 있으면 추가 스폰 없음")과 수락 제한시간(48h)을 합치면, 플레이어가 수락만 해놓고 방치하는 경우 **은하 전역 이상현상 시스템이 최대 이틀간 통째로 멈춘다**(그동안 일 2회 스폰 예산이 있어도 신규 이벤트가 안 뜸). 30% 확률·수색 상한 100회/일이라 대부분 당일 클리어되겠지만, 설계상 **포기(abandon) 경로가 없다** — 이는 이번 세션에서 별도로 지적한 기존 퀘스트 시스템 공통 공백(포기 기능 전무)과 겹친다.

**보완안**: 이 퀘스트에 한해서라도 "연구원에게 재대화 시 포기 가능 → 동시1 슬롯 즉시 반납" 같은 최소한의 탈출구를 P1 범위에 넣을지 대표님/김팀장 판단 필요. 최소한 문서에 "포기 없음 — 방치 시 최대 48h 잠김은 의도"라고 **명시적으로 승인 표시**는 남겨야 한다(현재는 언급 자체가 없어 설계 누락인지 의도인지 구분이 안 됨).

## 6. [P2] 트리거 B(일일 2번째)의 재당첨 배제가 없음

§3-3 트리거 B는 "이미 식별된 외곽 풀에서 가중 추첨 1행성"이라고만 되어 있어, **이미 이상현상을 완료/만료시킨 행성이 그대로 다시 후보 풀에 남는다.** late 밴드 행성 수가 적은 초반 세이브에서는 같은 행성이 반복 당첨되는 파밍 루프가 생길 수 있다.

**보완**: 최근 N일 이내 완료/만료된 행성은 풀에서 제외(또는 가중치 0)하는 조항을 §3-3에 추가 권장. anomaly 스토어에 최근 이력(행성id·해소시각) 몇 건만 보관하면 됨 — 계정 초기화(`purgeLocalAccountData`) 대상에 포함.

## 7. [P3] 로컬 전용 저장 명시 필요

`arcfire_unidentified_anomaly_v1`가 계정 로컬 저장(AsyncStorage)이라는 것은 §8-2 문맥상 자명하지만, CLAUDE.md 절대금지 2번(Firestore `onSnapshot`·실시간 멀티플레이 동기화)에 걸리는 오해를 예방하려면 "Firestore 미동기화, player 프로필 단발 write에도 포함 안 함(또는 포함함)"을 한 줄로 명시해 두는 편이 구현자에게 안전하다. (수색 시스템 감사 때 동일 항목을 명시적으로 확인했던 것과 같은 이유.)

## 8. 그 외 사소한 확인 필요 (코드 착수 시 확정)

- `tq_anom_01.timeLimitHours=48`이 `arc_anom_*` 클론 시 그대로 복사되는지 — 기존 `cloneMissionFromTemplate`(바 인스턴스)는 `...template` 스프레드라 자동 승계되지만, 이상현상 전용 클론 함수를 새로 만든다면 이 필드 누락 주의.
- 일일 스폰 카운터(`spawnCountToday`/`spawnDayKeyKst`) 리셋은 `planetSalvageSearchDaily.ts`의 dayKey 비교 패턴(같은 날 아니면 0으로 리셋)을 그대로 재사용 권장 — 문서에 리셋 로직이 명문화돼 있지 않음.

## 9. 요약 — 유지조건·유지시간 관련 확정 필요 목록

| # | 항목 | 등급 | 결정 필요 |
|---|---|---|---|
| 1 | 미션 만료↔anomaly 스토어 동기화(부팅 캐치업 포함) | P1 | 수정 방식 |
| 2 | `collect_item` 만료 회수 미지원 | P1 | 구현 시 `isCargoObjective` 확장 |
| 3 | `arc_anom_` 트랙 헬퍼 미배선(바 탭·fallback) | P1 | 구현 체크리스트 반영 |
| 4 | 미수락 TTL 자정 컷 불공평 구간 | P2 | (a)/(b) 택1 |
| 5 | 동시1 슬롯 48h 잠금·포기 경로 없음 | P2 | 포기 기능 범위 포함 여부 |
| 6 | 완료 행성 재당첨 배제 없음 | P2 | 제외 조항 추가 여부 |
| 7 | 로컬 전용 명시 | P3 | 문서 한 줄 추가 |

**김팀장(Cursor 본창) 검수 요청** — 위 1~3은 설계를 그대로 구현하면 실제로 어긋나는(문서가 말한 동작과 코드가 다르게 동작하는) 항목이라 착수 전 문서 보완을 권한다. 4~6은 밸런스/UX 결정이 필요한 항목으로 승인 체크(§12)에 추가할지 판단 요청.
