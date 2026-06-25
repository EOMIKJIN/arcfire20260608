# Economy Macro SIM

F2P / Dolphin / Whale 코호트 + `simMarketDemandEngine` → **overlay delta** → 앱 일일 배치 ingest.

## 실행

```bash
npm run verify:economy-sim-cohort   # F2P < Dolphin < Whale (SIM 전용)
npm run sim:economy                  # verify 후 delta 생성
```

## 정책 CSV (`npm run build:balance-tables`)

| CSV | 용도 |
|-----|------|
| `economy_sim_macro_policy.csv` | 코호트 SIM 파라미터 |
| `economy_trade_mineral_sink_policy.csv` | 무역소 weapon_module / capital_ship 광물 소모 |

## 산출물

| 경로 | 용도 |
|------|------|
| `src/data/balance/generated/economySimOverlayDelta.ts` | 앱 번들 ingest 정본 |
| `tools/economy-sim/outbox/latest-delta.json` | CI·에이전트 handoff |
| `tools/economy-sim/reports/YYYY-MM-DD/` | KPI·metrics |
| `tools/economy-sim/reports/latest.md` | 최신 요약 |

## 앱 반영

1. `npm run sim:economy` (PC/CI)
2. 앱 기동 → `ArcCoreDailyOpsSubCore` → `ingestBalanceOverlayDeltaIfPending()` (새 `deltaId` 1회)
3. 이어서 `runMarketMicroAdjustPass()` (기존 in-app sim)

Metro reload 또는 재빌드 후 테스트. 동일 `deltaId`는 재ingest하지 않음.

## 스케줄

- GitHub Actions: **자동 cron 없음** (실패 알림 메일 방지). 필요 시 Actions에서 `Daily economy sim` 수동 실행.
- 로컬: `npm run sim:economy` (김경제 handoff · 일일 배치 전)

## 전투 layer

`combatWeight: 0` — `combatDifficulty` AABS knob은 ingest 생략. 전투 SIM 연동 후 policy에서 weight 상향.

상세: `docs/ECONOMY_SIM_DAILY_OPS.md`
