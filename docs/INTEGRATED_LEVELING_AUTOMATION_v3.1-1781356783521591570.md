# 통합 레벨링 자동화 (ArcCore Daily Ops) v3.1

> **문서 상태**: 🚀 v3.1 Master Spec 호환 업데이트 완료
> **변경 요약**: 4초 디바운스 및 90초 주기 실시간 overlay 갱신 구조 폐기. 프레임 저하 및 Master Spec 14항 위반을 차단하기 위해 **12:00 KST Daily Batch**로 수렴.

## 파이프라인 개요

```text
[정본 CSV] planet_leveling_progression.csv
    │ npm run sync:planet-hostile-combat-balance
    ▼
planet_hostile_red_progression.csv → build:balance-tables → 런타임 스냅샷
    │
[로컬 전투 텔레메트리 누적] PlanetEdenRaidOrbitSkiaCombat 전투 종료 시
    │ recordMatchSummary (AsyncStorage 로컬 로깅)
    ▼
[Daily Batch - 12:00] ArcCoreDailyOpsSubCore (runArcCoreDailyOpsBatch)
    │ 매일 12:00 KST, 최근 전투 텔레메트리 취합
    │ 평균 교전시간 vs targetEngageSec(32) 대비 분석
    │ globalEngageHpMul ±0.025~0.05 (0.7~1.3 상한 캡 적용, Rule 8 준수)
    │ planetCoreRuntimeStore.globalMultipliers 갱신
    ▼
전 행성 전투 밸런스 다음날부터 반영
```

## 운영 규칙
- **실시간 재배치 금지**: 전투 도중 혹은 직후에 적의 HP 배율이 실시간으로 변동되는 아키텍처는 성능과 플레이어 경험을 저해하므로 절대 금지.
- 학습 샘플은 오직 플레이어가 직접 플레이한 로컬 전투 결과만 사용(멀티플레이 데이터 없음).

## 수동 정본 갱신 (기획 표 수정 시)
```bash
npm run sync:planet-hostile-combat-balance
npm run audit:planet-combat-balance
```
