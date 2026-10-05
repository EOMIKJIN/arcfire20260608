# 데일리 커밋·푸시 반복 실패 — 근본 원인 (김클로드 · 2026-10-05)

```text
task_id=daily-commit-failure-rootcause-20261005
kind=AUDIT (코드 변경 0 · 김팀장 수정 진행 중 — 완료 후 그 diff를 이 기준으로 검수)
```

## 1. 실측 이력

| 날짜(KST) | 결과 | 원인 |
|-----------|------|------|
| 08-10 ~ 09-24 | 46일 연속 실패 | `git add :!ignored-path` (git 2.47+) — 09-24 수정 |
| 09-26 | 실패 | audit:daily |
| 09-27 ~ 10-03 | 성공 7일 | — |
| 10-04 | 실패 | audit:daily — `src/combat/capitalCraftPool.test.ts` TS2367 (테스트 파일) |
| 10-05 | 실패 | audit:daily — `tools/play-bot-console/play-bot-console.test.ts` TS2353×2·TS2322×2 · `tools/play-bot-console/src/cellLoop.ts` TS18047 (도구·테스트) |

두 번 모두 아침에 수동 커밋(`작업 내용 - 데일리빌드 1004/1005`)으로 대체. 현재 HEAD(a00d26e) client tsc = 0.

## 2. 근본 원인

1. **백업 스냅샷이 품질 게이트에 묶여 있다.** `run-daily-commit.cjs:230-237` — `audit:daily`(client tsc 전체 + `build:content-tables` 전체)가 1건이라도 실패하면 커밋·푸시 전체 중단. 자정의 작업 트리에는 김팀장·김클로드의 진행 중(WIP) 변경이 거의 항상 있고, `tsconfig.client.json`은 include 제한 없이 `tools/**` 테스트까지 검사한다. 최근 두 실패 모두 **앱 런타임과 무관한 테스트·도구 파일**의 타입 오류였다.
2. **게이트가 실제로 막는 것이 없다.** 실패하면 다음 날 수동 커밋으로 같은 트리가 올라간다(10-04 수동 커밋 9421bfc에는 TS2367이 그대로 포함). 결과적으로 게이트는 **오류 코드 유입은 못 막고 자동 백업만 막는다.**
3. **실패 사유가 로그에 남지 않는다.** `run-daily-commit.cjs:232-235`는 audit 출력을 버리고 「audit:daily failed」만 기록 → `FAILURE_PENDING.md`도 같은 한 줄. 원인 확인에 매번 `daily-perf-audit/reports/latest.txt`를 따로 찾아야 한다.
4. (위험) 자정 audit가 `build:content-tables` **전체 생성기**를 돌려 tracked CSV·generated TS를 다시 쓴다(`star_system_connections.csv`, `item_defs.csv` patch 등). 커밋 직전에 트리를 바꾸는 단계라 생성기 회귀가 스냅샷에 섞일 수 있다.

## 3. 대응 기준 (김팀장 수정안 검수 체크리스트)

- [ ] **백업과 품질 판정 분리**: audit 결과와 무관하게 스냅샷 commit+push는 수행. audit 결과는 커밋 메시지 꼬리(`audit=FAIL tsc 5`)·리포트·알림으로 기록.
- [ ] **실패 사유 기록**: audit 실패 시 tsc 오류 상위 N줄을 일일 로그·`FAILURE_PENDING.md`에 포함.
- [ ] **사전 경보**: 자정 전(예: 23:30) audit 단독 실행 → 오류를 김팀장/김클로드에게 알려 자정 전에 고칠 기회.
- [ ] 자정 audit에서 콘텐츠 생성기 전체 실행 제외 또는 「생성 후 diff 있으면 경고」로 변경.
- [ ] 수정 후 `run-daily-commit.test.cjs` · `audit:daily-commit-process` PASS, 그리고 **오류가 있는 트리로 1회 리허설**(커밋·푸시는 되고 경보가 남는지).
