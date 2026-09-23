# 미확인 이상현상 퀘스트 설계 v1.1 재검수 — 50:50 위협 전투 통합 리스크 (2026-09-22)

```text
status=PENDING
task_id=unidentified-anomaly-quest-v1.1-review-20260922
kind=DESIGN_REVIEW (코드 변경 0)
대상=docs/UNIDENTIFIED_ANOMALY_QUEST_DESIGN.md v1.1 (김팀장 · 2026-09-22 13:31)
```

## 0. 총평

v1.0 검수(P1×3·P2×3·P3×1) 8건은 문서 §0-A 표대로 **전부 반영 확인**(아래 §1). 다만 v1.1에서 새로 추가된 **50:50 유물/위협 분기 — 특히 §6-3 「미확인 위협 = 이동중형 전투」 통합**은 실제 전투 코드와 대조하니 **그대로 구현하면 동작하지 않는 지점이 3개** 있다. 이 부분이 이번 개정의 본선(§6-0 "이번 개정의 본선")이라 구현 착수 전 재설계가 필요하다.

## 1. v1.0 반영분 — 빠르게 재확인 (충분)

| # | 김팀장 반영 | 확인 |
|---|---|---|
| 1 `settleAnomalyEvent` | §8-4에 4단계 + 4개 호출지점(after-settle 훅·자체 timeout·hydrate/AppState·UI 직접) | **거의 충분**. 다만 pseudocode가 "1) active=null … 4) 정리"를 직선 나열이라, **이미 정리된 이벤트에 두 트리거가 거의 동시에 들어오면** `recentResolved`(§3-3 쿨다운 이력)가 중복 push 될 수 있다. 함수 맨 앞에 "이 instanceId가 이미 active와 다르면 즉시 return"류 가드를 명문화 권장(P3 — idempotent라는 선언과 실제 가드는 별개) |
| 2 `collect_item`→`isCargoObjective` | §6-1·§10 P2 게이트 명시 | 확인. 실제 `missionTimeLimit.ts:101-103` 정의와 일치 |
| 3 트랙 헬퍼 배선 | §2-1 표 8곳 | 확인. `missionTrack.ts`·`questCombatLock.ts:lookupMissionForQuestLock` 실제 코드와 대조해 봤고 목록이 맞다 |
| 4 TTL 12h 고정 | §3-2 | 확인 |
| 5 포기(이 퀘스트만) | §5-1 | 방향 확인(§2에서 하위 문제 발견 — 아래 §3) |
| 6 재당첨 3일 배제 | §3-3 | 확인 |
| 7 로컬 전용 | §8-2 | 확인 |
| 8 clone timeLimitHours·dayKey | §2·§3-2 | 확인 |

## 2. [P0] 「위협 전투」통합 — `shouldGuaranteeQuestTransitEncounter`를 두 가지 반대 목적에 동시에 쓰고 있음

이게 이번 개정에서 가장 큰 문제다. 실제 `app/(game)/combat.tsx`와 `questCombatLock.ts`를 같이 읽으면, **같은 함수 하나가 서로 모순되는 두 가지 역할을 해야 하는데 설계는 그중 하나(false)만 지시했다.**

- `combat.tsx:163-213`(`combatSetup` state 초기화)는 화면에 진입하는 그 순간 **스스로** 무슨 적을 띄울지 결정한다:
  ```ts
  const transitLock = shouldGuaranteeQuestTransitEncounter(lock, destSystemId) ? lock : null;
  const templateId = transitLock?.templateId;               // 없으면
  const enemyTemplate = templateId ? ENEMY_TEMPLATES[templateId]
    : templates[Math.floor(Math.random() * Math.min(2, templates.length))];  // 랜덤 일반 적
  ```
  즉 **`shouldGuaranteeQuestTransitEncounter`가 true를 줘야만 퀘스트가 지정한 적(전용 템플릿)이 뜬다.** false면 무작위 일반 해적이 뜬다.
- `handleVictory`(`combat.tsx:253-256`)도 완료 판정 때 **다시** `resolveQuestCombatLock`을 독립적으로 재계산하고, `combatSetup.missionEnemyTemplateId`(위에서 `transitLock`이 null이면 이것도 null)를 넘긴다. `applyDefeatEnemyMissionObjectives` → `canCompleteQuestDefeatEnemy`는 `templateId === lock.templateId`를 요구하므로(`questCombatLock.ts:246-247`), **뜬 적이 애초에 `unidentified_object`가 아니었으면 이겨도 퀘스트가 안 끝난다.**
- 그런데 설계 §6-3은 "항로 아무 이동에서 강제 조우가 새어 나오면 안 되므로 `shouldGuaranteeQuestTransitEncounter` → **false**"라고 못 박았다. **이 요구를 그대로 넣으면 combatSetup도 항상 false를 보게 돼, 의도한 「미확인 물체」가 아니라 무작위 일반 해적이 뜨고, 이기고 나서도 퀘스트가 완료 처리되지 않는다.**

이 함수는 "월드맵 이동 중 강제 조우를 걸지 말라"(항로 누수 방지)와 "지금 이 STAGE 3 화면에서 어떤 적을 띄울지"(엔트리 게이팅) 두 개의 다른 질문에 동시에 쓰이고 있어서, 하나를 false로 고정하면 다른 하나가 망가진다. **`anomaly_salvage_forced`는 별도의 강제 진입 플래그(세션 스토어에 직접 심는 편이 안전 — 아래 §4)로 combatSetup을 게이팅하고, `shouldGuaranteeQuestTransitEncounter`는 원래 목적(항로 누수 방지)에만 남겨야 한다.**

## 3. [P0] 전투 종료 후 "복귀는 행성 허브"가 실제 세션/화면과 안 맞음

§6-3 표: "복귀 — 종료 후 월드맵이 아니라 수색하던 행성 허브(`replace` planet)" · "세션 — `useTransitCombatSessionStore.begin`에 `kind: 'anomaly_threat'`, `returnTo: 'planet'`, `planetId`".

실제 `src/game/transitCombat/transitCombatSession.ts`의 `TransitCombatSession` 타입과 `commitArrival`을 확인했다:

```ts
export type TransitCombatSession = {
  originSystemId: string;
  destinationSystemId: string;
  missionEnemyTemplateId?: string | null;
  missionPlanetId?: string | null;
};
```

- `kind`·`returnTo` 필드가 **아예 없다**. 지금 타입에 그대로 `begin({kind:'anomaly_threat', returnTo:'planet', ...})`을 넘기면 타입 에러다.
- `commitArrival()`은 무조건 `moveToSystem(destinationSystemId)` + `markVisited` + `applyReachSystemMissionObjectives(destinationSystemId, ...)`를 실행한다(`transitCombatSession.ts:74-79`) — "성계 간 이동이 전투로 막혔다가 승리해서 도착했다"는 걸 전제로 한 함수다. 방어위성 잔해 수색은 **같은 행성·같은 성계**에서 일어나므로, 이걸 그대로 부르면 "도착 처리"가 의미 없이(또는 잘못) 실행된다.
- `combat.tsx`의 실제 종료 분기는 **전부 하드코딩**돼 있다:
  - 승리(`combat.tsx:234`) → `router.replace('/(game)/worldmap')`
  - 도주(`combat.tsx:309-314`) → 승리와 동일하게 `commitArrival` 후 **worldmap**
  - 격침(`combat.tsx:287`) → `router.replace('/(game)/planet')` (단, 이건 "함선 파괴" 흐름이지 퀘스트 실패 흐름이 아니다)
  
  **"행성 허브로 복귀"를 지원하는 경로가 지금 코드에 하나도 없다.** worldmap 도착 연출(`pendingWorldmapArrivalUi`)까지 같이 딸려 나가므로, 안 가본 성계에 "도착했다"는 패널이 뜨는 부작용도 같이 생긴다.

**결론**: §6-3은 기존 STAGE 3 화면·세션 스토어를 "재사용"한다고 썼지만, 실제로는 **엔트리(§2 문제)와 엑싯(이 문제) 둘 다 새로 갈라줘야** 한다. "재사용"이 아니라 "같은 화면·다른 세션·다른 종료 분기"에 가깝다.

## 4. 보완 방향 (구현 착수 전 문서에 반영 권장)

1. **엔트리 게이팅을 `shouldGuaranteeQuestTransitEncounter`와 분리한다.** 예: `useTransitCombatSessionStore`(또는 신규 병행 스토어)에 `forcedEncounter?: { templateId: 'unidentified_object'; planetId: string; instanceId: string }` 같은 필드를 두고, `combatSetup`이 이 필드가 있으면 **그걸 최우선으로** 적을 고르게 한다. `shouldGuaranteeQuestTransitEncounter`는 손대지 않는다(기존 이동중 해적 회귀 위험 없음).
2. **완료 판정도 같은 필드로 직접 확인**하거나(전용 `settleAnomalyThreatVictory()` 같은 별도 함수), `canCompleteQuestDefeatEnemy`에 의존하지 않는다. `resolveQuestCombatLock`의 트랙 우선순위 경쟁(§0-A 8번 항목 밖 — v1.0 검수 §3의 남은 우려)에도 안 걸리게 된다.
3. **복귀는 별도 종료 분기를 만든다.** `handleVictory`/`handleFlee`의 `commitArrival()` + `worldmap replace` 경로를 그대로 타지 않고, `forcedEncounter`가 있을 때는 `commitArrival()`을 건너뛰고 `router.replace('/(game)/planet')`(+ 필요하면 `planetId` 세션 힌트)로 분기한다. 격침 시 이미 `/(game)/planet`으로 돌아가는 기존 분기가 있으니 그 패턴을 참고할 것.
4. **시드 함수명을 정정한다.** §6-3 "시드: `buildTransitCombatSeedSlots`"는 실제로 `src/combat/capitalTransitCombatSeed.ts`에 있고 `PlanetEdenRaidTestLayer.tsx`(venue=`hub_orbit`, 허브 궤도 레이드 화면)가 쓰는 함수다. `app/(game)/combat.tsx`(venue=`transit`)는 이 함수를 쓰지 않고 `ENEMY_TEMPLATES`/`resolveCombatEnemyCaptain`/`resolveTransitPirateShipIdFromTables`로 적을 고른다. 문서가 두 전투 화면을 섞어 썼다 — `app/(game)/combat.tsx` 경로를 쓸 거면 시드 언급을 지우거나 저 세 함수 기준으로 다시 쓰고, `buildTransitCombatSeedSlots` 기반으로 가고 싶다면 애초에 venue를 `hub_orbit`(허브 궤도 레이드, `PlanetEdenRaidTestLayer.tsx`)으로 바꿔야 한다 — **어느 화면인지부터 먼저 확정**해야 나머지(§2·§3)의 구체적 구현이 정해진다.

## 5. 그 외 v1.1 신규분 경미 확인

- §6-2 "threat 공개 이후에는 이 행성에서 이상현상 선롤을 다시 하지 않음" — `SalvageSearchOutcome`에 `anomaly_threat` 추가는 설계상 자연스럽다. 다만 위협 공개 후 **패주가 아니라 "포기"**(§5-1 "위협 공개·전투 전/패주 후 포기 가능")로 끝나는 경로도 있어, 전투에 아예 들어가지 않고 끝나는 케이스가 있다 — 이 경우 §2·§3의 전투 엔트리 문제는 발생하지 않지만, **전투에 안 들어가고 포기해도 `settleAnomalyEvent('abandoned')`가 §4의 인벤 유물 회수 단계(3번)를 그대로 타는지**는 위협 브랜치엔 인벤 아이템이 없으므로(§7 "미확인 위협은 인벤 아이템이 아니다") 자연히 no-op다 — 문제 없음, 확인만.
- §6-3 "전투 중 포기는 §5-1대로 불가" — `handleFlee`(도주)는 기존 이동중 전투에 이미 있는 별개 버튼이다. 위협 전투 중 **도주 버튼 자체를 막을지, 눌러도 되지만 §5-1의 "포기"와는 다른 처리(패주와 동일 취급)로 갈지**가 문서에 명확치 않다. §6-0 표는 "패배/도주 → 실패"라고 돼 있어 **도주=패주 취급**이 맞는 듯한데, §6-3 "전투 중 포기는 불가"라는 문장과 나란히 있어 오독 소지가 있다. 문서에 "도주 버튼은 그대로 두고 패주와 동일하게 실패 처리"라고 한 줄 명확히 하는 걸 권장.

## 6. 요약

| # | 항목 | 등급 |
|---|---|---|
| 1 | `shouldGuaranteeQuestTransitEncounter` 이중 용도 충돌 — 그대로면 무작위 적 뜨고 완료도 안 됨 | **P0** |
| 2 | `useTransitCombatSessionStore`에 `kind`/`returnTo` 없음 · `commitArrival`이 성계 도착을 전제 · 모든 종료 분기가 worldmap/planet 하드코딩(행성 복귀 경로 없음) | **P0** |
| 3 | 시드 함수(`buildTransitCombatSeedSlots`)가 실제로는 다른 화면(`hub_orbit`) 소속 — 화면 자체 재확정 필요 | **P1** |
| 4 | `settleAnomalyEvent` idempotent 가드 미명문 | P3 |
| 5 | 도주=패주 취급 문구 정리 | P3 |

**김팀장(Cursor 본창) 검수 요청** — §2·§3은 §6-3(위협 전투 통합) 전체를 다시 설계해야 하는 수준이라, P2b 착수 전에 "어느 화면을 쓸지"(§4-4)부터 먼저 확정해 달라고 요청.
