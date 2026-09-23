# 김팀장 — 퀘스트 리팩터 설계 재검수 (2026-09-22)

```text
status=REVIEWED
task_id=quest-system-audit-and-redesign-review-20260922
source=tools/kim-team-lead/reports/kim-claude-quest-system-audit-20260922.md
정본=docs/코드작업을_위한_퀘스트_시스템_리팩토링.md
verdict=DESIGN_REVISED — 코드 0
```

## 판정

김클로드 재검수를 **대체로 채택**했다. 초안 1단계(활성 인덱스·전면 1.5초 persist)는 착수 순서가 틀렸다.

| 항목 | 결정 |
|---|---|
| A1 id 재사용 | **P0**. 수정안 (a) 고아 complete 정리 + 발급이 진행 키도 회피. (b) 사이클 id는 본선 아님 |
| A2 보상 분리 | **P1**. 미션 즉시 저장 → 보상. `rewardedAt`. 완료는 코얼레스 제외 |
| 활성 인덱스·타입 버킷 | **보류** |
| 클라우드 1.5초 추가 | **철회**. 기존 900ms+120초. 드롭만 1회 재예약 |
| reset | **cancel**. flush 금지 |
| AppState flush | `_layout` 에 background 1개. 화면 리스너 증설 금지 |
| 수량·반복 퀘스트 | **이 작업 밖**. 대표님 별도 지시 |

코드는 넣지 않았다. 0단계 착수는 대표님 지시 후.
