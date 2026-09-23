# HOLD — 웨이브 전투 프레임 개선 (별도 관리)

```text
status=HOLD
task_id=wave-combat-fps-improve-20260918
kind=IMPLEMENTATION_HOLD
code_changes=FORBIDDEN until 대표님 재지시
commit=FORBIDDEN
owner=김팀장
```

> **대표님 지시 (2026-09-18 20:18)**: 프레임 개선작업은 **별도로 관리하고 보류**.  
> 다른 기능·개인미션·돔·대화와 **섞지 말 것**. 재지시 전까지 `src/` 전투 틱·Skia 패치 금지.

---

## 0. 잠금

| 항목 | 값 |
|------|-----|
| 재현 | 베가(`vega_base`) · L3 · **1웨이브부터** · 성계 무관, 전투 ON이면 저하 |
| 플레이어 | 스타터만 (`w_laser_heavy_01` · `w_missile_guided_triple_01` · `w_missile_arc_005`) |
| 기각 | L1 Type C `w_laser_arc_012` 특수FX (아르카디아 전투 없음) |
| 연출 | 시각·무기 CSV·탄두 `!hitApplied` **불변** (재지시 때도 1안은 이 잠금) |
| 금지 | 두 번째 시뮬 rAF · 루프 안 `Path.Make()`/`Paint()` · Picture 수동 dispose |

---

## 1. 이미 반영 (재작업 금지)

스킬 0 틱 생략 · 크래프트 0 생략 · `agents.filter` 제거 · `prevPts` in-place · 적 닉네임 비렌더 · 미사일 메인 트레일 off · VFX 28/40 · 허브 궤도 dodge 끄고 성운으로 분리.

분석 정본: `kim-claude-wave-combat-fps-analysis-20260914.md` §7 · 재조사 2026-09-18.

---

## 2. 보류된 1안 (재지시 시 이것만)

기록 경로 Zero-Allocation. CSV·성운·VFX 임계 변경 없음.

1. `quadBezier` → 스크래치 `Pt` (`PlanetEdenRaidOrbitSkiaCombat.tsx` 199)
2. `writeDiamondPath` 로컬 배열·`w0` 제거 (386)
3. `makeMissileTrailPath` 결과/`head` 재사용 (443)
4. TestLayer `selfPrev`/`otherPrev` 폴백 `{x,y}` · `initialSpawnDuelWidePositions` 매프레임 할당 (3342, 3353)

**보류 부가안** (별도 승인): VFX 28→16 · 미사일 소프트 캡 · 성운 dodge 더 낮춤 · SkPicture 2틱 1회.

---

## 3. 병목 한 줄

공통 바닥 = 매 틱 `finishRecordingAsPicture` + React `setPicture` + 기록 중 JS `{x,y}` 할당.  
웨이브는 8연사·허브 이중 Canvas(궤도+성운)가 그 위에 겹침.

---

## 4. 교차

| 파일 | 역할 |
|------|------|
| `kim-claude-ready-wave-combat-fps-20260914.md` | 분석 READY (구현 아님) |
| `kim-claude-wave-combat-fps-analysis-20260914.md` | 09-14 재검수 |
| `PlanetEdenRaidOrbitSkiaCombat.tsx` | Skia 기록 |
| `PlanetEdenRaidTestLayer.tsx` | 시뮬 rAF |
