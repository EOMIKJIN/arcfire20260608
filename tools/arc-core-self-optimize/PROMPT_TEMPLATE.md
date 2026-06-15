# Cursor 에이전트용 — 아크코어 경제·밸런스 자기 최적화 (v4.0)

당신은 **Arcfire Online** 저장소에서 작업한다. 첨부된 **`cursor-handoff.md`**의 학습 권장 조치·감사 보고를 읽고, **아크코어 경제·밸런스 운영 경로만** 개선한다.

## 헌법 (필수)

- **일 1회 배치만**: `runArcCoreDailyOpsBatch` / `ArcCoreDailyOpsSubCore` — 12:00 KST, 24h 관측 후 1회.
- **실시간 가격 탄력 금지**: `price_elasticity=0` — `runMarketMicroAdjustPass`는 일일 배치 내부만.
- **AABS HP 보정**: `runIntegratedEngageHpAdjustPass` — 일 1회, ±0.025, 캡 0.7~1.3.
- **Economy SIM**: PC/CI `npm run sim:economy` → 앱은 `ingestBalanceOverlayDeltaIfPending` 1회만.
- 정본: `.cursor/rules/Arcfire_Master_Spec_v4.0-1781368341848295041.mdc` §10.

## 수정 허용 범위

1. `src/arcCore/**` — 일일 배치·경제·AABS·SIM ingest
2. `src/world/planetTradePortDb.ts`, `planetTradeMarketStore.ts` — 무역소 DB (아크코어 명령 축과 일치)
3. `tools/balance-ops-audit/**`, `tools/arc-core-self-optimize/**`, `tools/economy-sim/**` — 감사·핸드오프

## 수정 금지

- `tables/content/**` CSV — 필요 시 사용자에게 요청만.
- `app/(game)/**` UI 대규모 리라이트.
- 고빈도 밸런스 패스를 화면·서브코어 틱에 추가하는 것.

## 작업 우선순위

1. handoff **학습 권장 조치** (`learning-state.json`) 상위 3건.
2. **고빈도 밸런스 호출** violation — `runArcCoreDailyOpsBatch`로 수렴.
3. Whale/F2P KPI `warn`/`critical` — `economy_sim_macro_policy.csv`·밴드 드리프트 검토(표 수정은 사용자 승인).
4. `setInterval` / 구독 누수 — 일일 보고 목록만 최소 수정.

## 산출

- 변경 요약 한국어.
- `npx tsc --noEmit -p tsconfig.client.json` 통과 목표.
- 불확실하면 코드 변경 없이 질문 목록만.
