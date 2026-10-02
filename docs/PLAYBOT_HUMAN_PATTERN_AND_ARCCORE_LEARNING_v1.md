# 인간형 게임플레이 학습 체계 v1.1

> **작성**: 2026-10-02 · v1.0 분석안 → **v1.1 비전 통합**  
> **상태**: **설계 정본 · 코드 착수 금지** (대표님 승인 전)  
> **최종 목표**: 가치 있는 **인간형 게임플레이 방식** 데이터를 추출·축적한다.  
> **하지 않는 것**: 13번째 서브코어 · 틱/부트 Observation · 플레이봇→RN store 직접 write · 종량 LLM 파인튜닝 · 엔드 규칙을 초반 데이터에 섞기 · 가상일 KPI를 인간형 데이터로 위장

교차:
- 플레이봇 18:00: `tools/play-bot-console/PLAYBOT_DAILY_LOOP.md`
- 아크코어 기억: `docs/ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md`
- 깊이·학습 로드맵: `docs/ecosystem/ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md`
- 세축(반응·잔상·세계변화): `docs/세축_반응_잔상_세계변화_설계.md`
- 초반 스파인: `docs/EARLY_STORY_AND_QUEST_SPINE.md` §4-6
- 대화 2게이트: `docs/CONVERSATION_TWO_GATE_DESIGN.md`
- 엔드 HOLD: `docs/엔드콘텐츠_개발계획.md` v0.2

---

## 0. 비전 — 하나만

이 체계의 성공은 봇 가중·일일 KPI·서브코어 고도화가 아니다.

**사람이 아크파이어를 어떻게 진행하는지를, 다시 재생하고 비교할 수 있는 기록으로 남기는 것.**

그 기록을 **인간형 플레이 코퍼스(HumanPlayCorpus)** 라 한다.  
플레이봇은 코퍼스를 **대량으로 만드는 공장**이고, 아크코어는 행동이 일어나는 **세계 맥락**이며, 학습 프로세스는 원시를 **가치 있는 데이터로 거르는 체**다.  
셋은 병렬 프로젝트가 아니라 **한 파이프의 세 구간**이다.

```text
세계가 움직인다 (아크코어)
    → 그 위에서 누군가 플레이한다 (인간 또는 인간형 봇)
    → 방식(순서·체류·게이트·회복)이 남는다
    → 가치 게이트를 통과한 것만 코퍼스에 들어간다
    → 봇은 코퍼스에 더 가까워지도록만 고친다
    → 세계는 사람 페이스를 해치지 않도록만 일 1회 힌트를 받는다
```

가상일 perpetual·경제 SIM·AABS는 **이 코퍼스를 더 좋게 만들 때만** 남는다. 자체 목적이 되면 체계가 다시 갈라진다.

---

## 1. 가치 있는 데이터란

### 1-1. 한 단위 = PlaySession

사람이 한 번에 앉아서 하는 플레이와 같은 길이.

- 시작: 타이틀 / 착륙 / 세션 포커스
- 끝: 출발·종료·20분 캡·튜토리얼 창 닫힘 중 먼저
- 내용: **무엇을 어떤 순서로, 얼마나 머물고, 어떤 문을 통과/거부했는지**
- 배경: 그때 세계가 어떤 상태였는지 (행성·언락·퀘 포인터·점유 한 줄)

카운트(`전투 64097승`)는 가치가 아니다.  
「스캔을 기다린 뒤 채굴 한 사이클을 보고, 대화를 열어 취소를 골랐다」가 가치다.

### 1-2. 인간형 방식 — 다섯 층 (한 레코드에 같이 붙는다)

| 층 | 사람이 하는 일 | 데이터가 담을 것 |
|----|----------------|------------------|
| **L0 의식** | 첫 3분 스파인 (A0–D2) | 스캔→채굴→대화→무역→출발 준수 |
| **L1 루프** | 허브에서 반복하는 버릇 | 채굴 편중 / 퀘 편중 / 수련 편중 |
| **L2 장** | 세부미션을 하나씩 | 목표 순차, 이탈·방황률 |
| **L3 위험** | 질 것 같으면 피하고, 격파 후 고친다 | 연속 수련 금지, 재출격 전 이동 |
| **L4 세계** | 세계가 달라진 걸 보고 행동을 바꾼다 | 세축: 반응(다시 말 걸림)·잔상(같은 함)·세계변화(떠난 사이 1~2) |

L0만 모으면 튜토리얼 로그다.  
L4만 모으면 월드 KPI다.  
**다섯 층이 한 세션에 겹칠 때** 인간형 방식 데이터가 된다.

### 1-3. 가치 게이트 (통과한 것만 코퍼스)

아래를 **하나라도** 깨면 원시는 버려지거나 `noise` 태그만 남긴다. 학습 입력 금지.

| 게이트 | 통과 | 지금 봇이 깨는 예 |
|--------|------|-------------------|
| G-seq | verb 시퀀스가 3개 이상, 시간 단조 증가 | 가상일 저널이 180초에 뒤섞임 |
| G-clock | 인간 초(또는 실기 상수)만. 가상일 틱 없음 | `TICKS_PER_DAY` absorb |
| G-gate | 잠금 위반이 기록되면 `ok=false`로 남김 (숨기지 않음) | 스캔 전 채굴을 성공으로 침 |
| G-spine | L0 세션이면 A2–D2 또는 명시적 skip 이유 | `EARLY_L0_GUIDE_GAP` |
| G-hold | 세션의 50% 이상이 HOLD가 아님 | `annex_vault_short` 하루 16회 |
| G-ctx | 시작 시 행성·언락·활성 퀘 1줄 | 맥락 없는 액션 나열 |
| G-src | `human` 또는 `bot_feel` 명시. `campaign_day`는 코퍼스 금지 | D18000 히스토그램 |

**코퍼스 단위 목표 (달성 정의)**

1. `bot_feel` 세션 N≥20 이 G-* 전부 통과  
2. `human` 세션이 생기면 같은 스키마로 N≥10  
3. 두 집단의 `orderHash` 상위 3개 교집합 ≥2  
4. L0 `tutorialCompliance` 중앙값 ≥ 0.85  
5. 캠페인 가상일 로그가 1·2·3을 **오염시키지 않음**

이 다섯이 되기 전에는 「학습 고도화 완료」를 선언하지 않는다.

---

## 2. 현황 — 왜 비전에 못 닿나

세 갈래가 **각자 다른 산출**을 성공으로 삼고 있다.

| 갈래 | 지금 성공 지표 | 비전이 원하는 지표 |
|------|----------------|-------------------|
| 플레이봇 campaign | D일수·L60·승패 | PlaySession 통과 수 |
| earlyFeel | feelSec≈180 · spine 비트 수 | G-spine + 실제 verb 순서 |
| 아크코어 학습 | kpiTimeline 1행/일 | 세션에 붙는 세계 맥락 1줄 |

실측 (`pb-2026-10-01T1501-mixed_ref`): 캠페인은 D18000·편입 HOLD. 초반 1건은 183.5초이나 `EARLY_L0_GUIDE_GAP` — LAND/QUEST가 창을 먹어 L0 의식이 데이터가 되지 못했다.  
실기 인간 시퀀스는 전투 한 줄(`recordMatchSummary`)뿐이다.

**구조 문제 한 줄:** 파이프가 없어서가 아니라, **파이프 끝에 코퍼스가 없고 KPI가 앉아 있다.**

---

## 3. 통합 구조 — 하나의 파이프

```text
┌─────────────────────────────────────────────────────────────┐
│  CONTEXT     아크코어 세계 (12좌 · 일 1회 배치 · 세축)        │
│              세션 시작 시 WorldContextSlim 1장만 찍는다        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  PLAY        인간 실기 (옵트인)  │  플레이봇 Clock S (feel)   │
│              같은 PlayVerb 테이블 · 같은 게이트                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ Session 종료 1회
┌───────────────────────────▼─────────────────────────────────┐
│  QUALIFY     G-seq ~ G-src 가치 게이트                         │
│              pass → Corpus   fail → noise (학습 입력 금지)     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  CORPUS      HumanPlayCorpus     ← 최종 산출 (비전)            │
│              PlaySession[]  cap · source 혼재 · 원문 대화 없음   │
└───────────────────────────┬─────────────────────────────────┘
                            │ 일 1회 distill
┌───────────────────────────▼─────────────────────────────────┐
│  PACK        HumanPatternPack                                │
│              순서 상위 · 준수율 · 루프 버릇 · 하지 말 것         │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
        봇 Clock S 충실도                 아크코어 DailyOps
        (더 많은 pass 세션)               압축 힌트 1줄 (선택)
```

Clock C(가상일 campaign)는 **이 파이프 밖에 둔다.**  
세계가 깨졌는지 보는 **감시**이지, 코퍼스 입력이 아니다.

---

## 4. 역할 — 비전에 맞춰 다시 씀

| 구성 | 역할 | 성공 | 실패 (하면 안 됨) |
|------|------|------|-------------------|
| **코퍼스** | 산출물 | G-* 통과 세션이 늘고, 인간·봇이 같은 말로 비교됨 | KPI·가중·승률을 산출로 착각 |
| **플레이봇 Clock S** | 공장 | 사람 게이트를 지키는 세션을 값싸게 양산 | 가상일로 180초를 채움 |
| **플레이봇 Clock C** | 감시 | HOLD·금고·국경 이상만 보고 | 초반 정책·코퍼스를 오염 |
| **학습 프로세스** | 체 | 가치/노이즈 분리, 일 1회 팩 | 틱 persist, 두 시계 absorb |
| **아크코어** | 무대 + 약한 소비자 | 세션에 세계 1줄을 주고, 사람 페이스를 깨지 않음 | 틱 학습, 13좌, 초반 annex |
| **세축** | L4 의미 | 재조우·함 동일·떠난 사이 변화가 세션에 표시 | 8종 장치·실시간 제국 |

아크코어를 「고도화할 수 있는가」의 답은 바뀐다.  
**코퍼스가 더 인간형으로 보이게 만들 수 있으면 연동하고, 아니면 연동하지 않는다.**

---

## 5. 단일 스키마 (온톨로지)

봇과 인간이 **다른 JSON을 쓰면** 통합이 실패한다. 아래만 정본이다.

### 5-1. PlayVerb

`intro | warp | land | scan | mine | talk_g1 | talk_g2 | trade | shipyard | bar | depart | quest_accept | quest_obj | combat | overlay | world_notice`

`hold`는 verb가 아니라 **세션 실패/공백 표시**다. 남기되 시퀀스 주인공으로 쓰지 않는다.

### 5-2. PlayBeat

```text
tSec, verb, ok, gate?, dwellSec
gate: scan_lock | mine_daily | talk_accept | talk_cancel | tutorial_once | level_gate
```

### 5-3. WorldContextSlim (세션 시작 1회 · 작음)

```text
planetId, systemId, scanUnlocked, activeQuestId?,
paint(BLUE|RED|N|I), noticeBits?   // 세축 세계변화 1~2
```

전 행성 덤프·vault 전문·Skia 상태 금지.

### 5-4. PlaySession (코퍼스 행)

```text
sessionId
source: human | bot_feel          // campaign_day 불가
startedAt, feelSec
context: WorldContextSlim
beats: PlayBeat[]                 // cap 48
layers:
  L0: orderHash, tutorialCompliance, guideSkipReason?
  L1: dominantLoop                // mine|quest|combat|mixed
  L2: objSeq?, wander?
  L3: wipeCount, recoverVerb?
  L4: reacted, remnant, worldDelta  // 세축 bool/한 줄
quality: pass | noise
noiseReason?
```

### 5-5. HumanPatternPack (증류 · 일 1회)

코퍼스의 통계일 뿐, 대체물이 아니다.

```text
packId, dayKey
corpus: { passN, humanN, botN }
l0: { orderTop[3], complianceP50, guideGapRate }
l1: { loopShare }
l3: { wipeRate, recoverTop }
contra: { orderJaccard }          // humanN=0 이면 null
doNot: ["early_annex", "absorb_campaign_into_feel"]
```

---

## 6. 수집 — 같은 문, 다른 몸

### 6-1. 인간 (가치의 기준 표본)

- 기본 OFF. DEV/내부만. 세션 종료 **1 persist**. 링 32. 계정 purge 대상.
- 허브 버튼·게이트·퀘 순차·2게이트 수락/취소만. 터치 좌표·프레임·대사 원문 없음.
- `combatMatchTelemetry`에 verb를 섞지 않는다 (AABS 계약).

인간이 0이어도 봇 `bot_feel`로 코퍼스는 쌓인다.  
다만 **contra(근접도)는 인간 N≥10 전엔 발표하지 않는다.** 봇끼리의 자화자찬을 인간형이라고 부르지 않는다.

### 6-2. 봇 Clock S (공장)

- 모드 `feel_l0`(필수 신규 시드) · `chapter`(story_001 순차)
- **가상일 저널 absorb 금지.** PlayVerb 테이블로만 비트.
- 체류 상수 = 실기: 스캔 8s · 채굴 30s · 게이트 12s · 무역 5s
- 트윈은 UI가 아니라 **게이트만** (스캔 전 잠금, `mine_granted`, 2게이트, 일일한도, once)
- 세션 끝 1회: Qualify → pass면 코퍼스

### 6-3. 봇 Clock C (파이프 밖)

- 기존 perpetual. `playbot-learning-state` growth/ANALYZE 유지.
- `EARLY_*`·코퍼스 가중과 **차단**.
- 18:00에 HOLD는 **감시 칸**. 코퍼스 칸과 나란히 적지 않으면 다시 섞인다.
- **구현 보정 (2026-10-02)**: 창 델타·hold 해제·기준 감쇠·원자+백업 기록·120일 학습창. 김클로드 감사 R1–R7. 코퍼스 Phase 1은 별 지시.

---

## 7. 학습 프로세스 — 거르고, 가깝게 하고, 다시 뽑는다

```text
Qualify → Corpus.append(pass)
       → 일 1회 Distill(Pack)
       → Clock S 정책은 Pack.doNot / orderTop 만 본다
       → 다음 날 feel 시드 N회
       → passN 증가가 학습 성공
```

적응의 목표는 승률이 아니라 **다음날 G-* 통과 수**다.

| 하면 되는 적응 | 하면 안 되는 적응 |
|----------------|-------------------|
| 스캔 전 채굴을 시도하면 `ok=false`로 남기고 다음 시드에서 안 함 | campaign HOLD로 feel 가중 범프 |
| orderTop이 `scan>mine>talk`면 그 순서를 기본 의도 | D18000 편입 실패로 초반 quest↑ |
| 인간 표본이 생기면 orderJaccard로만 봇 순서 수정 | LLM에 원문 세션을 넣고 파인튜닝 |

대화 축(`AI NPC_데이터학습개발설계.md`)은 **별 파이프**다. 코퍼스에 대사 원문을 넣지 않는다. L4 `reacted`는 「다시 말을 걸었는가」불 값만.

---

## 8. 아크코어 — 무대이지 목표가 아니다

12좌 유지. 합류는 코퍼스가 세계 맥락을 필요로 할 때와, 세계가 사람 루프를 밟지 않게 할 때만.

| 서브코어/축 | 코퍼스에 주는 것 | 코퍼스에서 받아도 되는 것 |
|-------------|------------------|---------------------------|
| DailyOps | `WorldContextSlim`용 일자·배치 여부 | Pack 압축 3~4숫자, 배치 tail 1행. 없으면 skip |
| Territorial / Attack | paint, 접전 한 비트 | campaign HOLD 관측만. 초반 로테이션 금지 |
| Economy / Fabric | 없음 (튜토리얼 판매≠일일 무역) | 받지 않음 |
| AABS | 없음 | 받지 않음 (engageSec은 기존 전투 축) |
| Npc · Drone · Spy · Nebula | L4 잔상/반응용 id 존재 | 틱 publish 금지 |
| News | 세션에 넣지 않음 | 받지 않음 |
| Observation Bus | DORMANT 유지 | CI에서 세션 1건/일 이하만 검토 |
| 신규 좌 · ScenarioRunner | 열지 않음 | — |

디바이스에서 코퍼스 ndjson을 부트·prewarm·타이틀에 읽지 않는다.  
Node/18:00만 팩을 만든다.

---

## 9. 금지 (비전을 지키는 잠금)

1. Clock C 저널을 Clock S / 코퍼스에 absorb  
2. `campaign_day`를 `source`로 코퍼스에 넣기  
3. 가치 게이트 실패 세션을 Pack 통계에 넣기  
4. 인간 0건으로 「인간 근접 달성」선언  
5. 13좌 · 부트 Learning hydrate · Observation 틱  
6. 플레이봇이 월드 store/holds/vault를 씀  
7. 엔드·전 성계 블루를 L0 세션에 넣기  
8. 대사 원문·터치 좌표·프레임 로그  
9. 기존 밸런스 CSV를 Pack으로 덮기  

---

## 10. 페이즈 = 코퍼스 이정표

구현은 별 지시. 이정표는 기능이 아니라 **데이터**다.

| Phase | 코퍼스가 얻는 것 | 완료 조건 |
|-------|------------------|-----------|
| **0** | **대표님 실기 원시** SessionTrace v0 (`human-seed-v0.json`) | logcat `[MEM_PROFILE]` 변환 1건 이상. 봇 시작값은 이 시드가 있으면 시드, 없으면 페르소나 폴백 |
| **1** | `bot_feel` + 인간 시드 순서 재현 | GUIDE_GAP=0 시드 연속 5 **또는** 시드 orderTop 재현 |
| **2** | 매일 feel 시드 → passN 증가, Pack distill | 18:00 코퍼스 칸 ≠ campaign 칸 |
| **3** | `WorldContextSlim`을 세션에 부착 | 맥락 없는 세션 0 |
| **4** | 테스터 같은 스키마(옵트인) | humanN≥1 가시 — n=1은 이미 Phase 0 |
| **5** | 인간·봇 대조 | humanN≥10 · order 교집합≥2 → **비전 1차 달성** |
| **이후** | Pack을 DailyOps 힌트로 (선택) | 코퍼스 악화 없이 |

순서 잠금: **실기 원시 → 봇 학습 → 인간 근접 자가플레이**. 하드코드 페르소나만으로 학습을 시작하지 않는다.

Phase 5 전에 아크코어 overlay·전술 서브코어를 열지 않는다.  
무대 장식이 코퍼스보다 앞설 수 없다.

---

## 11. 기존 문서 — 이 비전 아래

| 문서 | 위치 |
|------|------|
| **본 문서 v1.1** | 인간형 플레이 코퍼스 정본. 파이프·가치·역할 |
| v1.0 (같은 파일 이력) | 삼분 분석·Clock 분리. **제약으로 흡수**, 헤드라인 아님 |
| `PLAYBOT_DAILY_LOOP.md` | 18:00. 성공 칸 = passN / GUIDE_GAP. campaign은 감시 |
| `ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md` | World/Learning/Player 기억. §9 봇 루프는 **본 파이프 Clock S** |
| `ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md` | C-1 KPI는 세계 운영. 코퍼스와 섞지 않음 |
| `세축_…설계.md` | PlaySession L4 |
| `EARLY_STORY_…` · 2게이트 | L0·talk verb 정본 |
| `엔드콘텐츠_개발계획.md` | Clock C 이후. 코퍼스 L0에 금지 |

---

## 12. 한 줄로 다시

**모으는 것:** 사람이 이 게임을 하는 방식.  
**만드는 것:** 그 방식을 지키는 봇 세션.  
**세계를 만지는 것:** 그 방식이 깨지지 않게, 하루에 한 번만.  
**버려야 하는 것:** 방식 없이 쌓인 일수와 승수.

---

*충돌 시: 메모리·PSS 1순위 · v4.0 일 1회 · 12좌 · **코퍼스 가치 게이트** · 본 문서 · 개별 초안*
