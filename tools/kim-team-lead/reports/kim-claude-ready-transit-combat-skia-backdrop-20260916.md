# READY — 이동중 전투 Skia 배경 · 구현+자가검수 이관

```text
status=REVIEWED
verdict=PARTIAL
task_id=transit-combat-skia-backdrop-fix-20260916
assignee=CLOSED
kind=IMPLEMENT + SELF_REVIEW → KIM_TEAM_LEAD_REVIEW
commit=FORBIDDEN
kim_team_lead_code=STOP
post_review=CLOSED — 재구현 금지. 정본=kim-team-lead-transit-backdrop-review-20260916.md
```

> **배정**: 김팀장 · 2026-09-16 19:01 KST  
> **대표님 지시**: 「지금 수정이 안되는 중이므로 김클로드가 이어서 구현하고 검수하는 쪽으로 변경한다.」  
> **김팀장**: 이 축 **코드 패치 중단**. 본 READY만 배정.  
> **김클로드**: 김팀장 패치를 **받아쓰지 말 것**. 현재 디스크·본인 분석(§1)·tombstone을 재검수 후 구현. AGREE/PARTIAL/DISAGREE + 근거(파일:줄). **git commit 금지.**

분석 정본: `tools/kim-team-lead/reports/kim-claude-transit-combat-skia-backdrop-inspection-20260916.md`

---

## 0. 대표님 확정 제약 (최우선)

| # | 제약 | 의미 |
|---|------|------|
| 1 | 이동중 전투만 | 허브 성운·STAGE1 궤도 성운과 **분리**. `planetMainStageLayout` 상수 금지 |
| 2 | 물리 궤도 크기 유지 | `orbitSize` / 전투 시뮬 박스 변경 금지 |
| 3 | 베가 조우 TEMP | **해제됨** (2026-09-16). `transitCombatForceQa` 삭제. 조우는 확률+전투가능만 |
| 4 | Skia Zero-Allocation | 틱 `Make()`/`Paint()` · Path `.map()` · PictureRecorder `dispose` · **`clipRect` 금지** · 틱 **`SkImage.width()`/`height()` 금지** |
| 5 | ColorDodge | 동일 Canvas. `color_dodge_02` 원본 크기 상수(78×77)만 |
| 6 | 풀화면 기준 | 타일 크기 = StageShell 위·아래 크롬을 **뺀** 콘텐츠 박스. 컨테이너를 밀어 단색 띠를 만들면 실패 |
| 7 | 커밋 금지 | handoff `PENDING`만. 김팀장/대표님 지시 전 commit 없음 |

재현: 베가 아웃포스트 이동중 전투 `/(game)/combat`.

합격: (a) 위·아래 **단색 `#05070e` 띠가 없음**(배경 레이어가 오버레이를 채움) (b) 구름이 크롬만 더럽게 넘치거나 중도 소멸하지 않음 (c) 시작·미사일 명중·종료 **튕김 없음**.

---

## 1. 왜 김팀장 패치를 이어서 고치지 않는가

대표님 판정: **지금 수정이 안 된다.** 김팀장이 같은 파일을 여러 번 뒤집었다.

| 시도 | 결과 |
|------|------|
| View `top/bottom` 크롬 인셋 | 김클로드 §1 — Canvas가 없어 단색 띠. 「위아래 공백」확정 |
| dest∩content + `width()` 제거 | 18:19 `JsiSkImage::width` tombstone과 겹치는 학습. 이후에도 튕김 보고 |
| §5 권고를 디스크에 반영(absoluteFill · 구름만 content box · `useEffect` ref · 리사이즈 2틱 skip · `as any`) | 대표님: 여전히 수정 안 됨 |

김클로드 §6은 「권고 미반영」시점 재검수였다. **그 이후 김팀장이 권고를 일부 넣었으나 실기 합격이 아니다.** 현재 파일을 다시 읽고, 권고를 기계적으로 재적용하지 말 것.

---

## 2. 김클로드 1차 분석 (재검수 대상 — 맹신 금지)

`kim-claude-transit-combat-skia-backdrop-inspection-20260916.md`

| # | 주장 | 김클로드 재검수 |
|---|------|----------------|
| A | 공백 = `backgroundOverlay`(이미 풀블리드)에 컨테이너 인셋 | 현재 `styles.root`가 `absoluteFill`인지 **지금 파일로** 확인. 띠가 남으면 **다른 원인**(타일 dest, 베이크 0,0 contain, StageShell `edges=['bottom']`, Canvas `gfxSize` 등)을 잡을 것 |
| B | tsc TS2345 → `as any` | 이미 우회됐을 수 있음. 게이트만 유지 |
| C | 18:10 `clipRect` / 18:19 `width()` — 앱 호출부 미확정. `useImage`×5 + 렌더 ref 레이스 가설 | tombstone `.tmp-crash-buf.txt` · `.tmp-crash-buf2.txt` 재확인. 가설이면 패치 근거를 한 줄로. 반쪽 `clipRect`/`width()` 재도입 **금지** |

---

## 3. 구현 범위

| 허용 | 금지 |
|------|------|
| `TransitCombatSkiaParallaxBackdrop.tsx` | `planetMainStageLayout` · 허브 성운 렌더러 개조 |
| `src/combat/transitCombatParallaxPlan.ts` + `.test.ts` | 궤도 물리/`orbitSize` |
| `planetSkiaHitFxContract.ts` ColorDodge **상수 src만**(필요 시) | 신규 Canvas · worklet · `clipRect` |
| `tools/memory-audit/run-skia-worklet-memory-audit.cjs` 가드 보강 | `tables/` · 커밋 |

참고 마운트: `app/(game)/combat.tsx` → `StageShell` `backgroundOverlay` → `CombatOrbitTransitBackdrop`.

---

## 4. 자가검수 (구현과 같은 턴 · 필수)

1. 현재 코드 vs §1 분석 **AGREE/PARTIAL/DISAGREE** (파일:줄)
2. `npx tsc --noEmit -p tsconfig.client.json`
3. `npx tsx src/combat/transitCombatParallaxPlan.test.ts`
4. `npm run audit:skia-memory`
5. `[pss-pre-dev]` 3줄 · 틱 신규 Skia 할당 없음
6. 실기 불가하면 **실기 불가**라고 쓸 것. 추측으로 완료 금지
7. `kim-claude-handoff-pending.md` 상단을 **PENDING**으로 갱신 — 변경 파일 · 재검수 판정 · 잔여 리스크 · **commit 금지**

---

## 5. 호출 문장 (김클로드 세션)

```text
@김클로드 READY tools/kim-team-lead/reports/kim-claude-ready-transit-combat-skia-backdrop-20260916.md
이동중 전투 Skia 배경을 이어서 구현하고 같은 턴에 자가검수하라.
김팀장 패치는 받아쓰지 말 것. commit 금지. handoff PENDING.
```
