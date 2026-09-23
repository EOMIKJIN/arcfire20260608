# 스텔라 아리스 라이프 시스템 설계 v0.1 — 정본 전수 대조 정밀 감사

```text
status=PENDING
task_id=stella-aris-life-design-full-audit-20260921
kind=DESIGN_SELF_AUDIT
대상=docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.1.md
감사자=김클로드 (자가 감사)
date=2026-09-21
verdict=PARTIAL — 골자 유지 · 중대 정정 4건 · 보강 4건 · 사실오류 4건
```

[pss-pre-dev] hot_path=문서 대조만 · 코드 미변경 alloc=0 cache=0
[pss-pre-dev] stage=없음 risk=해당없음(문서)
[pss-pre-dev] verdict=PASS

---

## 0. 한 줄

**설계 골자(가상 시계·로컬 결정론·3계층 기억·입≠몸)는 정본과 충돌하지 않는다. 그러나 저장 계층 설계가 정본 §11-2·L2와 역행하고, 2게이트·튜토리얼·도구 화이트리스트 3개 계약이 누락됐다.**

중대 4건은 **구현 착수 전 반드시 정정**해야 한다. 그중 3건은 설계를 약화시키지 않고, 1건(C3)은 오히려 설계의 강점(결정론)으로 해소된다.

---

## 1. 대조한 정본 (16건)

| 정본 | 대조 결과 |
|---|---|
| `docs/대화형_아크코어_구현.md` §0-H·§0-I·§1(L1~L12)·§7·§8·§10·§11·§12-A | **C1 · C2 · B5 · B7 · A12 적발** |
| `docs/CONVERSATION_TWO_GATE_DESIGN.md` v1.0 | **C2 적발** |
| `docs/ARC_CORE_DUAL_MOUTH_OPERATOR_DESIGN.md` v0.4 | 정합 · **B6 정본충돌 발견** |
| `docs/ARC_CORE_AGENT_WORLD_DOMAIN_DESIGN.md` v0.3.2 | 정합 (D6 = A잠금·B예약과 일치) |
| `docs/ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md` | 정합 (단방향 소비) |
| `tools/…/STELLA_ARIS_OPERATOR_DIALOG_DEPTH_VERDICT_20260913.md` | 정합 (친밀도 미도입) |
| `tools/…/ARC_CORE_CHAT_ZERO_BILL_REDESIGN.md` | 정합 · **A12 정본충돌 발견** |
| `.cursor/rules/Arcfire_Master_Spec_v4.0` | 정합 (일 1회·onSnapshot 없음) |
| `.cursor/rules/arcfire-memory-leak-audit-first.mdc` §0-A | **A10 적발** (3줄 형식) |
| `.cursor/rules/arcfire-main-lead-agent.mdc` §230~241 | **C4 적발** (bootstrapAccountData) |
| `.cursor/rules/arcfire-overlay-ui-contract.mdc` · `arcfire-ingame-dialog-ui-default.mdc` | 정합 (신규 오버레이 0) |
| `.cursor/rules/arcfire-shadow-pairing-amendment.mdc` §16-A | **B8 관련** |
| `src/store/arcCoreChatStore.ts` (schemaVersion **4**) | **C1 근거** |
| `src/firebase/gameSaveBackup/*` | **A9 사실오류 적발** |
| `src/arcCore/chat/arcCoreChatTutorialForce.ts` | **B6 근거** |
| `src/arcCore/schedule/runArcCoreDailyOpsBatch.ts` | **C3 근거** |

---

## 2. 중대 — 구현 착수 전 정정 필수 (C1~C4)

### C1. 신규 persist 키 제안이 정본 §11-2 · L2와 역행

**내 설계 §5-1**: 「신규 persist 키 1개: `arcfire_stella_life_v1`」

**정본 §11-2 (구현 정본)**:
> 스키마 v2로 확장. **키 분리보다 한 키가 purge 누락이 적다.**

**L2 잠금**: 「채널 1개 | `presentArcCoreBackchannel` · `arcCoreChat` · **`arcfire_arc_core_chat_v1`**」 — 잠금이 키 이름을 명시한다.

**코드 실측** (`src/store/arcCoreChatStore.ts:35`): `SCHEMA_VERSION = 4`. 지금까지 `rollingSummary`·`lastArcQuestion`·`judgment`·`activeSpeakerId`·`operatorIntroPlayed`가 전부 **같은 키에 누적**됐다. 신규 키를 판 선례가 없다.

**결정적 근거**: 김팀장이 친밀도 FSM을 HOLD한 사유가 **「신규 persist + purge 연동」**이다. 내 설계는 그 HOLD를 「4곳 등록으로 해소」한다고 했으나, **애초에 신규 키를 만들지 않으면 그 리스크가 0이 된다.**

**추가 확인**: `slimGameSaveSnapshotForUpload.ts:168` — `arcfire_arc_core_chat_v1`은 slim 대상이 아니라 **default passthrough**다. 즉 같은 키에 넣으면 클라우드까지 **원형 그대로** 올라간다. 신규 키는 `PLAYER_GAME_SAVE_BACKUP_KEYS` 등록이 추가로 필요하다.

> **정정**: `arcfire_arc_core_chat_v1` **schemaVersion 5**로 확장. `life: StellaLifeSnapshot` 필드 1개 추가. 구세이브는 `life` 빈 값으로 hydrate(기존 v1→v4 마이그레이션 패턴과 동일).

**부작용 점검**: 채팅 로그는 40건 FIFO(수명 짧음), 라이프는 14일(수명 김). 한 키에 수명이 다른 데이터가 섞인다 — 그러나 `judgment`(counts 8건 누적)가 **이미 같은 상황**이고 문제되지 않았다. 페이로드 크기는 40×1200자 상한 대비 3KB 추가라 무시 가능.

---

### C2. 2게이트(통신 → 메신저) 계약 누락

**내 설계 §6-1**: 「선제 발화(inbound) → 생각 1 + 질문 1」

**정본 `CONVERSATION_TWO_GATE_DESIGN.md` §5 금지 1**:
> 허브·inbound·이벤트에서 메신저 **직행** (combat_end · first_scan처럼 이미 1차가 있는 체인 제외)

**§4 호출 규칙 2**: 「수락/`[ 확인 ]`의 `onAccept`에서만 `presentArcCoreBackchannel`」

내 문서는 라이프 기반 선제 연락이 **2차 메신저를 바로 여는 것처럼** 읽힌다. 실제로 그렇게 구현하면 금지 1 위반이다.

> **정정**: 라이프 기반 선제 연락도 **`presentNlMouthComm` 1차 통신 → `[수락]` → 2차 메신저**. 라이프는 **1차 통신 문구의 재료**이지 게이트를 건너뛰는 사유가 아니다. 기존 `arcCoreInboundTalkRequest` 경로를 그대로 타므로 신규 경로는 여전히 0이다.

---

### C3. 일일 배치는 「접속한 날」만 돈다 — L1 14일의 의미가 다르다

**내 설계 §5-2**: 「일 1회 배치(12:00 KST)에서만 실행 — 어제치 digest 1행 생성」

**정본 Master Spec v4.0:279**:
> `AsyncStorage`(`arcfire_arc_core_daily_ops_v1`) 기록을 통해 **하루 1회 실행 보장**

이것은 **하루 1회 상한**이지 결번 따라잡기가 아니다. 앱은 폰에서 도는 클라이언트이므로, **플레이어가 5일 쉬면 배치는 5번이 아니라 1번 돈다.**

**결과**: L1은 「최근 14일」이 아니라 **「최근 접속 14회」**가 된다. 3개월 만에 돌아온 플레이어에게 스텔라가 「지난 2주」라고 말하면 **세계가 틀린다**(§0-H 실패 조건 · L11 「세계가 틀리거나 안내원처럼 들림」).

부수 결함: `digest.withPlayer` 필드가 **거의 항상 1**이 되어 무의미해진다.

> **정정 (설계 강점으로 해소)**: D1의 결정론이 정확히 이 문제의 해법이다. 라이프가 순수 함수이므로 **안 산 날도 사후 계산이 된다.**
>
> - 배치 진입 시 `lastConsolidatedDayKey`와 오늘 사이의 **결번을 백필**
> - 백필 상한 = **3일** (§9 F1 clamp와 동일 상수 재사용). 그 이상은 「오래 비웠다」 1행으로 접음
> - `withPlayer`는 백필분에서 0 → 필드가 의미를 되찾음
> - 배치 시간 증가: 최대 3행 × 스칼라 연산 = 무시 가능 (DoD ≤50ms 유지)

---

### C4. purge 등록 지점 이름 오기 + `bootstrapAccountData` 누락

**내 설계 §5-4**: ① `purgeLocalAccountData` ② game-save 페이로드 ③ reload/hydrate ④ `arcCoreMemoryRegistry`(있을 때)

**정본 §11-1 실제 4곳**:
> `reset*` · `purgeLocalAccountData` · `PLAYER_GAME_SAVE_BACKUP_KEYS` · `reloadAllLocalGameSaveStores`

**`arcfire-main-lead-agent.mdc:241`**:
> 정본 위치: 초기화 = `purgeLocalAccountData` / **계정 생성 = `bootstrapAccountData`·`createPlayer`**. 신규 진행 스토어는 **둘 다에** 반드시 등록한다(2026-06-16 누락 회귀 보강 사례)

**오류 2건**:
1. `reset*` 메서드가 빠졌고, 내가 4번으로 적은 `arcCoreMemoryRegistry`는 **아직 존재하지 않는다** — `ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md` Phase 0.1 미착수 계획물이다. 없는 모듈을 등록 지점으로 적었다.
2. **`bootstrapAccountData` 누락** — 정본이 「둘 다」를 명시하고 2026-06-16 회귀 사례까지 달아 둔 항목이다.

> **정정**: C1(키 확장)을 채택하면 **등록 지점이 0개**가 된다 — `arcfire_arc_core_chat_v1`은 이미 5곳 전부에 등록돼 있다. 이것이 C1을 채택해야 하는 가장 실질적인 이유다.

---

## 3. 보강 필요 (B5~B8)

### B5. 환경 변수가 L8 도구 화이트리스트를 초과

**내 설계 §4-4**에 「오늘 일일 배치 결과」·「팩션 긴장(스텔리움↔크림슨)」이 있고, 「신규 도구 0~1개」라고 적었다.

**L8 잠금**: 위치 · 호칭 · 스파이 · 최근 전투 1건 · 현재 행성 코어 5값 · 공지 1건 · 지식 ≤4 — **끝이다.**
**§8 만들지 않음**: `run_daily_ops` 등. 실행 금지이나 **읽기 도구조차 목록에 없다.**
`ARC_CORE_CONVERSATIONAL_AGENT_FOUNDATION.md` §7: 「AABS/배치 **수치를 인용**하는 것은 읽기 도구를 **나중에** 열 수 있다」 — 미래형이다.

> **정정**: 1차 환경 변수를 **L8 범위로 축소**(시간대·요일·위치·코어 5값·스파이·최근 전투). 배치 결과·팩션 긴장은 **2차 승인 항목**으로 분리. 1차만으로도 `mood`/`unease`는 충분히 움직인다.

### B6. 튜토리얼 구간 계약 누락 — 그리고 정본 간 불일치 발견

내 설계는 튜토리얼 구간을 **전혀 언급하지 않았다.** 대조 중 **정본끼리 어긋난 것**도 찾았다.

| 출처 | 날짜 | 내용 |
|---|---|---|
| 구현 정본 §0-I 표 | 09-12 | 튜토리얼 강제 = 「**NL 명단**·본체 inbound/combat_end 침묵」 |
| dual mouth v0.4 D4 | 09-18 | 「**[대화] 오퍼레이터만 노출** · mission_* 중 **본체 inbound** 침묵」 |
| 코드 `arcCoreChatTutorialForce.ts:1` | — | 「**본체 inbound 침묵만.** 허브 [대화] 명단 NL은 **숨기지 않는다**」 |

dual mouth v0.4가 더 최신이고 CLAUDE.md가 「충돌 시 dual mouth 우선」을 명시하며 코드도 그쪽이다. **§0-I 표 문구가 미개정 상태**다(김팀장 정리 대상).

> **정정**: 라이프의 튜토리얼 계약을 명시 —
> - 스텔라 **팩 주입**: 허용 (튜토리얼 중 스텔라는 유일한 입)
> - 라이프 기반 **선제 연락**: **금지** (`isArcCoreTutorialForceActive()` 게이트)
> - 라이프가 튜토리얼 스크립트 문구를 **대체하지 않음** (강제 스텝은 LLM 0)

### B7. §0-H 층 0 「가로채기 금지」 가드가 없다

**정본 §0-H 성공 기준**:
> 「오늘 기분이 어때」에 무역소·전투가 나오지 않는다.

라이프는 이 실패 모드를 **새로 만들 수 있다**. 「오늘 기분 어때」에 스텔라가 「오전엔 항로 로그 인수하고 오후엔 검수했고…」라고 답하면, 시스템 브리핑이 **라이프 브리핑으로 바뀐 것**일 뿐 §0-H 위반은 동일하다.

> **보강**: 라이프는 층 0을 **대체하지 않고 살만 붙인다**는 규칙을 명시하고 실패 예시를 §0-H 형식으로 문서에 박는다.
> - 합격: 「오늘 기분 어때」 → 「그냥 그래. 밤에 좀 늘어졌거든.」 (한 조각)
> - 불합격: 같은 질문 → 슬롯 일정 나열 (라이프 덤프)
> - 턴당 라이프 문장 **최대 1개** (§6-1 「3개 동시 금지」를 **1개 상한**으로 강화)

### B8. 입력측 검역 계약이 없다 — anchors가 플레이어 원문을 클라우드로 올린다

**내 설계 §4-5**: anchors = 플레이어가 말한 사실 6개 × 40자, L2에 무기한 보관.

**정본 §10 검역**은 `quarantineArcCoreChatReply(text, pack)` — **출력(모델 회신) 전용**이다. 입력측 필터는 계약이 없다.

anchors는 (a) 플레이어 **원문 파생**이고 (b) L2라 **무기한**이며 (c) game-save를 타고 **Firestore로 업로드**된다. 기존 `rollingSummary`도 유저 발화를 접지만 400자 롤링이라 수명이 짧다. anchors는 다르다.

§16-A(섀도우 페어링)는 **리빌 전 짝 닉네임 금지**를 강제하는데, 플레이어가 그 닉을 말하면 anchor에 그대로 박힐 수 있다.

> **보강**: `sanitizeStellaLifeAnchor(text)` 계약 신설 —
> - §16-A 섀도우 닉 패턴 차단 (기존 검역 패턴 재사용)
> - 숫자·크레딧·아이템 id 형태 제외 (환각 재료 방지)
> - 결제·상품 관련 어휘 제외 (김팀장 상점 GM HOLD)
> - 길이 40자 하드 클램프 · 실패 시 **저장하지 않음**(조용히 버림)

---

## 4. 사실 오류 (A9~A12)

### A9. 백업 주기 수치가 틀렸다

**내 설계 §5-4·§7**: 「기존 **30분** 백업 사이클 편승」

**코드 실측** (`gameSaveBackupContract.ts:6,9`):
```
GAME_SAVE_BACKUP_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000   // 6시간
GAME_SAVE_BACKUP_RETENTION_MS    = 7 * 24 * 60 * 60 * 1000  // 7일
```

**6시간**이다. 「신규 write 0 · 기존 사이클 편승」이라는 결론은 그대로 유효하나, 수치가 틀렸다. (Firestore 문서 상한 1MB 대응 slim 경로가 있고, 채팅 키는 slim 비대상 — C1 참조.)

부차 영향: 라이프 L2가 **최대 6시간** 클라우드에 안 올라간 채로 있을 수 있다. 기기 분실 시 반나절 손실 — 채팅 로그와 동일 수준이라 별도 조치 불필요.

### A10. pss-pre-dev 3줄 형식 미준수

**정본 `arcfire-memory-leak-audit-first.mdc:38-40`**:
```
[pss-pre-dev] hot_path=<빈도> alloc=<틱당 신규 객체> cache=<키·invalidate>
[pss-pre-dev] stage=<진입/이탈 dispose> risk=<P1~P7 해당 번호>
[pss-pre-dev] verdict=PASS|REDESIGN
```

내 설계 문서의 2번째 줄에 **`risk=` 가 없다.** 규칙은 「`[pss-pre-dev]` 미기록 상태에서 코드 작성 시작 = 규칙 위반」이라 형식이 게이트다.

> **정정**: `risk=P2`(native_heap·Views — persist 증가분) 명기.

### A11. `withPlayer` 필드 무의미 — C3에 흡수

C3 백필 도입 시 해소된다. 별도 조치 없음.

### A12. 정본끼리 충돌 — §12-A 벤더 잠금 (내 설계 오류 아님 · 김팀장 정리 대상)

| 출처 | 날짜 | 내용 |
|---|---|---|
| 구현 정본 §12-A | 08-17 | 「문장 LLM은 **AWS Bedrock 전용**」 (대표님 잠금) |
| ZERO_BILL 재설계 | 09-08 | 「Bedrock **금지**. 무료 티어만」 (대표님 정정) |

내 설계는 최신인 ZERO_BILL을 따랐으므로 맞다. 다만 **구현 정본 §12-A 문구가 미개정**이라, 이 문서만 읽는 사람은 Bedrock으로 간다. 라이프 설계와 무관하게 **정본 정리가 필요**하다.

---

## 5. 대조 결과 「문제 없음」 확인 항목

| 축 | 정본 | 판정 |
|---|---|---|
| 입≠몸 (월드 write 없음) | L1 · dual mouth §9-8 · agent domain §5 | **정합** |
| 채널 1개 · 신규 입구 0 | L2 · two-gate §5-4 | **정합** |
| 13좌 신설 없음 | L4 | **정합** |
| 온디바이스 LLM 없음 | L5 · L9 | **정합** |
| 턴당 클라우드 LLM 1홉 | two-gate §5-5 · dual mouth §4 | **정합** (라이프 홉 0) |
| ZERO_BILL | ZERO_BILL 재설계 §4 | **정합** (로컬 결정론) |
| `onSnapshot` 없음 | Master Spec:58,385 | **정합** |
| 고빈도 실행 없음 | Master Spec:28 · CLAUDE.md 금지4 | **정합** (D1 타이머 0) |
| Learning 축 분리 | `arcCoreChatJudgmentMemory.ts:1-2` 주석 계약 | **정합** (단방향 소비) |
| 친밀도 미도입 | 김팀장 09-13 §7-3 HOLD | **정합** |
| 로맨스 스캠 배제 | 김팀장 09-13 §0 잠금 | **정합** |
| 상점 GM 미도입 | 김팀장 09-13 §2–5 HOLD | **정합** |
| Table-First · 기존 CSV 불변 | §7 · v4.0 | **정합** (신규 3장만) |
| `textKo`/`textEn` i18n | §7-1~7-4 스키마 | **정합** |
| 팩 예산 16,000자 | `arcCoreChatPackBudget.ts:5` | **정합** (400자 = 2.5%) |
| 오버레이 호스트 1 · Skia 없음 | overlay contract · skia lifecycle | **정합** (해당 없음) |
| STAGE `replace()` | CLAUDE.md 금지1 | **해당 없음** |
| 레이아웃 상수 불변 | CLAUDE.md 금지5 · two-gate §5-6 | **해당 없음** |

---

## 6. 정정 반영 후 달라지는 것 (요약)

| 항목 | v0.1 | v0.2 (정정안) |
|---|---|---|
| 저장 | 신규 키 `arcfire_stella_life_v1` | **`arcfire_arc_core_chat_v1` schemaVersion 5 확장** |
| 등록 지점 | 4곳 신규 등록 | **0곳** (기존 키가 이미 전부 등록됨) |
| 선제 연락 | 메신저 직행처럼 읽힘 | **1차 통신 → 수락 → 2차** |
| L1 의미 | 「14일」 | 「14일」 + **결번 백필 ≤3일** |
| 환경 변수 | 8개 (배치·팩션 포함) | **6개** (L8 범위) · 2개는 2차 승인 |
| 튜토리얼 | 미언급 | 팩 허용 · **선제 연락 금지** |
| 라이프 문장 | 턴당 최대 2 | **턴당 최대 1** (§0-H 가드) |
| anchors | 검역 미정 | **`sanitizeStellaLifeAnchor` 계약** |
| 백업 주기 | 30분(오기) | **6시간** |
| pss-pre-dev | risk 누락 | **risk=P2** |

**설계 골자는 하나도 바뀌지 않는다.** 가상 시계·로컬 결정론·3계층·EMA 합본·3KB 상한·입≠몸은 전부 그대로다. 바뀌는 것은 **어디에 저장하고, 어떤 게이트를 타고, 무엇을 읽느냐**다.

---

## 7. 김팀장께 올리는 별건 (라이프와 무관 · 정본 정리)

| # | 내용 | 근거 |
|---|---|---|
| 1 | 구현 정본 **§12-A 벤더 잠금 미개정** — Bedrock 전용 문구가 ZERO_BILL과 정면 충돌 | A12 |
| 2 | 구현 정본 **§0-I 튜토리얼 행 미개정** — 「NL 명단 침묵」이 dual mouth v0.4·코드와 불일치 | B6 |

둘 다 김클로드 판단으로 고치지 않았다. 정본 문구 개정은 김팀장 권한이다.

---

## 8. 결론

| 구분 | 건수 | 조치 |
|---|---|---|
| 중대 (착수 전 필수) | **4** | C1 키 확장 · C2 2게이트 · C3 백필 · C4 등록지점 |
| 보강 | **4** | B5 도구범위 · B6 튜토리얼 · B7 §0-H 가드 · B8 입력검역 |
| 사실오류 | **4** | A9 6시간 · A10 risk= · A11(C3 흡수) · A12(별건) |
| 정합 확인 | **18** | 조치 없음 |

**verdict = PARTIAL.** 설계 방향은 정본과 충돌하지 않으나, v0.1 그대로 구현에 넘기면 C1·C2·C4에서 회귀가 난다. v0.2 정정 후 김팀장 재검수를 권한다.

**END**
