# 특수무기류 개발 정밀검사 · 미완부분 대안 제시 (분석 전용)

```text
status=ANALYSIS_ONLY
task_id=weapon-special-fx-system-inspection-20260913
kind=DEVELOPMENT_QA + GAP_REMEDIATION_PROPOSAL
code_changes=NO
author=김클로드
date=2026-09-13
trigger=대표님 — 특수무기류 개발분 연출·완성도 점검 + 메모리효율·리스크 전수정밀검사 + 전체 무기리스트 미완부분 기능작동 가능 수준 대안 제시. 완료 시 김팀장 전달.
```

## 0. 결론 먼저

오늘 새로 생긴 `src/combat/weaponSpecialFxPolicy.ts` + `tables/balance/weapon_special_fx_policy.csv`(34개 무기 커버)를 정밀검사한 결과 — **연출뿐 아니라 실제 전투 판정(실드/장갑 무시·광역·감속·EMP·요격)까지 진짜로 동작한다.** 메모리도 이 프로젝트 관례(캐시·무할당 루프)를 지킨다. 리스크는 발견 안 됨.

**미완 부분**: 34개 중 4개는 CSV 자체 주석에 "연출만"이라고 스스로 밝혀뒀고, 별도로 무기 설명문(플레이버 텍스트)에 강한 특수 능력이 적혀 있는데도 이 테이블에 행 자체가 없는 무기가 8개 더 있다. 전부 **기존 CSV 스키마 값만 채우면(코드 변경 없이) "기능 작동 가능" 수준까지 끌어올릴 수 있는** 대안을 §4에 구체적으로 제시했다 — 딱 1개("제네시스 모함"의 아군 치유 절반)만 소규모 코드 추가가 필요하다고 솔직하게 표시했다.

## 1. 연출·기능 완성도 검사

### 1-1. 실제로 전투 판정에 반영되는지 (연출로 그치지 않는지) 확인

`src/combat/capitalWeaponImpact.ts`에서 직접 확인:

| 기능 | 함수 | 실제 동작 |
|------|------|-----------|
| 실드/장갑 무시 | `applyIncomingDamage(..., policy.ignoreShield, policy.ignoreArmor)` | 데미지 적용 시 실제 파라미터로 전달됨 — 색만 다른 게 아니라 방어 계산 자체를 우회함 |
| 광역(AoE) | `applySpecialWeaponAoeAroundPoint` | 반경 내 적만(아군 제외) 순회, 데미지 35% 감쇄 후 적용 — 실제 광역 피해 |
| 감속/EMP | `applySpecialWeaponStatusOnAgent` | `speedSlowMul`/`speedSlowUntilMs`를 실제로 갱신 |
| 실드 박탈 | `stripShield` → `victim.shieldHp = 0` | 실제 수치 조작 |
| 인근 투사체 요격 | `applyInterceptNearbyProjectiles` | 베지어 곡선상 실시간 위치 계산 후 `hitApplied=true` 마킹 — 실제 무효화 |

**결론: 이 34개는 겉치레가 아니라 실제로 다르게 싸운다.**

### 1-2. 유닛테스트 재실행

```
npx tsx src/combat/weaponSpecialFxPolicy.test.ts
```
13개 케이스 전부 확인(고스트 실드/장갑 무시·EMP 광역감속·에너지보우 실드무시·요격·선더링 실드박탈·프레젠테이션 캐시 동일참조 등) — **직접 실행해 PASS 확인**.

## 2. 메모리효율·리스크 전수검사

| 항목 | 확인 결과 |
|------|-----------|
| CSV 파싱 캐시 | `getWeaponSpecialFxPolicy`가 `Map` 캐시(모듈 전역, 1회 파싱 후 재사용) — 파일 헤더 주석 "틱에서 신규 객체 생성 없음"과 실제 코드 일치 |
| 프레젠테이션 캐시 | `resolveCapitalLaserBeamPresentation`/`resolveCapitalProjectilePresentation` 둘 다 `Map` 캐시 — 테스트에서 "동일 객체 참조" 직접 검증됨(104-111행) |
| 틱 루프 할당 | `applySpecialWeaponAoeAroundPoint`/`applyInterceptNearbyProjectiles` 전부 `for` 루프 + 기존 배열(`agents`/`missiles`) 순회 — `.filter()`/`.map()` 등 신규 배열 생성 없음 |
| 데이터 정합성 | CSV 34행 전부 `getWeaponSpecialFxPolicy`가 파싱 가능한 형식(hex색·플래그) 확인 |
| 상점 노출 리스크 | 어제 발견한 "드라코 VMock" 테스트 무기 10개 + 웨이브 테스트 무기 2개가 특수무기 시스템을 거쳐 상점에 새겼는지 확인 — `isCanonicalTradePortWeapon()`이 `tradePortListed===true`로 걸러 **정상 차단됨**(리스크 없음) |
| 부수 발견(낮은 우선순위) | `src/game/weaponItemBridge.ts`의 `listWeaponTradeItemIds()` — 정의부 외 호출부 0건(죽은 코드). 지금 당장 문제는 없음, 정리 후보로만 기록 |

**결론: 메모리·리스크 문제 없음.**

## 3. 전체 무기리스트 미완 부분 — 실제로 찾은 것

`weapon_list.csv`의 "치명사거리"(플레이버 특수 표기: IgnoreAC/IgnoreDR/Sunder/Warp/All/Plane/Creator 등)와 `weapon_special_fx_policy.csv` 34행을 전수 대조했다.

### 3-1. CSV 자신이 "연출만"이라고 밝힌 것(4개)

| 무기 | 표기된 능력(설명문) | 실제 구현 |
|------|----------------------|-----------|
| `w_laser_arc_056` 하이어라키 제어 빔 | 적 함선 통제권 탈취→자폭 명령 | **연출만(탈취 미구현)** — CSV 자체 주석 |
| `w_missile_arc_059` 스타-제네시스 캐넌 | 포탄 착탄점에서 새 별 탄생, 적 흡수 | 연출만 |
| `w_missile_arc_068` 에테르 파편 미사일 | 존재 자체를 논리적으로 부정 | 연출만 |
| `w_missile_arc_069` 보이드 스트라이크 | 좌표를 지도에서 삭제 | 연출만 |

### 3-2. 설명문에 강한 특수 능력이 있는데 정책 테이블에 행 자체가 없는 것(8개)

| 무기 | 설명문 능력 | 특수 표기 |
|------|-------------|-----------|
| `w_missile_arc_022` 장거리 순항 미사일 | 성계 경계 초월 사거리 | Global |
| `w_missile_arc_040` 초광속 미사일 | 워프 중인 적도 추격 | Distant |
| `w_missile_arc_051` 차원 도약 미사일 | 차원 도약으로 레이더 기만 | Warp |
| `w_missile_arc_060` 옴니-조준 시스템 | 전장의 **모든** 적 함선 동시 사격 | All |
| `w_missile_arc_061` 월드-에코 충격파포 | 성계 전체 진동으로 적 파손 | Planet |
| `w_missile_arc_063` 제네시스 모함 | **아군 치유 + 적 분해**(양방향 효과) | Creator |
| `w_laser_arc_048` 카스의 파멸 로켓탄 | 적 에너지를 빨아들임 | (설명문 내) |
| `w_missile_arc_036` 아다만틴 함재기 | 대공포 무효(장갑 무시) | IgnoreDR |

`w_missile_arc_036`은 함재기(carrier) 계열이라 `weapon_craft_loiter_policy.csv`(별도 테이블)에 있는데, 실제 행(`adamantine_ram`)을 열어보니 `ignoreShield=0`으로 돼 있어 — **설명문의 "장갑 무시" 능력이 그 테이블에도 반영 안 돼 있음**을 확인했다.

## 4. 대안 제시 — 기능 작동 가능한 수준으로 (전부 CSV값만 채우면 되는 안, 코드 변경 없음)

기존 `weaponSpecialFxPolicy.ts`/`capitalWeaponImpact.ts`는 이미 완성돼 있어 **CSV에 값만 넣으면 즉시 작동한다.** 새 컬럼·새 코드가 필요 없는 안 위주로 골랐다.

| 무기 | 제안 값(기존 컬럼만 사용) | 근거 |
|------|---------------------------|------|
| 하이어라키 제어 빔 | `stripShield=1`, `markMs=1600`(현재값 유지) | "통제권 탈취"를 문자 그대로 구현하는 대신, 이미 있는 `stripShield`(실드 박탈)로 "제어 상실" 느낌을 안전하게 대체 — 새 "적 AI 탈취" 로직(리스크 큼)을 피함 |
| 스타-제네시스 캐넌 | `aoeRadiusPx=44`, `slowMul=0.4`,`slowMs=2200` | 코스믹 티어(최상급) 무기이니 기존 최상급 광역+감속 조합(카이로스·싱귤래리티 수준)으로 격 맞춤 |
| 에테르 파편 미사일 | `aoeRadiusPx=36` | 이미 "shard/파편" 계열 다른 무기(파편탄두 등)와 동일 패턴 재사용 |
| 보이드 스트라이크 | `slowMul=0.5`,`slowMs=2400` | "존재를 지움" 플레이버를 기존 void 계열(보이드 보텍스 등)과 같은 강한 감속으로 통일 |
| 장거리 순항 미사일 | 특수효과 없음 유지, 다만 `iconEmoji`+`tintHex`만 부여(연출용) | "Global"은 이미 사거리 스탯(211px, 티어 최고 수준)으로 반영돼 있음 — 별도 전투 메커니즘 불필요, 시각적 구분만 추가 권장 |
| 초광속 미사일 / 차원 도약 미사일 | 위와 동일(아이콘/틴트만) | "Distant/Warp"도 사거리(227/241px, 각 티어 최고)로 이미 반영됨 |
| 옴니-조준 시스템 | `aoeRadiusPx`를 테이블 내 **최댓값**으로(예: 60) | "모든 적 동시 사격"을 문자 그대로(사거리 무제한 전체타격) 구현하면 밸런스 리스크가 크다 — 기존 스키마 안에서 "가장 넓은 광역"으로 근사하는 게 안전한 타협 |
| 월드-에코 충격파포 | `aoeRadiusPx=56` | 위와 같은 논리(성계 전체→테이블 내 최대 광역으로 근사) |
| 카스의 파멸 로켓탄 | `slowMul=0.6`,`slowMs=2000` | "에너지 흡수"를 나노소울(`soul_dissolve`)과 같은 패턴(감속으로 근사)으로 통일 |
| 아다만틴 함재기 | `weapon_craft_loiter_policy.csv`의 `adamantine_ram` 행에서 `ignoreShield`를 `0`→`1`로 정정 | 설명문("대공포 무효")과 실제 값이 지금 어긋나 있음 — 이건 신규 기능 추가가 아니라 **기존 값 오기 정정**에 가까움 |

**코드 변경이 필요한 유일한 예외**: 제네시스 모함(`w_missile_arc_063`)의 "아군 치유" 절반은 `applySpecialWeaponAoeAroundPoint`가 지금 적 팀(`ag.team !== owner.team`)만 순회하도록 짜여 있어(§1-1 확인), CSV 값만으로는 재현 불가하다. **제안**: 이번엔 적 피해 절반만(`aoeRadiusPx=52` 등, 기존 스키마)으로 우선 채우고, "아군 치유" 절반은 별도 소규모 함수(`applyAllyHealAroundPoint` 등, 기존 AoE 함수와 대칭 구조로 신규 10줄 내외) 추가가 필요하다고 김팀장께 명시적으로 알린다 — 이번 조사는 그 코드까지 대신 만들지 않았다(범위 밖).

## 5. 지금 하지 않은 것

CSV 값 하나도 안 바꿨다. §4는 전부 제안이고, 실제 반영은 김팀장 판단 후 진행. 코드 변경(§4 마지막 항목의 아군 치유 함수)도 착수하지 않았다.

**END** — 2026-09-13 · 김클로드
