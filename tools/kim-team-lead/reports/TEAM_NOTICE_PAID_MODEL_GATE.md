# 팀 공지 — 김팀장 핵심 **glock 4.7** · Composer·Auto 분석 전용

**대표님 지시 반영 (2026-10-06)** — 핵심 모델을 글록 4.7로 변경. Composer·Auto 분석 전용은 2026-08-04부터 유지.

## 요약

| 구분 | 내용 |
|------|------|
| **김팀장 핵심 모델** | **glock 4.7** (글록 4.7 · Grok 4.7) · Task `grok-4.7-xhigh-fast` |
| **개발** | **글록 4.7(김팀장) · Fable · Sonnet** (+ `@Opus` 명시 시 Opus 보조) |
| **Composer · Cursor Auto/미지정** | **분석·검수 소견·대화 요약만** — 코드·로그·패치 초안 **금지** |
| **API 소진 플래그** | Composer/Auto에 **코드 예외 없음** — 가능하면 글록 4.7 세션에서 개발 |
| **교훈 (2026-08-02)** | worldmap 「고착 방지」 — **미지정 Auto/Composer** 예방 코드 금지 (글록 4.7과 구분) |

## 앵커

- 정본: `tools/kim-team-lead/reports/SUBSCRIPTION_RENEWAL_ANCHOR.json`
- 필드: `kimTeamLeadCoreModel` (`displayName` · `taskSlug`)
- 구독: **매월 10일 KST** (`lastRenewalDate` / `nextRenewalDate`)

## 검증

```bash
npm run audit:dev-process-gate
```

정본 규칙: `.cursor/rules/arcfire-paid-model-exclusion-gate.mdc`
