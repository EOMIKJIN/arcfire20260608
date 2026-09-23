# 스텔라 라이프 구현 검수 — 김팀장 판정·적용

```text
date=2026-09-21
source=kim-claude-stella-aris-life-impl-audit-20260921.md
verdict=PARTIAL_APPLY
tsc=PASS
life_tests=17/17 PASS
```

[pss-pre-dev] hot_path=일일배치 1 · persist 1.5s coalesce · 허브 수락/취소 1회
[pss-pre-dev] alloc=persist당 UTF-8 1회(~3KB) · cache=라이프 스냅샷 1
[pss-pre-dev] stage=신규 STAGE 없음 · risk=P6 · verdict=PASS

김클로드 구현 전수(PARTIAL · 중대 3 · 보강 4 · 경미 3)를 **이미 깐 S1–S6 기반**에서 재판정했다. 잠금 19건 준수는 동의. 효과가 확정된 것만 코드 반영. 불명·구조충돌은 보류.

## 적용 (효과 있음)

| # | 판정 | 적용 |
|---|---|---|
| **I1** | **동의** · 신규 계정 가짜 3일은 §0-H/L11 실측 결함 | `lastConsolidated` 빈 값이면 백필 0, 어제 키만 찍음. 결번 백필은 기존 계정만 |
| **I2** | **동의** · hop마다 같은 질문 = 무작위 회귀 | `[취소]`도 `lastAskDay` + persist. 친밀도 페널티 아님(예의 1일) |
| **I3** | **동의** · UTF-16 length ≠ 3KB | `stellaLifeSnapshotBytes` = UTF-8 · persist/parse/배치 말미 클램프(anchors→digests→narrative→ev) |
| **I4 일부** | **부분 동의** · EN 팩에 한국어 done | `done=[ko,en]` · 팩이 로케일로 선택 |
| **I5** | **동의** · 「원래」 오탐 | `원(?!\s)` 제거 → `\d+\s*원` · 「원래 짧게 말해」 통과 |
| **I6 일부** | **부분 동의** · 검역 문구만 | `SHADOW_LEAK_RE`와 같은 문자열을 anchor 검역에 합침 |
| **I7** | **동의** · 50 주입은 결을 지움 | 비매칭 축 EMA 제외. α=0.15 기존값 유지 |
| **I8** | 경미 · digest 수정 중 제거 | 도달 불가 `> 0` 분기 삭제 |

## 보류 (불명·효과 불확실·잠금 충돌)

| # | 이유 |
|---|---|
| **I4 서사 CSV 240** | narrative 템플릿 CSV가 없음. 240자 이식은 I3 여유를 즉시 잠식. 하드코딩 4문장은 유지 |
| **I6 짝 실닉 대조** | `get_shadow_nick` L8 영구 금지. 완전 차단 경로가 없음 |
| **I9** | 중복 조건. 동작 동일 · 플레이 효과 없음 |
| **I10** | `Date.now()` 기본값과 동일. 배치 시그니처 변경 실익 없음 |
| **GmBeat 1 fail** | tsx/esbuild × RN Flow. 라이프 인과 아님 |

## 잠금 유지

신규 persist 키 0 · schema 5 · C5/D7 입 격리 · 타이머 0 · 라이프 LLM 0 · 13좌 0 · ObservationBus 0 · 3KB 상한 3072 **숫자 변경 없음** · EMA α=0.15 **변경 없음**.
