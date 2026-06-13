# Economy SIM — 일일 운영 v3.1

> **문서 상태**: 🚀 v3.1 Master Spec 호환 검수 완료 (System Rule 14 완벽 준수)

**Macro SIM → delta ingest → 앱 overlay** 파이프라인 (전투 layer 전 단계).

## 운영 스케줄 (일 1회 배치 강제)
| 빈도 | 작업 |
|------|------|
| **매일 (자동)** | `npm run sim:economy` — CI 또는 로컬 환경 스케줄 기반 시뮬레이션 |
| **앱 라이브 연동** | 매일 12:00 KST 이후 기동 시 `runArcCoreDailyOpsBatch`가 무역·가격·AABS 델타를 로컬에 **1회 누적 반영** |
| **SIM 직후 테스트** | `sim:economy` → Metro reload → 앱 기동 (새 `deltaId` ingest) |

## KPI 기준 (싱글플레이 밸런스)
| status | Whale/F2P power |
|--------|-----------------|
| ok | < 5 |
| warn | 5 ~ 8 |
| critical | ≥ 8 |
*(참고: F2P < Dolphin < Whale 순위 유지 필수)*

## 파이프라인 흐름 (12:00 Batch)
```text
npm run sim:economy
  → economySimOverlayDelta.ts + outbox/latest-delta.json
       ↓
[12:00 KST Batch] 앱 runArcCoreDailyOpsBatch (runMarketPricePass)
  → ingestBalanceOverlayDeltaIfPending()
  → runMarketMicroAdjustPass()
       ↓
TradeEngine / AABS — 플레이어 로컬 경제 체감 (다음날까지 시세 고정)
```
