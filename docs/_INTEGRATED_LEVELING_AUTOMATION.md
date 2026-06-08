# 통합 레벨링 자동화 (ArcCore)

## 파이프라인 개요

```
[정본 CSV] planet_leveling_progression.csv
    │ npm run sync:planet-hostile-combat-balance
    ▼
planet_hostile_red_progression.csv → build:balance-tables → 런타임 스냅샷
    │
[드라코 실기 테스트] PlanetEdenRaidTestLayer 전투 종료
    │ recordMatchSummary (AsyncStorage)
    │ dispatch combat_match_recorded
    ▼
AiIntegratedPlanetCombatBalanceSubCore (4초 디바운스 + 90초 주기)
    │ 드라코 최근 3전+ 평균 교전시간 vs targetEngageSec(32)
    │ globalEngageHpMul ±0.025~0.05 (0.7~1.3)
    │ dispatch integrated_planet_combat_balance_tuned
    ▼
AiPlanetOrbitCaptainAssignmentSubCore → 전 행성 combatOverlay 재게시
```

## 드라코 테스트 → 전 행성

- 드라코(`draco_haven`)에서 직접 플레이한 전투만 **학습 샘플**로 사용한다.
- 학습 결과는 `globalEngageHpMul` 하나로 저장되며, **15개 전투 행성 + 드라코 테스트 함선(`npc_ai_ships.csv` + `dracoCombatTestLoadout` Lv3 스케일)** 에 동일 배율이 곱해진다.
- 테스트 바이패스(`DRACO_NEBULA_TEST_COMBAT_BYPASS`)가 켜져 있어도 텔레메트리·HP 배율은 동작한다(AABS 레벨 보정만 우회).

## 수동 정본 갱신 (기획 표 수정 시)

```bash
npm run sync:planet-hostile-combat-balance
npm run audit:planet-combat-balance
```

## 검증

```bash
npm run audit:leveling
npm run audit:planet-combat-balance
npx tsc --noEmit
```

## 환경변수

- `EXPO_PUBLIC_COMBAT_ML_ENABLED=0` — 텔레메트리 기록은 유지되나 **자동 HP 보정 비활성**

## DEV 확인

전투 종료 후 로그: `[ArcCore/IntegratedCombatBalance] combat_match_debounced mul …`
