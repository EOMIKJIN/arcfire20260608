# READY — 웨이브 전투 프레임 저하 독립 분석

```text
status=HOLD
task_id=wave-combat-fps-analysis-20260914
superseded_by=wave-combat-fps-improve-20260918
hold=tools/kim-team-lead/reports/HOLD_WAVE_COMBAT_FPS_20260918.md
assignee=김클로드
kind=ANALYSIS_ONLY
commit=FORBIDDEN
code_changes=FORBIDDEN
post_review=2026-09-18 대표님 — 프레임 개선 별도 관리·보류. 구현은 HOLD 파일만.
```

> **배정**: 김팀장 · 2026-09-14 00:11 KST  
> **대표님 지시**: 프레임 저하 문제를 김클로드에게 공유하고 **분석을 시켜라**.  
> **김클로드**: 김팀장 분석을 **받아쓰지 말 것**. 코드·git diff·피커 실측으로 재검수 후 **AGREE / PARTIAL / DISAGREE** + 근거(파일:줄). **git commit 금지. 코드 패치 금지.** 분석 리포트만.

---

## 0. 대표님 확정 제약 (최우선)

| # | 제약 | 의미 |
|---|------|------|
| 1 | 플레이어는 **추가 무기와 무관** | 스타터 기본무기만. FPS 좋았을 때와 **동일 로드아웃** |
| 2 | 스타터 추정 | laser `w_laser_heavy_01` · missile `w_missile_guided_triple_01` · close `w_missile_arc_005` |
| 3 | 증상 | 웨이브 전투 FPS가 예전보다 **약 10** 떨어짐 |
| 4 | 이번 턴 | **분석만**. 패치는 대표님 승인 후 김팀장 |

플레이어 특수무기·플레이어 드론/모함·아이템 UI·첫 스캔 메신저를 원인으로 **단정하지 말 것**. 코드로 재확인한 뒤에만 기각/유지.

---

## 1. 김팀장 1차 분석 (재검수 대상 — 맹신 금지)

김팀장이 2026-09-13 세션에서 내린 잠정 결론. **그대로 쓰지 말고** AGREE/PARTIAL/DISAGREE.

### 1-1. 플레이어 기본무기 → 특수FX/크래프트 기각

- 위 3종은 `weapon_special_fx_policy.csv`에 **행 없음**
- drone/carrier 패밀리 아님 → `capitalCraftPool` 스폰 안 함
- 스킬 보유 여부는 대표님이 **명시하지 않음**. 스킬 있으면 `tickPlayerAutoCombatSkills` 비용이 커질 수 있음

### 1-2. 아르카디아(combatLevel=1) 적 픽 — 김팀장 실측

`npx tsx`로 `resolveHostileEnemyWeaponLoadout` 실행 결과:

| 패턴 | laser 슬롯 | missile 슬롯 | 김팀장 해석 |
|---|---|---|---|
| A | `w_laser_light_01` | `w_laser_arc_007` 로켓 10연사 | **예전 정책 폴백과 동일** |
| B | `w_laser_light_01` | `w_missile_standard_01` 1발 | 예전 triple 3연사보다 **가벼움** |
| C | **`w_laser_arc_012` 로켓을 레이저 슬롯에** | `w_missile_standard_01` 1발 | ID는 예전 폴백과 같음. **특수FX가 신규** |

김팀장 주장: L1에는 `requiredLevel≤1` 로켓이 없어 곡선이 로켓을 업그레이드하지 않음. 「L1 적이 L4~6 10~12연사 로켓을 **새로** 든다」는 1차 가설은 **철회**.

### 1-3. Type C + `w_laser_arc_012` 특수FX (김팀장 1순위)

`csvWeaponSpecialFxPolicy`에 `w_laser_arc_012` = `second_burst` · AoE 24 · tint `#F97316` · mark 800ms.  
C형은 이걸 **레이저 슬롯**에 넣음 → 레이저 경로(즉시 타격)에서 `getWeaponSpecialFxPolicy` + `applySpecialWeaponAoeAroundPoint` + 함체 틴트 + Skia 추가 원.  
**12연사 로켓이 레이저에서 나가진 않는다**고 김팀장은 봄 (`kind=missile`이어도 레이저 발사는 즉시 1히트).

### 1-4. 상시 루프 (김팀장 2순위)

매 rAF (무기와 무관):

- `tickPlayerAutoCombatSkills` — `PlanetEdenRaidTestLayer.tsx` ~3079
- `tickCapitalCrafts` 16칸 — ~3628
- 크래프트 요격 루프 (`quadBezier` 점 할당) — ~3630
- 착탄마다 `getWeaponSpecialFxPolicy` + `applyIncomingDamage` 인자 증가
- `resolveCapitalWeaponImpact` → 로켓은 `spread_circle` (이건 **HEAD에도 이미 있음**)
- Skia `statusTint` / `statusIconKind` — `PlanetEdenRaidOrbitSkiaCombat.tsx` ~872
- 기존 `agents.filter` / `.some` 매 프레임 (~3131) — **신규 아님**

김팀장: 빈 풀·스킬 없음만으로는 ~10fps를 설명하기 어렵고, **1-3과 겹치면** 체감.

### 1-5. 적 근접 8연사 (전 적)

hostile overwrite는 `laserWeaponId`/`missileWeaponId`만. `closeRangeWeaponId`는 함선 CSV 기본 `w_missile_arc_005` (8연사)가 남음.  
`createCapitalAgentBase`는 `specifiedClose === undefined`면 `DEFAULT_CLOSE_RANGE_WEAPON_ID`.  
이게 **예전에도 있었는지**(good-FPS 대비 신규인지) 김클로드가 git/생성 TS로 확인.

### 1-6. 후반 행성 (L5+)

곡선이 여기서부터 진짜로 올라감. L5 예: A `w_laser_arc_011` 커팅빔(특수FX) + 007 로켓10 · B/C `w_missile_arc_009` 파편 AoE.  
대표님이 아르카디아만 재현했는지 **미확인**.

### 1-7. 김팀장 1안 (패치 금지 — 참고만)

L1 Type C가 특수FX 로켓을 레이저로 쓰지 않게. L1은 진짜 레이저 + 정책 폴백. 특수FX AoE는 밴드 밖.  
부가: 크래프트 0이면 요격 생략, 스킬 없으면 스킬 틱 생략.

---

## 2. 반드시 읽을 파일

| 파일 | 볼 것 |
|------|------|
| `src/combat/hostileEnemyWeaponLoadoutFromBalance.ts` | 곡선 피커 · last-id-wins · A/B/C |
| `src/combat/hostileEnemyWeaponLoadoutFromBalance.test.ts` | L1/행성 레벨 |
| `src/components/planet/PlanetEdenRaidTestLayer.tsx` | 적 로드아웃 주입 ~2528 · rAF 스킬/크래프트/레이저FX/요격 |
| `src/combat/capitalWeaponImpact.ts` | `spread_circle` · special FX AoE · intercept |
| `src/combat/weaponSpecialFxPolicy.ts` + `src/data/balance/generated/csvWeaponSpecialFxPolicy.ts` | `w_laser_arc_012` 행 |
| `src/combat/capitalCraftPool.ts` | `tickCapitalCrafts` · 빈 슬롯 비용 |
| `src/combat/playerAutoCombatSkills.ts` | 스킬 0일 때 틱 비용 |
| `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx` | craft draw · status tint |
| `src/combat/capitalWeaponRuntimeSpec.ts` | rocket → `spread_circle` (HEAD에도 있는지) |
| `src/data/balance/generated/csvHostileEnemyWeaponLoadoutPolicy.ts` | 예전 폴백 ID |
| `src/data/generated/csvNpcCapitalShips.ts` | 적 close `w_missile_arc_005` |
| `src/game/combatWeaponSlots.ts` | `DEFAULT_CLOSE_RANGE_WEAPON_ID` |

`git diff HEAD --stat` 참고 (작업트리, 미커밋):

- `PlanetEdenRaidTestLayer.tsx` **+941/−260 근처**
- `capitalWeaponImpact.ts` **+201**
- `PlanetEdenRaidOrbitSkiaCombat.tsx` **+90**
- `capitalWeaponRuntimeSpec.ts` **+14**

전 repo 스캔 금지. 위 축만.

---

## 3. 김클로드 산출 (필수)

파일: `tools/kim-team-lead/reports/kim-claude-wave-combat-fps-analysis-20260914.md`

handoff `kim-claude-handoff-pending.md` **맨 위**에 `status=PENDING` 블록 추가. **commit 금지.**

리포트에 넣을 것:

```text
[pss-pre-dev] hot_path=... alloc=... cache=...
[pss-pre-dev] stage=... risk=P1~P7
[pss-pre-dev] verdict=PASS|REDESIGN — 분석만이면 PASS
```

1. 김팀장 §1-1~1-6 각 항목 **AGREE / PARTIAL / DISAGREE** + 파일:줄 또는 명령 출력
2. 김팀장이 **놓친** 상시/착탄 핫패스 (있으면)
3. 원인 순위 (플레이어 기본무기 제약 유지)
4. 실기로 가를 1~2 질문 (행성/웨이브)
5. 패치 1안만 (구현하지 말 것). 기존 CSV 확정값 변경이면 재확인 필요 표시

---

## 4. 금지

- `src/` · `app/` · `tables/` diff
- git commit / merge / 「수정 완료」
- 드론/모함 `effectPending` 롤백 제안만으로 단정 (대표님 미승인)
- Stage 1 레이아웃 상수 · Skia 루프 내 `Make()`/`Paint()` 제안
- 전 repo 스캔
