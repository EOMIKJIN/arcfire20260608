# 이동중 전투 Skia 배경 — 현재 정본 (2026-09-16)

```text
status=REVIEWED
verdict=PARTIAL
task_id=transit-combat-skia-backdrop-fix-20260916
updated=2026-09-16 20:40 KST
vega_temp_force=OFF
commit=FORBIDDEN until 대표님 지시
[pss-pre-dev] hot_path=flush 120ms Picture+setState · interval deps=active only
[pss-pre-dev] stage=combat overlay dispose 기존 유지 · layoutRef 캐시 risk=P1
[pss-pre-dev] verdict=PASS
```

김클로드 풀캔버스 구름 + safe-area flush 제거는 **수용**. 이후 대표님 지시로 시각만 조정했다. **베가 TEMP 강제 조우는 해제.**

---

## 현재 계약

| 항목 | 값 |
|---|---|
| Canvas | `absoluteFill` · 컨테이너 인셋 금지 · `clipRect`/틱 `width()` 금지 |
| 고정 성운 | 베이크 PNG src **768** · dest **cover(max 변)** · 72/54 보이는 프레임 중앙 |
| 구름 | space_cd 정사각 · 짧은 변 × **1.25** · 2장 · 같은 대각 · 속도 **1.15 / 1.7** · 랩 **0.92** |
| 위아래 | 구름 다음 `#05070e` 덮개 72 / 54 |
| 헤더 | `TF.panelBg` 불투명 |
| 조우 | 기존 확률 + `isPlayerShipCombatCapable`만. `transitCombatForceQa` **삭제** |

금지 유지: PictureRecorder dispose · 틱 `SkImage.width()` · `clipRect` · 궤도 `orbitSize` 변경 · 허브 성운 개조.

---

## 프레임 끊김 전수 (2026-09-16 안정화)

| 원인 | 판정 | 조치 |
|---|---|---|
| `flushPicture` deps에 `gfxSize`·dodge 오프셋 | 궤도 measure마다 `clearInterval`+재시작 → 첫 수 초 끊김 | flush를 **ref**로 고정. 인터벌 deps=`active`만 |
| 80ms `finishRecordingAsPicture`+`setPicture` | 전투 rAF(16ms)와 겹쳐 React 커밋 톱니 | **120ms** |
| `useWorldStore`가 system 객체 전체 구독 | 월드 패치마다 Backdrop 리렌더 | planetId/zone **원시값**만 |
| 매 틱 `resolveTransit*Size/Bands` | 동일 레이아웃 재계산 | `layoutRef` — onLayout에서만 |
| ColorDodge / 구름을 worklet 루프로 | clipRect·`width()` SIGSEGV 이력 | **금지** — Picture 경로 유지 |
| Picture 수동 dispose로 GC | Finalizer SIGSEGV | 계속 금지. 잔여: 틱당 Picture 1장 GC 위임 |
| `flameImage.width()` | 허브/궤도 burst 경로. 이동전투 틱 아님 | 이번 축 **미패치** |

잔여(수용): 120ms마다 SkPicture 1장+`setState`는 계약상 불가피. worklet 재작성은 크래시 회귀. 675 PNG src 768은 기록만.

---

## 해제 (2026-09-16)

- `src/game/transitCombat/transitCombatForceQa.ts` 삭제
- `worldmap` 강제 조우 / DEV `[QA] transit-encounter` 로그 제거
- `combat` 생존포드 게이트 우회 제거
- 조우는 이동 확률·전투가능 함선만
