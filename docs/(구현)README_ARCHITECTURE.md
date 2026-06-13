# Arcfire Online — 아키텍처 문서 인덱스

에이전트·개발자는 **아래 순서**로 읽는다.

| 순서 | 문서 | 역할 |
|------|------|------|
| 1 | [`.cursor/rules/Arcfire_Master_Spec_v3.1_Final-1781345284482521549.mdc`](../.cursor/rules/Arcfire_Master_Spec_v3.1_Final-1781345284482521549.mdc) | **실행 규칙 (헌법 v3.1)** |
| 2 | [`AGENTS.md`](../AGENTS.md) | 에이전트 요약·한계 고지 |
| 3 | [`Arcfire_RN_Architecture_Master_Spec(single).md`](./Arcfire_RN_Architecture_Master_Spec(single).md) | 설계 정책 v2.0 + **§18 구현 정본** — v2.0 `aiVirtualPlayerStore` 등 **superseded**, 헌법은 **#1 v3.1** |
| 4 | [`2.1.memory.md`](./2.1.memory.md) | 메모리·스테이지 계약 상세 |
| 5 | [`Arcfire_Architecture_Audit_2026-06-08.md`](./Arcfire_Architecture_Audit_2026-06-08.md) | 최근 전수 검사 |
| 6 | [`ARCHITECTURE_RISK_REGISTER.md`](./ARCHITECTURE_RISK_REGISTER.md) | 리스크·방지책 |

**자동 감사**

```bash
npm run audit:memory
npm run audit:daily
```

**아카이브**(참고만, 신규 작업 금지): `Arcfire_RN_Architecture_Master_Spec(multi).md`, 루트 `Arcfire_RN_Architecture_Master_Spec.md` — 내용은 `(single)` + §18에 수렴.
