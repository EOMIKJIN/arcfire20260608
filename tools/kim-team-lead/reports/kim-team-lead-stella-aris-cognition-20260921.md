# 스텔라 아리스 학습능력 · 사고수준 고도화 — 정밀 재분석

```text
status=REVIEWED
task_id=stella-aris-cognition-advancement-20260921
kind=DESIGN_REANALYSIS
정본=docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.2.md §15
date=2026-09-21
reviewed_by=김팀장
verdict=v0.1/v0.2 D3는 기억 압축 · 사고 숙련은 별축으로 보강
```

[pss-pre-dev] hot_path=문서 · 코드 미변경
[pss-pre-dev] alloc=0 cache=0
[pss-pre-dev] verdict=PASS

---

## 0. 한 줄

대표님의 「학습·사고수준 고도화」는 **하루 일기를 EMA로 접는 것**이 아니다.  
이미 배에 있는 학습 파이프(일 1회 ingest · H1/H5 태그 · judgment counts · §0-H 일상 바닥)를 **스텔라 입에만** 씌우면, 도구·LLM 홉·친밀도 없이 말이 깊어진다.

---

## 1. 지금 배가 이미 하는 학습 (실측)

| 장치 | 코드/문서 | 학습의 종류 | 스텔라와의 관계 |
|------|-----------|-------------|-----------------|
| World Learning | `ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1` · `src/arcCore/learning/*` | 경제·전투 KPI → 일 1회 Policy | **입 write 금지**. judgment 주석이 버스 공유 금지 |
| 대화 요약 | `foldArcCoreChatRollingSummary` 400자 | 단기 맥락 | 입 공유 1개. 숙련 아님 |
| H1 태그 ≤8 | `arcCoreChatMemoryTags.ts` | 좋아/싫어/사건/약속/장소 | **사실**. 지능 아님 |
| H5 명시 추출 | 같은 모듈 정규식 | 플레이어가 말한 선호만 | 관측 신호로 **재사용** |
| H6 뉘앙스 | 팩 1필드 | 2홉 분류 없음 | 유지 |
| judgment | `arcCoreChatJudgmentMemory.ts` counts≤8 | 제안 수락/거절 | 패턴만 차용. 월드 제안은 B 닫힘 |
| dialogueDrive | purpose/mode/stance | 이번 턴 사고 파이프 | **적용 지점** |
| §0-H | `arcCoreChatCasualTalk.ts` | 일상 바닥 | 숙련보다 **항상 앞** |
| 09-09 지적능력 | persona 관점 · purpose · GM when · 도구 | 「시야를 넓히면 똑똑해 보인다」는 **기각된 1항** | 스텔라는 관점 3행 **이미 있음** |
| Inworld §12-B | 캐릭터 카드+지식+Goal(고정/지침) | SDK·감정슬라이더·시맨틱검색 **안 가져옴** | 팩이 세계, 밴드는 Instruction |

**결론**: 학습 인프라는 있다. 없는 것은 「스텔라가 *어제보다 말을 고른다*」는 **숙련 층**뿐이다.

---

## 2. v0.1이 틀린 지점

| 초안 문장 | 문제 |
|-----------|------|
| 「α=0.15가 순수 사고능력 고도화의 정량적 답」 | EMA는 **기억 압축**. IQ가 아님 |
| L2 traits = 지능 | duty/warmth는 **살아 온 결**. 질문 깊이와 다름 |
| 라이프를 inbound에 실어 학습 | inbound는 근원체 (C5) |
| 환경 도구를 늘리면 사고 | 09-09가 이미 뒤집음. §0-H가 1항 |

최초 기획 「LLM+템플릿과 이어지는 사고수준」의 뜻은 새 모델을 키우는 것이 아니라, **이미 있는 1홉과 G3이 같은 숙련 밴드를 읽게** 하는 것이다.

---

## 3. 보강 설계 (v0.2 §15)

지속가능 학습의 **모양만** 가져온다.

```text
관측(operator 전송) → L0 카운트 5종
  → 일 1회 배치 ingest (α=0.15 · 링 8일 폐기)
  → cognition_bands.csv
  → 기존 drive 입력 1개
```

숙련 4축: `recall` · `askDepth` · `grounding` · `casualFirst`.  
게이지 UI 없음. 해금 없음. 팩 anchors 개수와 `lead` 허용만 바뀐다.  
humanFirst면 밴드를 무시한다 — 똑똑한 스텔라는 **브리핑을 안 하는** 쪽이다.

용량 +≤200B, 기존 `life` 필드. 3KB 단언 유지. 신규 키·13좌·버스·사고 LLM **0**.

---

## 4. 하지 않는 것 (재확인)

- 도구 8개로 지능 연출 (09-09 §4는 별건 · 라이프 S0–S5b와 분리)
- GM `when`을 스텔라 숙련에 씀 (근원체 줄기)
- 페르소나 기존 행 덮어쓰기
- dump_fail → 서운함/호감 감소
- 벡터·임베딩·Haiku 배치 요약 (전송 경로 금지, §0-F 예약)

---

## 5. 구현 순서 (지시 시)

S4(오늘 하는 일) → S5(어제 digest) → **S5b(숙련)** 같은 배치.  
S5b 없이 S4가 회귀하면 안 된다.

**END**
