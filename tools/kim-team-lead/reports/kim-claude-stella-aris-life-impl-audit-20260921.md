# 스텔라 아리스 라이프 시스템 — 김팀장 구현 전수 정밀 검수

```text
status=PENDING
task_id=stella-aris-life-impl-audit-20260921
kind=IMPL_AUDIT
대상=v0.2 정본 구현분 (소스 24 · CSV 6 · generated 6)
검수자=김클로드
date=2026-09-21
verdict=PARTIAL — 아키텍처 잠금 전부 준수 · 경계조건 결함 3 · 보강 4 · 경미 3
```

[pss-pre-dev] hot_path=검수만 · 코드 미변경 alloc=0 cache=0
[pss-pre-dev] stage=없음 risk=해당없음(검수)
[pss-pre-dev] verdict=PASS

---

## 0. 한 줄

**잠금은 전부 지켜졌다. 깨진 것은 경계조건 3건이다.**

타이머 0 · LLM 홉 0 · 신규 persist 키 0 · 13좌 0 · 입 격리 · ObservationBus 0 — v0.2가 잠근 구조는 **하나도 뚫리지 않았다.** 그러나 **신규 계정이 설치 전 3일을 기억하고**, **[취소]가 예의 쿨다운을 갱신하지 않으며**, **3KB 안전장치가 런타임에서 작동하지 않는다.**

---

## 1. 검수 방법

| 축 | 방법 |
|---|---|
| 금지 패턴 | `setInterval` `setTimeout` `rAF` `AppState` `fetch` `ObservationBus` `AsyncStorage` `SubCore` `onSnapshot` 전량 스캔 |
| 잠금 배선 | 게이트 함수의 **실제 호출처** 추적 (존재만으로 통과 처리 안 함) |
| 타입 | `npx tsc --noEmit -p tsconfig.client.json` |
| 테스트 | 라이프 7파일 + arcCore chat 전체 |
| 경계조건 | **실행 검증** — 신규 계정 첫 배치 · 40일 포화 바이트 (scratch 스크립트) |

> 중간에 PowerShell 글롭(`src\**\*.ts`)이 재귀를 한 단계만 훑어 `sanitizeStellaLifeAnchor`를 「호출처 0」으로 오판했다. ripgrep으로 재확인해 **정상 배선** 확인. 아래 정합표의 B8은 통과다.

---

## 2. 중대 — 수정 필요 (I1~I3)

### I1. 신규 계정이 「설치 전 3일」의 일상을 갖는다 (실행 확인)

**실측** (`consolidateStellaLifeSnapshot(emptyLife, 2026-09-21 12:00 KST, ...)`):

```text
digests 생성 수 : 3
생성된 날짜     : 2026-09-18, 2026-09-19, 2026-09-20
lastConsolidated: 2026-09-20
done 문장       : 잠깐 끼니를 때우고 있어 | 쉬는 날 끼니가 느슨해 | 쉬는 날 끼니가 느슨해
```

**원인** (`stellaLifeDigest.ts:102-104`):

```js
const from = next.lastConsolidatedDayKey || stellaLifeAddDayKey(yesterday, -STELLA_LIFE_BACKFILL_MAX_DAYS);
const gap = stellaLifeDayKeysBetween(from, yesterday);   // fromExclusive → 3일
if (gap.length > STELLA_LIFE_BACKFILL_MAX_DAYS) { ... }  // 3 > 3 = false → 백필 실행
```

`lastConsolidatedDayKey`가 **빈 값(신규 계정)** 일 때 `from`을 「어제-3일」로 잡는다. 결번 백필과 **최초 생성**이 같은 경로를 탄다.

**왜 결함인가**: v0.2 §4-1 백필의 정의는 「`lastConsolidated .. yesterday` 사이 **결번**」이다. 신규 계정은 결번이 아니라 **역사 없음**이다. 스텔라가 플레이어를 만나기 전 3일을 기억하면 §0-H 성공 기준과 L11(「세계가 틀리거나 안내원처럼 들림」)에 걸린다. 첫 대화에서 「그저께 뭐 했냐」에 답이 나온다.

기존 테스트 `backfill fills at most 3 days and is idempotent`는 **이 동작을 정상으로 고정**하고 있어 회귀 감지가 안 된다.

> **수정안**: `lastConsolidatedDayKey`가 비면 백필 **0**. `lastConsolidatedDayKey = yesterday`만 찍고 종료(또는 어제 1행만). 백필은 「이미 살아 본 적이 있는 계정」에만 적용.

### I2. `[취소]`가 예의 쿨다운을 갱신하지 않는다 → 행성 hop마다 재배지

**코드** (`planetHubTalkRoster.ts:355-371`):

| 경로 | `consumeStellaLifeAskPending` | `lastAskDay` |
|---|---|---|
| `onAccept` | ✅ | ✅ 기록 |
| `onCancel` | ✅ | ❌ **미기록** |

`bindStellaLifeAskToPlanetSession`은 **행성 세션 bind마다** `tryResolveStellaLifeAskPending()`를 1회 호출한다(`planet.tsx:793`). 취소로 `lastAskDay`가 남지 않으면, 허브를 떠났다 오거나 행성을 hop할 때마다 동기·연료가 그대로여서 **같은 질문이 다시 배지로 뜬다.**

**잠금 대조** — v0.2 §16-4:
> 예의 쿨다운: 마지막 스텔라 선제 이후 **달력 1일** … 행성 hop마다 재resolve 가능하나, **예의에 걸리면 침묵**

취소가 쿨다운을 갱신하지 않으므로 **예의에 걸리지 않는다.** §16-0이 없애려던 「시계가 말을 건다 = 무작위」 체감으로 되돌아간다. 같은 허브 체류 중 재무장은 없으나(bind 1회), **hop은 막히지 않는다.**

> **수정안**: `onCancel`에서도 `lastAskDay` 기록. 의미상 「오늘 이미 한 번 말을 걸었다」는 취소해도 성립한다. (수락만 세면 거절당할수록 더 자주 묻는 구조가 된다 — 09-13 「거절 시 페널티 없음」 잠금의 반대편 문제.)

### I3. 3KB 안전장치가 런타임에서 작동하지 않는다 (단위 불일치 + 강제 없음)

**세 가지가 겹쳐 있다.**

**(a) 이름과 단위 불일치** — `stellaLifeSnapshot.ts:139`
```js
export function stellaLifeSnapshotBytes(life) { return JSON.stringify(life).length; }
```
`length`는 **UTF-16 코드유닛 수**다. 한글은 UTF-8에서 **3바이트**. 상수명은 `STELLA_LIFE_MAX_BYTES`다.

**(b) 런타임 강제 0** — `STELLA_LIFE_MAX_BYTES` 참조처는 **테스트 2줄뿐**. 프로덕션 코드에서 clamp·거부·경고 없음.

**(c) 테스트가 포화를 안 본다** — `empty life stays under 3KB`(빈 스냅샷) + `parse clamps rings`(파싱 직후). **포화 케이스 없음.**

**실측 — 40일 운영 후 현실 포화**:

```text
digests         : 14
narrative       : "하루를 접어 두고 있다."
JSON length     : 2254   (상한 3072 — 통과)
실제 UTF-8 byte : 3028   (상한 3072 — 98.6% 사용, 여유 44바이트)
```

**실측 — parse 상한 포화**(구세이브·조작 세이브가 hydrate로 들어올 때 허용되는 최대):

```text
JSON length     : 4022   ← 상한 3072 초과
실제 UTF-8 byte : 7190   ← 상한의 2.34배
```

**정직한 평가**: **지금 당장 터지지는 않는다.** 현실 경로는 3,028B로 간신히 안쪽이다. 문제는 **여유가 1.4%뿐인데 감지 장치가 꺼져 있다**는 것이다. narrative가 지금 짧은 이유는 하드코딩 문장(11자)이기 때문이고, I4를 고쳐 CSV 240자를 쓰는 순간 **즉시 초과**한다. parse는 7KB를 조용히 받아들인다.

> **수정안**: ① `stellaLifeSnapshotBytes`를 실제 UTF-8 바이트로(또는 상수명을 `MAX_CHARS`로) ② 포화 스냅샷 테스트 추가 ③ `patchStellaLifeMemory`/배치 말미에 초과 시 anchors→digests 순 축소 클램프.

---

## 3. 보강 (I4~I7)

### I4. 문장 하드코딩 — Table-First 위반 + 영문 로케일 깨짐

CSV에는 이미 `activityKo`/`activityEn` 양쪽이 있는데, **digest·narrative·pack 일부는 한국어 고정**이다.

| 위치 | 내용 | 영향 |
|---|---|---|
| `stellaLifeDigest.ts:53-56` | `narrativeFrom` 한국어 4문장 · **en 없음** | v0.2 §4-1 「narrative = CSV 템플릿 + traits 구간」 **미이행** |
| `stellaLifeDigest.ts:65` | `done: [resolved.activityKo...]` | `activityEn`을 버림 |
| `stellaLifeDigest.ts:111` | `done: ['오래 비움']` | 하드코딩 |
| `stellaLifePack.ts:32-35` | `'조금 처져 있어'` / `'A bit worn'` | 코드 문자열 |

`stellaLifePack.ts:39-40`이 `digestLine`(=`done[0]`)과 `narrative`를 팩에 싣는다. 따라서 **영문 로케일 플레이어의 팩에 한국어가 실린다.** 구현정본 §7 「런타임 문자열 하드코딩 금지」 · v0.2 §9-9 위반.

### I5. `PAY_RE` 오탐 — 정상 선호가 anchor에 저장 안 됨 (실행 확인)

`sanitizeStellaLifeAnchor.ts:1` — `원(?!\s)`

```text
차단  원래 짧게 말해     ← 오탐
통과  지원 요청은 싫어
통과  응원 고마워
통과  호출은 짧게
통과  원 단위로          ← 정작 통화 표현은 통과
```

「원래」가 막히고 「원 단위로」는 통과한다. 통화 필터로서 정확도가 낮고, 대표님 요구인 「플레이어 대화가 영향요소」를 조용히 줄인다.

### I6. 섀도우 차단이 §16-A 실질 위험을 못 막는다

`SHADOW_RE = /아크코어\s*근원체|shadow\s*nick|리빌/i` — **문자열 3종만** 막는다.
§16-A의 실제 위험은 **짝 유저의 닉네임**이고, 플레이어가 그 닉을 말하면 anchor에 그대로 박힌 뒤 game-save로 **Firestore까지 올라간다**.

구조적 한계가 있다 — 닉을 대조하려면 읽어야 하는데 `get_shadow_nick`은 L8/§8에서 **영구 금지**다. 따라서 완전 차단은 불가하고, **기존 출력 검역(`quarantineArcCoreChatReply`)이 쓰는 닉 패턴을 재사용**하는 선까지가 현실적이다. 현재는 독자 정규식이라 두 곳이 어긋난다.

### I7. traits 평균회귀 — L2 「살아 온 결」이 사실상 안 보인다 (실행 확인)

40일 운영 후 `narrative = "하루를 접어 두고 있다."` = **기본값**.

`driveSample`(`stellaLifeDigest.ts:30-35`)이 **비매칭 축에 50을 주입**한다. α=0.15 EMA가 매일 50으로 끌어당기므로, drive가 섞이면 4축 전부 50 근처에 수렴한다. `narrativeFrom`은 **≥60에서만** 분기하므로 기본 문장만 나온다.

결함이라기보다 **파라미터 문제**지만, D3의 「traits EMA = 살아 온 결」이 체감되지 않는다. 비매칭 축은 **50 주입 대신 갱신 제외**가 자연스럽다.

---

## 4. 경미 (I8~I10)

| # | 내용 | 위치 |
|---|---|---|
| I8 | **도달 불가 분기** — 85행이 `>= 0`로 이미 반환하므로 `> 0` 분기는 실행될 수 없음 | `stellaLifeDigest.ts:88-90` |
| I9 | **중복 조건** — `askedToday`(=`lastAskDay === today`)와 `lastAskDay >= today`가 같은 검사 | `stellaLifeAsk.ts:94-95`, `112-113` |
| I10 | `consolidateStellaLifeOnDailyBatch()` 무인자 호출 — 기본값 `Date.now()`라 동작 동일. v0.2 §4-1 `(nowMs)` 표기와 드리프트(무해) | `runArcCoreDailyOpsBatch.ts:457` |

---

## 5. 게이트 결과

| 게이트 | 결과 |
|---|---|
| `npx tsc --noEmit -p tsconfig.client.json` | **통과** (출력 없음) |
| 라이프 전용 테스트 7파일 | **13/13 통과** |
| arcCore chat 전체 | **134/135** — `arcCoreChatGmBeat.test.ts` 1건 실패 |

**실패 1건의 성격**: `Transform failed — react-native/index.js:14 Unexpected "typeof"`. tsx/esbuild가 react-native의 Flow 타입 `index.js`를 변환하지 못하는 **실행 환경 문제**이며, 테스트 로직 실패가 아니다.

**라이프 인과 여부**: 라이프 모듈은 react-native에 의존하지 않는다(`stellaLifeEnvRead.ts`는 순수 3 import, 팩 체인에 RN 없음). RN을 끌어들이는 유일한 라이프 파일은 `bindStellaLifeAskToPlanetSession.ts`인데 이 테스트 체인에 없다. → **라이프 인과 아님으로 판단.**

다만 arcCore chat 기능셋 전체가 **미커밋(`A`)** 이라 HEAD 기준 비교가 불가능하다. 선행 상태인지 김팀장 확인이 필요하다.

---

## 6. 정합 확인 — 잠금 준수 (전부 통과)

| 잠금 | 확인 방법 | 결과 |
|---|---|---|
| **C1** 신규 persist 키 0 | `arcCoreChatStore.ts:45` `SCHEMA_VERSION = 5` · `life` 필드 · 신규 키 grep 0 | ✅ |
| **C4** 등록 지점 | chat 키 경유 — `resetStellaLifeMemory`(326,354) · `hydrateStellaLifeMemory`(341) | ✅ |
| **C5·D7** 입 격리 | `shouldAttachStellaLifeToPack`이 `speakerId !== 'operator'` 차단 + `defaultNlMouthForBackchannelReason`이 `inbound_request`/`combat_end` → `arc_core`. **호출처 확인** `arcCoreAgentPack.ts:206` | ✅ 테스트 `D7: origin and inbound get no life pack` |
| **D1** 타이머 0 | `setInterval`/`setTimeout`/`rAF` **0건**. `AppState`는 `currentState` 읽기 1회(구독 없음) | ✅ |
| **D2** 라이프 LLM 홉 0 | `fetch(` **0건** | ✅ |
| **D4** Learning 단방향 | `ObservationBus`/`publishArcCore` **0건** | ✅ |
| **K1** 13좌 금지 | `SubCore` **0건** | ✅ |
| **K2** 타이틀/부트 금지 | 호출처 = `planet.tsx:793` 단 1곳 | ✅ |
| **K3** persist 편승 | `AsyncStorage` 직접 접근 0 · `touchPersist()`로 기존 1.5s coalesce 합류 | ✅ |
| **B8** anchor 검역 | `stellaLifeNote.ts:37` → `arcCoreChatReplyProvider.ts:166,193` **배선 확인** | ✅ (단 I5·I6) |
| 튜토리얼 선제 차단 | `isArcCoreTutorialForceActive()` 2중(bind + resolve) | ✅ 테스트 |
| 2게이트 | `presentNlMouthComm` 1차 → `onAccept`에서만 `presentArcCoreBackchannel` | ✅ |
| 팩 ≤400 | `STELLA_LIFE_PACK_MAX = 400` · 누적 절단 | ✅ 테스트 |
| §0-H humanFirst | `buildStellaLifePackFragment` 즉시 빈 블록 반환 | ✅ 테스트 |
| STAGE dispose | `registerPlanetSessionResource` → pending·세션캐시 해제 | ✅ |
| 배치 훅 위치 | `runArcCoreDailyOpsBatch.ts:456-457` 말미 + try/catch | ✅ |
| 백필 멱등 | 재실행 시 digests 3 유지 (실행 확인) | ✅ |
| 시계 역행 | no-op | ✅ 테스트 |
| Skia/STAGE 신설 | 없음 | ✅ 해당 없음 |

**내 v0.1 자가감사에서 올린 C1~C4·B5~B8·A9~A10은 전부 v0.2에 반영·구현됐다.** C5(입 격리)는 김팀장이 추가로 잡은 것으로, 내가 놓친 지적이 맞다.

---

## 7. 결론

| 구분 | 건수 | 성격 |
|---|---|---|
| 중대 | **3** | I1 신규계정 가짜 과거 · I2 취소 쿨다운 우회 · I3 3KB 안전장치 무효 |
| 보강 | **4** | I4 하드코딩/로케일 · I5 오탐 · I6 섀도우 · I7 평균회귀 |
| 경미 | **3** | I8 죽은 분기 · I9 중복 조건 · I10 인자 드리프트 |
| 잠금 정합 | **19** | 전부 준수 |

**verdict = PARTIAL.**

구조는 견고하다 — v0.2가 잠근 것 중 뚫린 게 없고, 게이트 함수가 **실제로 배선**돼 있으며(존재만 하고 안 불리는 흔한 결함 없음), 테스트가 D7·humanFirst·멱등·결정론을 실제로 고정한다.

깨진 3건은 전부 **경계조건**이다. I1과 I2는 플레이어가 **첫날**과 **행성 이동**에서 바로 만나는 경로라 실기 전에 고치는 편이 낫다. I3은 지금 터지지 않지만 I4를 고치면 터진다 — **I4보다 I3을 먼저** 고쳐야 한다.

전부 국소 수정이며 설계 변경은 필요 없다.

**END**
