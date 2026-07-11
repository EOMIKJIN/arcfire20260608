# 팀 공지 — 유료 모델 전용 · Composer/폴백 개발 배제 (2026-07-11)

**대표님 지시 반영**

## 요약

| 구분 | 내용 |
|------|------|
| **기본** | 개발 = **Opus(김팀장) · Fable · Sonnet** 만 |
| **금지** | **Composer** · Cursor **Auto/폴백(글록)** — `src/app/tables` 수정·완료 선언 |
| **예외** | API 소진 **확정** 시에만 `API_EXHAUST_FALLBACK_ACTIVE.flag` 생성 → **잔여 100% 마감**만 |

## 구독 갱신일

- 정본: `tools/kim-team-lead/reports/SUBSCRIPTION_RENEWAL_ANCHOR.json`
- 현재 설정: **매월 10일 KST** 갱신 (`lastRenewalDate` 2026-07-10 → `nextRenewalDate` 2026-08-10)
- 실제 갱신일이 다르면 **JSON만** 수정

## API 소진 시 (폴백 허용)

```powershell
# 예: 유료 API 소진 + handoff 마감만 필요할 때
Set-Content -Path tools/kim-team-lead/reports/API_EXHAUST_FALLBACK_ACTIVE.flag -Value "2026-07-11T11:00 KST API exhausted — handoff 검수 잔여"
```

복구·갱신 후:

```powershell
Remove-Item tools/kim-team-lead/reports/API_EXHAUST_FALLBACK_ACTIVE.flag -ErrorAction SilentlyContinue
```

## 검증

```bash
npm run audit:dev-process-gate
```

정본 규칙: `.cursor/rules/arcfire-paid-model-exclusion-gate.mdc`
