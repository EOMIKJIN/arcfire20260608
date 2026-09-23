# 김팀장 — 잔해 수색 크레딧·한도 검수 적용 (2026-09-22)

```text
status=REVIEWED
task_id=salvage-search-credit-cap-audit-20260922
source=tools/kim-team-lead/reports/kim-claude-salvage-search-credit-cap-audit-20260922.md
verdict=APPLY — A·B·C + 테스트 보강. D는 정책 유지(무코드)
```

[pss-pre-dev] hot_path=수색 완료 1회 alloc=해시·정책 Map 조회 cache=일일 카운트는 player persist 기존 키
[pss-pre-dev] stage=계정 영속 1.5s coalesce · 신규 타이머/키 없음 risk=P6 기존 schedulePersist
[pss-pre-dev] verdict=PASS

## 김클로드 판정

| # | 리포트 | 김팀장 |
|---|---|---|
| 핵심 경로 | 이중 게이트·시도 횟수 cap·시세 CR 정상 | 동의 |
| A refundCredits | 보상인데 환불 API | **전용 `grantSalvageCredits`**. 시세 고정·AABS/lifetime 없음은 유지(연료 회수). `addCredits` 금지 |
| B enabled | 한도를 안 끔 | **한도는 enabled 일 때만**. 소진 카운트는 시드용으로 유지 |
| C attempt ref | 재진입 시 같은 결과열 | **소진 후 `dayKey`+`countToday` 시드**. 마운트 ref 제거 |
| D 기기 시계 | 한도 우회 가능 | **유지**. 다른 KST 일일 한도와 동일. 서버 재검증 추가 안 함 |
| Firestore | 미확인 | **포함**. `userDataSync` 가 player blob 전체 전송. 두 필드는 Player에 있음 |
| 게이지 이탈 | 미확인 | **완료 콜백 없음**. dispose가 타이머 취소. 소진은 완료 시점만 |
| wreck depleted | 미사용 | 동의. 한도가 유일한 일일 제한 |

## 적용

- `grantSalvageCredits` — `refundCredits` 계약 복구
- `resolveSalvageSearchDailyUsage.capped = policy.enabled && remaining<=0`
- 시드 `dayKey:planet:wreck:count`
- CSV 노트만 정정. 확률·cap·시세 값 불변
- 테스트: 자정 경계 · enabled=false · mul=0 · 결과 결정성

커밋은 대표님 지시 시.
