# 스텔라 온디바이스 AI · Firebase — 김팀장 판정·적용

```text
date=2026-09-21
verdict=PARTIAL_APPLY
on_device=local G3 + life + cognition
firebase=6h game-save 편승 only
weights=HOLD
```

[pss-pre-dev] hot_path=전송 1 · 백업 6h 1 · 배치 1
[pss-pre-dev] alloc=백업 시 chat JSON 1회 normalize · 세션 카운터 in-place 상한 8
[pss-pre-dev] stage=신규 STAGE 없음 · risk=P6 · verdict=PASS

## 판정

| 개념 | 용량·메모리 | 결정 |
|---|---|---|
| 온디바이스 **가중치/임베딩/Inworld SDK** | 수십~수백 MB · PSS 계단 | **HOLD** |
| 온디바이스 **로컬 G3 + 라이프 + 숙련 밴드** | 팩 ≤400 · 라이프 ≤3KB | **APPLY** (이미 정본, 이번 보강) |
| Firebase **신규 컬렉션/실시간** | 쓰기 폭주 | **HOLD** |
| Firebase **6h game-save** `arcfire_arc_core_chat_v1` | 기존 키 · slim으로 상한 | **APPLY** |

## 적용 (계단 누적 방지 + 고도화)

| 항목 | 효과 |
|---|---|
| persist / hydrate / 6h slim 이 `normalize`+UTF-8 3KB 클램프 | 로컬·클라우드 모두 라이프·메시지 FIFO가 계단으로 안 큼 |
| cognition 세션 카운터 **8 캡** | 하루 200턴해도 persist 정수가 안 뜀 |
| `allowLead` 밴드 → 정세 lead를 clue로 낮춤 | 숙련이 온디바이스 말에 실제로 붙음 |
| grounding 밴드가 anchor 수를 min | 관측 약한 날 팩이 안 불어남 |
| `stella_life_narrative.csv` 짧은 4행 | Table-First · EN 팩 서사 · persist 240자 이식 없음 |

## 보류

가중치 모델 · 시맨틱 검색 · `get_shadow_nick` · 라이프 전용 Firestore · 서사 240자 persist.
