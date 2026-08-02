# 팀 공지 — Composer·글록 **분석 전용** (2026-07-11 · **2026-08-02 강화**)

**대표님 지시 반영**

## 요약

| 구분 | 내용 |
|------|------|
| **개발** | **Opus(김팀장) · Fable · Sonnet** 만 |
| **Composer·글록** | **분석·검수 소견·대화 요약만** — 코드·**간단한 로그**·패치 초안 **절대 금지** |
| **API 소진 플래그** | 있어도 **코드 예외 없음** — handoff/문서 마감·텍스트 수정안만 |
| **교훈 (2026-08-02)** | worldmap 「고착 방지」 안전망(①③)이 정상 이동을 깨뜨림 → 폴백이 예방 코드를 넣지 못함 |

## 구독 갱신일

- 정본: `tools/kim-team-lead/reports/SUBSCRIPTION_RENEWAL_ANCHOR.json`
- 현재 설정: **매월 10일 KST** 갱신 (`lastRenewalDate` 2026-07-10 → `nextRenewalDate` 2026-08-10)
- 실제 갱신일이 다르면 **JSON만** 수정

## API 소진 시 (문서·분석만)

```powershell
# 유료 API 소진 — 분석/handoff 문구 마감만 (코드 금지)
Set-Content -Path tools/kim-team-lead/reports/API_EXHAUST_FALLBACK_ACTIVE.flag -Value "2026-08-02T13:00 KST API exhausted — analysis/handoff text only"
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
