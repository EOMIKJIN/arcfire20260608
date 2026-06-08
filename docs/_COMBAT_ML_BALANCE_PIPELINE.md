# Combat ML Balance Pipeline (ArcCore)

실전 테스트(앱 직접 플레이)에서 나온 전투 결과를 ArcCore가 주기적으로 학습해 AABS 배율을 미세 보정하는 로컬-우선 파이프라인이다.

## 현재 동작

1. 전투 종료 시 `PlanetEdenRaidTestLayer`가 매치 요약(승패/지속시간/KD/규칙/행성)을 1회 기록한다.
2. `useCombatLearningTelemetryStore`가 최근 전투 로그를 AsyncStorage에 보관한다.
3. **`AiIntegratedPlanetCombatBalanceSubCore`** — 드라코 실기 테스트 최근 3전+ 기준 교전시간(목표 32초)으로 `globalEngageHpMul`을 조정하고 **전 행성 적 HP**에 반영한다. (`docs/INTEGRATED_LEVELING_AUTOMATION.md`)
4. `AiCombatLearningBalanceSubCore`가 wall tick 기준 12분마다 최근 샘플(최대 80전)을 읽어 다음을 조정한다.
   - `combatDifficulty`
   - `expReward`
   - `creditReward`
5. 보정은 기존 AABS 상한(`AABS_MAX_STEP_RATIO`, `AABS_MAX_CUMULATIVE_RATIO`) 안에서만 적용된다.

## 환경변수

- `EXPO_PUBLIC_COMBAT_ML_ENABLED`
  - `0`: 학습 보정 비활성
  - 미설정/기타: 활성(기본)
- `EXPO_PUBLIC_COMBAT_ML_REMOTE_SYNC`
  - `1`: 전투 요약을 Firestore `combat_ml_match_summary` 컬렉션에 업로드
  - 미설정/기타: 로컬 저장만 수행

## free-tier 운영 가이드

- 기본 권장: `EXPO_PUBLIC_COMBAT_ML_REMOTE_SYNC` 미설정(로컬 학습만).
- 팀 단위 분석이 필요할 때만 `EXPO_PUBLIC_COMBAT_ML_REMOTE_SYNC=1`로 샘플 수집한다.
- match summary만 전송하므로 hit 단위 로그 대비 쓰기량이 낮다.

## 확장 포인트

- 규칙별(웨이브/엘리미네이션/개인전) 분리 학습
- 행성/레벨밴드별 win-rate 목표치 차등
- Firestore 누적 로그를 외부 배치 학습으로 CSV/Parquet 변환 후 `dynamic_overlay.csv` 제안값 생성
