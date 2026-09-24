# 이상현상 수색·연구원·유물 본선 — 정밀 코드 검수

```text
status=REVIEWED
verdict=PASS (수정 권고 11건 · 차단 0건)
date=2026-09-24
reviewer=김클로드
대상=src/missions/unidentifiedAnomaly/* (15파일) · unidentifiedAnomalyStore · planetSalvageSearch 연동 · 연구원 씬
```

---

## 0. 결론

**배선·수명·정합 모두 정상이고 차단 사유는 없다.** 다만 **스폰 계층이 여전히 테스트 로테이션**이라, 본선 정책 CSV의 스폰 계열 값 대부분이 실기에 반영되지 않는다. 의도된 단계라면 문제없으나 **코드·주석·CSV가 서로 다른 이야기를 하고 있어** 정리가 필요하다.

| 검증 | 결과 |
|---|---|
| `unidentifiedAnomalyMainline.test.ts` | ✅ PASS |
| `unidentifiedAnomalyTestRotation.test.ts` | ✅ PASS |
| `tsc --noEmit -p tsconfig.client.json` | ✅ **EXIT=0** |
| 본선 4경로 배선 | ✅ 전부 연결 확인 |
| 타이머·리스너 수명 | ✅ 누수 없음 |

---

## 1. 배선 확인 — 본선 경로는 실제로 물려 있다

| 기능 | 호출처 | 상태 |
|---|---|---|
| 연구원 의뢰·포기 대화 | `BarNewMissionTab.tsx:179` | ✅ |
| 유물 지급 | `planet.tsx:1554` | ✅ |
| 수색 공개 판정 | `planetSalvageSearch.ts:112-135` | ✅ |
| 미션 materialize | `missionStore.ts:602` · `unidentifiedAnomalyStore.ts:181` | ✅ |
| 페이로드 롤 | `unidentifiedAnomalyStore.ts:231` | ⚠️ **도달 불가** (F-1) |

**`collect_item` DSL이 구현 완료됐다.** `applyBuyGoodsMissionObjectives.ts:21`이 `buy_goods`와 `collect_item`을 함께 인벤 수량으로 완료 처리하고, 타입 유니온(`types/index.ts:878`)·무결성 테스트·`missionObjectiveDsl.ts` 문서까지 정합한다. 이전 설계에서 「제안됐지만 코드에 없다」던 항목이 해소됐다.

---

## 2. 잘 된 점

- **`settleAnomalyEvent`가 idempotent** — `settlingId` 재진입 가드 + `if (!active) return` + instanceId 대조 3중. 두 번 호출돼도 안전하다.
- **watch 수명 관리가 견고하다** — 전역 timeout **1개** · `ticking` 재진입 가드 · `MAX_TIMER_DELAY_MS` 클램프(32bit 오버플로 방지) · 빈 풀일 때 **0ms 재스케줄 금지**(15초 유예) · AppState 재개 킥. 4초 폴링 없이 schedule 기반으로 깨우는 구조가 정확하다.
- **마운트 1회 등록** — `planet.tsx:451` · `worldmap.tsx:808` 모두 `useEffect(..., [])`. 타이머 thrash 없음.
- **정책 로더가 캐시 + 무효화 쌍을 갖춤** — `getPolicyKv()` lazy + `invalidateUnidentifiedAnomalyPolicyCache()`.
- **테스트 오버라이드가 런타임과 분리** — `setUnidentifiedAnomalyPolicyForTest`에 「런타임·틱에서 호출 금지」 명시.
- **persist 스키마에 버전(`v: 1`)** 이 있고 `parsePersisted`가 방어적이다.

---

## 3. 수정 권고

### 🔴 F-1 (P1) — threat 페이로드가 실기에서 **절대 나오지 않는다**

```ts
// unidentifiedAnomalyTestRotationWatch.ts:104
useUnidentifiedAnomalyStore.getState().applySpawn({ …, payloadKind: 'relic' });

// unidentifiedAnomalyStore.ts:231
const payloadKind = input.payloadKind ?? rollAnomalyPayloadKind(instanceId);
```

watch가 `'relic'`을 **명시 전달**하므로 `??`가 절대 넘어가지 않는다. 결과:

- `payload_threat_weight_pct=50` **무효**
- `unidentifiedAnomalyResolver.ts:24-35` threat 분기(`defeat_enemy`) **사문화**
- `planetSalvageSearch.ts:137` `payloadKind === 'threat'` 반환 **도달 불가**
- `ANOMALY_THREAT_TARGET_ID` · `threatTclAdd` 전부 미사용

**수정**: watch에서 `payloadKind`를 **넘기지 않으면**(undefined) 50:50이 그대로 산다. 한 줄이다.

### 🔴 F-2 (P1) — 정책 CSV의 스폰 계열이 전부 미적용

실제 소비되는 필드는 **2개뿐**이다.

| 소비됨 | 미적용 |
|---|---|
| `questRelicSalvagePct`(수색 30%) | `dailySpawn`(일 2회) · `unacceptedTtlHours`(12h) · `concurrent` · `cooldownDays` · `historyCap` · `threatTclAdd` · `bandWeight*` 4종 · `baseSpawnChancePct` |
| `payloadRelicWeightPct`(F-1로 사실상 무효) | |

스폰 계층이 `unidentifiedAnomalyTestPolicy.ts`(30분 주기 / 10분 유지 상수)이기 때문이다. 추가로:

```ts
// unidentifiedAnomalyStore.ts:238
unacceptedExpiresAtMs: input.expiresAtMs,   // 활성창(10분)과 동일 — TTL 12h 아님
```

**의도된 단계라면 기능 문제는 없다.** 다만 **CSV에 값이 적혀 있는데 안 먹는 상태**는 「값을 바꿨는데 왜 안 바뀌지」 사고를 부른다. 두 방법 중 하나를 권한다.

1. 스폰 계층을 정책 기반으로 승격, 또는
2. **미적용 필드에 CSV `notesKo`로 「(미적용 · 본선 스폰 승격 시 사용)」 명시**

### 🟡 F-3 (P2) — 「본선 미착수」 주석이 실제와 어긋난다

```ts
// unidentifiedAnomalyTestPolicy.ts:2-3
* 미확인 이상현상 — [테스트] 로테이션만.
* 본선(일 2회·TTL 12h·연구원·수색 50:50)은 아직 미착수.
```

**연구원·수색·유물은 착수·배선 완료**다. 주석만 낡았다. 「**스폰 주기만** 테스트 단계 · 연구원/수색/유물은 본선 적용」으로 정정하면 F-2의 경계도 같이 분명해진다.

### 🟡 F-4 (P2) — Table-First 위반: 목표 설명문 하드코딩

```ts
// unidentifiedAnomalyResolver.ts:31-32
description: '미확인 물체를 격파하라',
descriptionEn: 'Destroy the unidentified object',
```

CLAUDE.md 「데이터는 CSV Table-First · 코드에 하드코딩 금지」 위반. relic 분기는 템플릿 설명을 상속하는데 **threat 분기만 하드코딩**이라 비대칭이기도 하다. 템플릿 CSV에 threat용 행을 두거나 `mission_objectives` 문구를 참조하도록 권한다.

### 🟢 F-5 (P3) — 죽은 export

`presentAnomalyResearcherDialog.ts:11` `isAnomalyResearcherVisibleOnPlanet` — **호출처 0건**. 허브 노출 판정에 쓰려다 만 것으로 보인다. 쓰거나 지운다.

### 🟢 F-6 (P3) — 유물 효과/회수 비대칭 (**향후 위험**)

```ts
applyAnomalyRelicSalvageGrant → onQuestRelicAcquired(itemId)   // 효과 «부여»
settleAnomalyEvent           → removeInventoryItemBestEffort() // 아이템만 «회수»
```

**효과를 해제하는 경로가 없다.** 지금은 `questRelicEffectRegistry`가 v1 no-op이라 무해하지만, **`quest_relic_effects.csv`를 채우는 순간 desync가 된다**(아이템은 회수됐는데 효과는 남음). 지금 `onQuestRelicLost` 자리를 만들어 두면 나중에 찾아다니지 않아도 된다.

### 🟢 F-7 (P3) — abandon이 'expired'로 기록된다

```ts
// settleAnomalyEvent.ts:48
closeAnomalyMission(snap.instanceId, reason === 'failed' ? 'failed' : 'expired')
```

`'abandoned'`(플레이어 포기)가 `'expired'`(시간 만료)로 저장된다. 기능은 같으나 **이력 분석에서 자발적 포기와 방치를 구분할 수 없다.**

### 🟢 F-8 (P3) — 콜백이 present 실패 시에도 남는다

`presentAnomalyResearcherDialog.ts:39` — `registerIngameDialogCallback`을 `presentIngameDialogScene` **호출 전에** 실행한다. present가 `false`를 반환해도(다른 대화 활성 등) 등록이 남는다. 고정 ID라 누적되진 않으나, **등록을 present 성공 이후로 옮기는 편이 안전**하다.

---

## 4. 연구원 대사 — 신규 집필 가이드 기준 점검

`docs/QUEST_DIALOGUE_AUTHORING_GUIDE.md`(2026-09-24 정본) 기준.

**규격은 통과** — 전 페이지 3줄 이내 · 전 줄 21자 이내. ✅

### 🟡 F-9 (P2) — 첫 대사에 화자 소개가 없다

```text
[npc_dialog_anomaly_researcher p0]
잔해 신호는 읽힌다. / 유물일 수도, 위협일 수도 있다. / 정체는 수색으로만 확인된다.
```

가이드 **§0-4 기술1 「첫 줄에 장면을 세운다 — 누가·어디서」** 위반. 플레이어는 바에서 이 인물을 **처음 만나는데** 누구인지 나오지 않는다. 오렌 바스크를 「요새 적색정보다」→「**요새 정보반의 오렌이다**」로 고친 것과 같은 결함이다.

> **권고**: 1줄에 소속·이름을 세운다. 예 — 「이상현상 조사반이다.」(11자)

### 🟡 F-10 (P2) — 「슬롯」은 개발 용어다

```text
[abandon p0] 중단하면 슬롯은 즉시 비운다.
```

**「슬롯」이 무엇인지 플레이어에게 설명된 적이 없다.** 가이드 §4-1 결함1(미설명 전문용어) + §4-5 메타 용어 금지에 걸린다.

> **권고**: 「중단하면 이 건은 즉시 닫힌다.」(17자)

### 🟢 F-11 (P3) — 「조사권」 초출 미설명

「수락하면 **조사권**을 넘긴다」 — 실제 의미는 퀘스트 수락이다. 무슨 권리인지 불명확하다.

> **권고**: 「수락하면 조사를 맡기겠다.」(14자)

### 🟢 F-12 (P3) — 캐릭터 목소리 축이 없다

전 페이지가 동일 단정체라 다른 NPC와 구분되지 않는다. 가이드 §4-3 기준으로 **성별·연령·군민 축**을 먼저 정하고 그에 맞춘 말끝을 권한다. 연구직이면 세레나 드릴처럼 **관측 사실 먼저 → 판단 뒤** 순서가 어울린다.

---

## 4-B. 추가 검수 — 이상현상이 사라진 뒤의 후처리 (대표님 질의)

### 즉시 정리된다 — `active = null` 하나로 파생 전부

`settleActive()`가 `active`를 null로 만들면 **파생 UI·판정이 전부 같은 가드로 즉시 꺼진다.** 설계가 깔끔하다.

| 대상 | 가드 | 결과 |
|---|---|---|
| 월드맵 링 | `worldmap.tsx:329` `s.active?.systemId ?? null` → `anomalyVisibleSystems` 빈 배열 | 언마운트 ✅ |
| 바 연구원 카드 | `BarNewMissionTab.tsx:158-159` `if (!active \|\| active.planetId !== planetId) return null` | 사라짐 ✅ |
| 수색 공개 판정 | `planetSalvageSearch.ts:119` 동일 가드 | 차단 ✅ |
| materialize 캐시 | `forgetUnidentifiedAnomalyMaterializedMission` | 해제 ✅ |
| 유물 인벤 | `removeInventoryItemBestEffort`(reason≠'cleared') | 회수 ✅ |

### 🔴 F-13 (P1) — `arc_anom_*` 미션 progress가 **영구 누적**된다

```ts
// missionStore.ts:1215-1227
closeAnomalyMission: (missionId, status) => {
  …
  [missionId]: { ...prev, status: 'failed', completedAt: … }   // 행을 «남긴다»
}
```

**행을 삭제하지 않고 `failed`로 표시만 한다.** 그리고 정리해 줄 곳이 없다.

- `arcCoreInstanceProgressCleanup.ts` → **`arc_inst_*` 전용**(`ARC_CORE_INSTANCE_MISSION_ID_PREFIX`). `arc_anom_*`는 대상 밖
- `missionProgressSanitize.ts` → 필드 정규화만, 가지치기 없음
- instanceId가 `arc_anom_{planetId}_{startedAtMs}`라 **매번 새 키** → 덮어쓰기·dedupe도 안 된다

**영향**: 현재 테스트 로테이션이 30분 주기이므로 **하루 48행**이 `missionStore.progresses`에 쌓이고 그대로 AsyncStorage에 직렬화된다. 장기 플레이에서 수천 행이 되어 **persist 크기·JSON 직렬화 비용이 계속 증가**한다. CLAUDE.md 「기능·수정 전 메모리/PSS 리스크 먼저」에 직접 걸린다.

> **권고**: `arcCoreInstanceProgressCleanup`과 같은 방식으로 **`arc_anom_*` 종료 행에 상한(예: 8~16)**을 두고 초과분을 제거한다. 이미 `recentResolved`(cap 8)가 이력을 따로 갖고 있으므로 **progress 행은 오래 보관할 이유가 없다.**

### 🟡 F-14 (P2) — `closeAnomalyMission`의 `status` 인자가 죽어 있다

```ts
closeAnomalyMission: (missionId, status) => {   // ← 'failed' | 'expired' 를 받고
  …
  status: 'failed',                              // ← 항상 'failed' 로 기록
```

인자를 받고도 쓰지 않는다. F-7(abandoned→expired 매핑)과 합쳐, **포기·만료·미수락 TTL이 전부 `failed` 한 값으로 뭉개진다.** 이력 분석에서 세 경우를 구분할 수 없다.

### 🟢 F-15 (P3) — 재발 방지 상태 2개가 write-only

| 상태 | 유지 | 소비 |
|---|---|---|
| `lastSystemId` | ✅ | `selectUnidentifiedAnomalyTestSite.ts:48,53` — **실제 사용** ✅ |
| `rotationHistory` (cap 8) | ✅ | **0건 — 아무도 안 읽음** |
| `recentResolved` (cap 8) | ✅ | **0건 — 아무도 안 읽음** |

따라서 **재당첨 방지는 「직전 1개」뿐**이고, 정책의 **`cooldown_days=3`(「이소 성계 재당첨 배제 일수」)은 미적용**이다(F-2의 구체 사례). 방금 끝난 성계가 두 턴 뒤 다시 뽑힐 수 있다.

`recentResolved`는 `planetId` 기준으로 dedupe·cap까지 갖춰 **소비만 붙이면 바로 쿨다운으로 쓸 수 있는 상태**다.

---

## 5. 착수 우선순위

| 순위 | 항목 | 규모 |
|---|---|---|
| 1 | **F-13** `arc_anom_*` progress 영구 누적 (메모리·persist) | 상한 로직 |
| 2 | **F-1** threat 도달 불가 | 1줄 |
| 3 | **F-3** 주석 정정 + **F-2** 미적용 필드 notes 명시 | 주석·CSV |
| 4 | **F-9·F-10** 연구원 대사 2줄 | 문자열 |
| 5 | F-4 하드코딩 · F-6 효과 해제 자리 · **F-15** 쿨다운 소비 | 소규모 |
| 6 | F-5·F-7·**F-14**·F-8·F-11·F-12 | 정리 |

**차단 사유 없음.** 다만 **F-13은 시간이 갈수록 악화**되므로 먼저 막는 편이 낫다. F-1은 한 줄로 본선 설계(relic/threat 50:50)가 그대로 살아난다.

---

## 6. 총 15건 요약

| 등급 | 건 |
|---|---|
| 🔴 P1 | F-1(threat 도달 불가) · F-2(정책 스폰 계열 미적용) · **F-13(progress 영구 누적)** |
| 🟡 P2 | F-3(주석 불일치) · F-4(하드코딩) · F-9(화자 소개 없음) · F-10(「슬롯」) · **F-14(status 인자 죽음)** |
| 🟢 P3 | F-5 · F-6 · F-7 · F-8 · F-11 · F-12 · **F-15(쿨다운 write-only)** |

---

**김클로드는 읽기만 했다** — 코드·CSV 변경 0 · 커밋 0. 빌드/테스트는 검증 목적 실행이며 생성물은 김팀장 반영분과 동일하다.
