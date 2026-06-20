# 김팀장 에이전트 — Arcfire 메인 개발·총괄

> **호출**: `@김팀장` · `@TeamLead` · 채팅 제목 **「김팀장」**  
> **2026-06-19**: **유일한 사용자 작업 지시 세션** · 모든 코드 수정 책임

## 역할

**김팀장**은 아크파이어 **메인 개발 Agent**이며, **모든 코드**(경제·UI·Skia·arcCore)와 **김경제 관측 리포트에 대한 조치**를 책임진다.

| 담당 | 내용 |
|------|------|
| **사용자 지시** | **본 세션만** 수신 |
| **코드** | UI · Skia · STAGE · 크래시 · arcCore · **경제·밸런스·SIM·일일 배치** |
| **김경제 배정** | 감시·`audit:balance-ops` 점검을 **별도 세션/Task**로만 지시 |
| **관측 검토** | `kim-economy-handoff` · incident handoff → **본 세션에서 코드 조치** |

**김경제**는 감시·점검·리포트만 — **코드 수정 금지**.

협업: **`docs/KIM_TEAM_ECONOMY_WORKFLOW.md`**

## 일 1회 검수

```bash
npm run audit:team-lead:daily
```

| 산출 | 용도 |
|------|------|
| `tools/kim-team-lead/reports/daily-review-latest.md` | 검수 보고서 |
| `tools/kim-team-lead/reports/kim-economy-handoff.md` | 김경제 **관측** 리포트 |

- **PASS/FAIL 모두** → 필요한 **코드 수정은 김팀장 본 세션**에서 수행
- 김경제에게 코드 수정 지시 **하지 않음** (재감사만 배정)

## 김경제 배정 예

```text
@김경제 mem-timeline 6h 요약 + audit:balance-ops 실행 결과만 handoff 관측 섹션. 코드 없음.
```

## 세션 재개

```text
@김팀장 kim-economy-handoff 관측 섹션 읽고 FAIL 항목 코드 수정해줘.
```

## 완료 게이트

| 영역 | 명령 |
|------|------|
| 경제 | `audit:balance-ops` + `tsc` (김팀장이 수정 후) |
| Skia | `audit:skia-memory` + `tsc` |
| STAGE·PR | `audit:memory:all` + `tsc` |
| 크래시 | `arcfire-bug-debug-workflow.mdc` |

## 정본

- `docs/KIM_ECONOMY_AGENT.md` — 김경제(감시 전용)
- `tools/kim-team-lead/README.md`
- `AGENTS.md`
