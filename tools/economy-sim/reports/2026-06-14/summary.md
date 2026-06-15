# Economy SIM Report — 2026-06-14

## Macro cohort (30d · n=1000)

| 코호트 | 평균 power |
|--------|------------|
| F2P | 11.65 |
| Dolphin | 15.56 |
| Whale | 40.48 |
| Whale/F2P | **3.48** (ok) |
| F2P < Dolphin < Whale | **OK** |

## In-app demand sim (표본 500)

- observed CPH: 6373
- target CPH: 6000

## Overlay delta (`deltaId=2026-06-14-1781435091651`)

### categoryTargetMul
{
  "weapon": 1.2499994668423215,
  "mineral": 0.8839693598772964,
  "food": 1.004935639878698,
  "tech": 1.249998063990159,
  "luxury": 1.2499980869483431,
  "contraband": 1.2499970915550322,
  "trade_route": 1.2499993109673377,
  "capital_ship": 1.2499960022310748
}

### aabsTargetMul
{
  "creditReward": 0.9502720973466283,
  "tradeIncome": 0.9627040730099713
}

앱 일일 배치 시 `ingestBalanceOverlayDeltaIfPending` → AsyncStorage overlay 반영.
