# 스텔라 아리스 라이프 설계 — 김팀장 전수 검수 · v0.2

```text
status=REVIEWED
task_id=stella-aris-life-system-design-20260921
kind=DESIGN_REVIEW + DESIGN_UPGRADE
대상=docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.1.md
정본=docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.2.md
감사(김클로드)=tools/kim-team-lead/reports/kim-claude-stella-aris-life-design-full-audit-20260921.md
reviewed_at=2026-09-21
reviewed_by=김팀장
verdict=PARTIAL_AGREE — 골자 채택 · C1~C4 동의 · C5 신규 · 구현은 v0.2만
```

[pss-pre-dev] hot_path=문서 · 코드 미변경 alloc=0 cache=0
[pss-pre-dev] stage=없음 risk=해당없음
[pss-pre-dev] verdict=PASS

---

## 0. 한 줄

김클로드 v0.1 골자(가상시계·로컬결정론·3계층·3KB·입≠몸)는 **최초 기획에 맞다.**  
그대로 구현하면 **C1 키 분리 · C5 근원체 inbound**에서 세계가 틀린다. 구현 정본은 **v0.2**.

---

## 1. 재검수 (김클로드 분석에 대한 AGREE/PARTIAL/DISAGREE)

| 축 | 판정 | 근거 |
|----|------|------|
| 주기 → 지연평가 | **AGREE** | 타이머는 금지4·PSS·Android에서 기능 실패 |
| 라이프 LLM 0 | **AGREE** | ZERO_BILL · 48슬롯 쿼터 |
| C1 키 확장 schema 5 | **AGREE** | `arcCoreChatStore.ts:30,35` · §11-2 |
| C2 2게이트 | **AGREE** | 다만 S0–S4는 선제 자체를 닫아 C2를 우회 |
| C3 백필 ≤3일 | **AGREE** | 배치 일 1회 상한 실측 |
| C4 등록 0 (C1 시) | **AGREE** | `bootstrapAccountData`는 장부/스킬만. chat은 이미 purge |
| B5 L8 축소 | **AGREE** | `대화형_아크코어_구현.md` L8 |
| B6 튜토리얼 | **AGREE** | 코드=`본체 inbound 침묵` · dual mouth 우선 |
| B7 §0-H 1문장 | **AGREE** | 라이프 덤프 = 안내원 실패 |
| B8 anchor 검역 | **AGREE** | 출력 검역만 있음. 입력이 Firestore로 감 |
| A9 6시간 | **AGREE** | `GAME_SAVE_BACKUP_MIN_INTERVAL_MS` |
| inbound에 라이프 실음 | **DISAGREE** | `defaultNlMouthForBackchannelReason('inbound_request')==='arc_core'` (`resolveChatReplySpeaker.ts:28`) — **C5** |
| 3요소를 보이는 방백 | **PARTIAL** | 내부 파이프는 채택. 화면 「생각:」는 §0-H 위반 |
| `arcCoreMemoryRegistry` 등록 | **DISAGREE** | Phase 0.1 미착수물 |

---

## 2. 최초 기획과의 정합

대표님 문장 → v0.2:

- **행동**: 대화 밖 시간 = 슬롯. 월드 write 없음(입≠몸). 체감은 스텔라가 *그때의 일*을 아는 것.
- **학습·기억**: anchors + EMA. 게이지 아님 (09-13 HOLD).
- **저장 한도 + 교체**: 14일 원본 폐기 · L2만 남김.
- **사고수준**: 7스칼라 → 기존 stance/mode. 새 분류기 없음.
- **서버리스**: 키 1개 편승 · 컬렉션 0.

축소가 아니라 **수단 교정**이다. 주기 타이머와 근원체 inbound는 기획을 구현하는 척하고 깨뜨린다.

---

## 3. 산출

| 파일 | 역할 |
|------|------|
| `docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.2.md` | **구현 정본** |
| `docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.1.md` | 초안 · 대체 표시 |
| 본 리포트 | 검수 기록 |

**코드 0.** 커밋 없음.

---

## 4. 다음

대표님께서 v0.2를 잠그시면 S1(CSV+순수 함수, 런타임 연결 없음)부터.  
S6 선제·배치/팩션 환경은 별도 승인.  
§12-A·§0-I 문구 정리는 라이프와 분리된 정본 정비.

**END**
