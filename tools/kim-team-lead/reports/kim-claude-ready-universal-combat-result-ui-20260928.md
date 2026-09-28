# 범용 전투 결과 UI 통합 — 설계 명세 (READY)

```text
status=PENDING
task_id=universal-combat-result-ui-20260928
kind=DESIGN_SPEC (김클로드 코드 변경 0 · 커밋 0)
date=2026-09-28
대표님 지시=「모든 전투는 동일한 범용 결과 UI 표시가 진행되어야 한다 (기준은 웨이브전투결과)」
정본 UI=ArcOverlayWaveResultEntry / WaveResultOverlayContent
```

---

## 1. 현황 — 5개 종료 경로가 «4가지 다른 동작»

| # | 전투 | 현재 종료 표시 | 위치 |
|---|---|---|---|
| 1 | **허브 웨이브** | `presentWaveResultOverlay` (kind=`waveResult`) ← **기준** | `planet.tsx:1268` |
| 2 | **이동중 전투 승리** | `showArcOverlayReward` (kind=`reward`) — **다른 UI** | `transitCombatPostFlow.ts:162` |
| 3 | 이동중 전투 패배 | `showArcAlert('전함 격침')` — 단순 알림 | `combat.tsx:287` |
| 4 | **허브 비-웨이브 승리** | **없음** ← 이번 드라코 증상 | `PlanetEdenRaidTestLayer.tsx:3275` |
| 5 | 허브 비-웨이브 패배 | `showArcAlert('전함 격침')` | `PlanetEdenRaidTestLayer.tsx:3204` |

추가로 이동중 전투는 **장비 파손을 별도 alert**(`combat.durabilityDestroyed*`)로 한 번 더 띄운다 → 승리 시 팝업이 **2개** 연속.

---

## 2. 기준 UI (현행 웨이브 결과창)

`WaveResultOverlayContent.tsx` 구성:

```
[ ✦ 승  리 ✦ ]              ← outcome
  웨이브 디펜스 — 최종 결과    ← subtitle
  ─────────────────
  클리어 웨이브     3 / 9     ← InfoRow
  — 보상 획득 —
  ⭐ 경험치 +1,200
  🎁 기타 아이템 — 추후 제공 예정
        [ 확인 ]
```

타입: `outcome` · `wavesCleared` · `totalWaves` · `expEarned` · `itemRewards?` · `onClose`

---

## 3. 🔴 통합 전 반드시 정해야 할 3가지 (대표님·김팀장 판단)

구현 전에 막히는 지점이다. **명세만으로 진행하면 잘못 만든다.**

### D-1. 비-웨이브 허브 교전에는 «보상이 없다»

`PlanetEdenRaidTestLayer.tsx:3252-3296` 승리 처리에 **`addExp`·`addCredits` 가 없다.** 하는 일은 내구 소모 · `recordMatchSummary` · 재교전 쿨다운 · 미션 목표 반영뿐.

→ 지금 그대로 결과창을 붙이면 **「경험치 +0 · 보상 없음」** 카드가 뜬다.

| 안 | 내용 |
|---|---|
| **a** | 보상 없이 **전과만** 표시(격파 대상·교전 시간) — 보상 섹션 숨김 |
| **b** | 비-웨이브 교전에도 **경험치·크레딧 지급 신설** (밸런스 영향 큼 · CSV 필요) |
| c | 현행 유지(결과창 미표시) — 대표님 지시와 배치 |

**김클로드 권고 = a.** 「이겼다」는 피드백이 목적이고, 보상 신설은 별건 밸런스 과제다.

### D-2. 비-웨이브 허브 교전은 «리스폰형 상시 교전»이다

`useWaveDefenseController.ts:10-11` — 자동 리스폰 재교전을 쿨다운으로만 막는 구조. 격파마다 **40초 자동닫힘 결과창**이 뜨면 허브 체류가 불가능해진다.

→ **자동닫힘을 venue별로 분리** 권고: 웨이브·이동중 = 40s(현행 유지) / 허브 비-웨이브 = **8~10초** 또는 토스트형.

### D-3. 이동중 전투는 «현재 정상 동작하는 UI» 를 교체하는 것

2번 경로는 지금 `reward` 카드가 정상 표시된다. 이를 `waveResult` 로 바꾸면 **회귀 위험**이 생긴다.
또한 `kind: 'reward'` 는 **미션 보상 등 다른 곳에서도 쓰이므로 제거 금지.**

→ 이동중 전투만 **후순위**로 두고, 4·5(현재 아무것도 없는 곳)부터 적용하는 단계 분할을 권고한다.

---

## 4. 제안 계약 — `ArcOverlayWaveResultEntry` 확장

**kind 는 `'waveResult'` 유지**(기존 호출부·렌더러 마이그레이션 비용 0). 필드만 확장한다.

```ts
export type ArcOverlayWaveResultEntry = ArcOverlayBase & {
  kind: 'waveResult';
  outcome: 'win' | 'lose';

  /** ★신규 — 전투 종류. 부제·행 구성 분기 */
  venue: 'wave' | 'hub_orbit' | 'transit';

  /** 웨이브 전용. 비-웨이브는 생략 → 「클리어 웨이브」 행 자체를 숨김 */
  wavesCleared?: number;
  totalWaves?: number;

  /** ★신규 — 「{name} 격파」 표기 (이동중·허브 궤도) */
  enemyName?: string;

  expEarned: number;
  /** ★신규 — 이동중 전투 크레딧 */
  creditsEarned?: number;
  /** ★신규 — 장비 파손. 별도 alert 대신 결과창에 통합(팝업 2개 → 1개) */
  destroyedLabels?: string[];

  itemRewards?: { icon: string; label: string }[];
  onClose: () => void;
};
```

**하위 호환**: `venue` 를 optional 로 두고 기본값 `'wave'` 로 하면 `planet.tsx:1268` 은 **무수정**으로 동작한다.

### 렌더 분기 (`WaveResultOverlayContent`)

| 요소 | 조건 |
|---|---|
| subtitle | `wave` → 「웨이브 디펜스 — 최종 결과」 · `hub_orbit` → 「궤도 교전 — 결과」 · `transit` → 「이동중 교전 — 결과」 |
| 「클리어 웨이브 N/M」 행 | `venue === 'wave'` 이고 두 값이 모두 있을 때만 |
| 「{name} 격파」 행 | `enemyName` 있을 때 |
| ⭐ 경험치 | `expEarned > 0` 일 때 |
| 💠 크레딧 | `creditsEarned > 0` 일 때 |
| 🔧 파손 장비 | `destroyedLabels` 비어있지 않을 때 |
| 🎁 기타 아이템 | 보상 행이 **하나도 없을 때만** 「보상 없음」으로(현행 placeholder 대체) |

신규 i18n 키(ko/en 동시):
`waveResult.subtitleHubOrbit` · `waveResult.subtitleTransit` · `waveResult.credits` · `waveResult.destroyed` · `waveResult.noReward` · `waveResult.enemyDefeated`

---

## 5. 적용 순서 (단계 분할 — 회귀 최소)

| 단계 | 대상 | 내용 | 위험 |
|---|---|---|---|
| **1** | 계약 확장 | §4 타입 + 렌더 분기 + i18n. **호출부 변경 0** | 없음(기존 호출은 기본값으로 동일 동작) |
| **2** | **#4 허브 비-웨이브 승리** | `PlanetEdenRaidTestLayer.tsx:3275` 에 결과창 연결 (`venue:'hub_orbit'`, D-1/D-2 결정 반영) | **낮음 — 지금 아무것도 없다** |
| **3** | #5 허브 비-웨이브 패배 | 격침 alert → 결과창(lose) + 생존포드 안내는 결과창 `onClose` 뒤 | 낮음 |
| 4 | #3 이동중 패배 | 동일 패턴 | 중 |
| **5** | #2 이동중 승리 | `showArcOverlayReward` → 결과창. **`reward` kind 자체는 존치** | **중 — 현재 정상 동작 교체** |
| 6 | 장비 파손 alert 흡수 | `transitCombatPostFlow` 의 별도 alert 제거, `destroyedLabels` 로 통합 | 중 |

**2단계부터 바로 대표님 증상이 해소된다.**

---

## 6. 검증 요구

- 계약 테스트: venue 4종 × outcome 2종 조합에서 **결과창이 반드시 present 되는가** (문자열 매칭 아님 — 동작 검증)
- `hubCombatEndPresentContract.test.ts` 를 확장해 **비-웨이브 경로**도 포함
- 릴리즈 실기: 드라코 일반 교전 승리 → 결과창 표시 확인

---

## 7. 한계 · 미확인

- **비-웨이브 교전의 경험치·크레딧 산출식이 없다.** D-1을 b로 정하면 CSV·밸런스 설계가 선행돼야 하고, 이는 본 명세 범위 밖이다.
- 퀘스트 전용 전투(`resolveQuestCombatLock`, `venue:'hub_orbit'`)가 별도 결과 연출을 요구하는지 확인하지 않았다.
- `vega_base` 자동 전투(QA 테스트 베드)는 대표님 지시로 유지 중인 상시 교전이다. D-2 판단이 여기에도 그대로 적용된다.

---

**김클로드는 설계만 했다** — 코드 변경 0 · 커밋 0. 구현은 D-1~D-3 결정 후.
