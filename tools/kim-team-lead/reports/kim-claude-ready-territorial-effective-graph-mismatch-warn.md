# READY — crimson_base effective≠runtimeGraph DEV 경고(LogBox) 제거

```text
status=READY
task_id=territorial-effective-graph-mismatch-warn-20260802
assignee_priority=1) Opus(김팀장)  2) 김클로드(API 불가 시)
commit=김클로드 PENDING 후 검수 · Opus 직접 시 대표님 지시 후
```

## 증상
DEV 콘솔/LogBox 노란 창:
`[territorial] crimson_base 최종 effective=blue_red != runtimeGraph=red_neutral (policy원본=blue_red, 세션당 1회) — effective 산출 로직 재검토 필요`

## 원인 (정본)
1. `crimson_base`는 동적 분쟁(`__dynamic_default__`) → `combatMode=blue_red`, `contestedZone=true`.
2. `crimson_zone` 인접: sirius / perseus / dark_rift / blood_field — 실측 시 **RED만** 인접(시리우스 독립국은 BLUE 아님).
3. `resolveEffectiveTerritorialCombatMode`: 비중립 hold에서 R1은 **양쪽 인접일 때만** `blue_red` 강제. 단측이면 **CSV/템플릿 `blue_red` 그대로 반환** → effective=`blue_red`.
4. `inferTerritorialCombatModeFromGraph`: 레드만 → `red_neutral`.
5. `runTerritorialCombatPass.ts` ~663: `console.warn(...)` → RN LogBox **메세지 창**.

즉 경고는 “effective 버그 의심”이지만, **동적 템플릿 blue_red + 단측 인접 폴백**이 그래프와 불일치하는 **산출 갭**이다. warn만 지우면 안 되고 effective를 그래프·단측 인접에 맞출 것.

## 수정 (권장 1안 — 원인 수정)

### A. `resolveEffectiveTerritorialCombatMode.ts`
비중립 + `contestedZone` 분기:

```text
both blue&red >0 → blue_red          (기존 R1)
blue only       → blue_neutral       (신규: 템플릿 blue_red 고착 방지)
red only        → red_neutral        (신규: crimson_base 케이스)
neither         → policyCombatMode   (고립 폴백)
```

NEUTRAL hold P0 로직은 **변경 금지**.

### B. 테스트
`resolveEffectiveTerritorialCombatMode.test.ts` 추가 예:
- RED hold + contested + supply `{blue:0,red:1}` + policy `blue_red` → effective `red_neutral`
- BLUE hold + contested + `{blue:1,red:0}` + policy `blue_red` → `blue_neutral`
- 기존 R1(양쪽→blue_red)·NEUTRAL P0·contestedZone=false 회귀 유지

### C. 경고
effective≡graph 정합되면 `console.warn`은 **자동으로 안 뜸**. warn 삭제/강등만 하는 **증상 우회 금지**(진짜 mismatch는 계속 보이게).

### D. self-check
```
npx tsc --noEmit -p tsconfig.client.json
npx tsx --test src/arcCore/territorial/resolveEffectiveTerritorialCombatMode.test.ts
```

## 금지
- Maginot / FrontPressure / CSV combatMode 무단 변경
- `console.warn`만 제거·`console.log` 강등만으로 “해결” 선언
- git commit(김클로드)

## 예상 결과
crimson_base: effective=`red_neutral` = runtimeGraph → LogBox 미표시.  
전투 경로는 단측 시 binary-dominance(red_neutral) — 보급 없는 BLUE 원정(blue_red)보다 정합.
