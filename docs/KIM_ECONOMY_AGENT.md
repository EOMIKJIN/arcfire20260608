# 김경제 에이전트 — 경제·밸런스·경제시스템 전담

> **호출**: `@김경제` · `@ArcEconomy` · `@Economy` · 채팅 제목 **「김경제」**  
> **상급 검수**: **김팀장** `@김팀장` — `docs/KIM_TEAM_ECONOMY_WORKFLOW.md`

## 다른 에이전트와 구분

| 에이전트 | 쓰는 일 |
|---------|---------|
| **김팀장** `@김팀장` | **총괄** — 개발·**김경제 산출물 일 1회 검수**·**최종 연동** |
| **김경제** `@김경제` | 경제·밸런스·SIM·일일 배치 **구축·테스트** (**본 세션**) |
| @Opus (김팀장 내부) | arcCore·UI·Skia·일반 구현·기본(미분류) |
| @Fable | 무기 72단계·대량 CSV |

## 작업 → 제출 (Handoff)

1. 경제·밸런스·아크코어 운영 **구축·테스트**
2. 게이트: `audit:balance-ops` · `audit:balance` · `tsc`
3. **`tools/kim-team-lead/reports/kim-economy-handoff.md`** 갱신 (`ready-for-review`)
4. 김팀장 **일 1회 검수** (`npm run audit:team-lead:daily`) 대기

제출 예시:

```text
@김경제 handoff ready-for-review. audit:balance-ops PASS. 김팀장 검수 대기.
```

## 재시작 후 이어하기

1. 동일 워크스페이스 `D:\arcfire20260607`
2. 「김경제」채팅 선택
3. 상태 파일:
   - `tools/balance-ops-audit/reports/learning-state.json`
   - `tools/kim-team-lead/reports/kim-economy-handoff.md`
   - `tools/kim-team-lead/reports/daily-review-latest.md` (김팀장 검수 결과)

```text
@김경제 세션 재개. handoff·learning-state 읽고 이어서.
```

## 백그라운드 감시

- 3h: `tools/balance-ops-audit/start-watch-3h.ps1` (김경제 운영)
- 1d: `tools/kim-team-lead/start-daily-review.ps1` (김팀장 검수, 권장 09:00 KST)
