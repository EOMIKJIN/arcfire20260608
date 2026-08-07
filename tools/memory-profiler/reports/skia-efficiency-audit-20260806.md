# Skia 코드 효율화 전수검사 (2026-08-06)

Generated: 2026-08-06 KST · 김팀장 정적 전수 · `audit:skia-memory` 20/20 · `audit:worklet-contract` PASS

## Verdict

| 항목 | 판정 |
|------|------|
| 헌법(Zero-Allocation / 단일 Canvas·Picture) 준수 | **양호** |
| 공식 정적 audit | **20/20 PASS** |
| 효율화 완성도 (런타임 여유 포함) | **약 85%** — 핵심 경로는 잘 짜여 있음 · P1 여지만 소량 |
| 근본 GL sticky (dodge) | 2026-08-05 패치로 완화 · 본 감사 범위 외 재확인 |

**한 줄:** Skia 적용 코드는 헌법·rerwind/Picture 배칭·Paint 싱글톤 기준으로 **효율적으로 잘 짜여 있다.** 남은 것은 허브 상시 틱·듀얼스택 비용 축소(안정 우선).

---

## Inventory (실제 `@shopify/react-native-skia` import)

| 파일 | 역할 | Canvas |
|------|------|--------|
| `PlanetEdenRaidOrbitSkiaCombat.tsx` | STAGE 3 / 허브 전투 궤도 정본 | 1 · 단일 `<Picture>` |
| `PlanetHubInboundDroneSkiaTrailLayer.tsx` | 인바운드 드론 trail + hit FX | 1 · Picture |
| `SkiaPlanetNebulaShaderBackdrop.tsx` | 성운·colorDodge 오버레이 | 1 · Image+Picture |
| `planetSkiaHitFxContract.ts` | dodge/flame Paint·draw 공용 | 없음 |
| `planetNebulaMissileHitFxDraw.ts` | 전투→성운 dodge draw | 없음 |
| `inboundDroneHitFxDraw.ts` / `inboundDroneSkiaTrail.ts` | 드론 FX/trail path | 없음 |
| `planetOrbitHubWorklets.ts` | 궤도 pack worklet (Skia 타입 최소) | 없음 |
| `src/game/skia/skiaMemoryLifecycle.ts` | Path 풀·Picture commit/drop | 없음 |

**이름만 Skia:** `PlanetHubOrbitSkiaLayer.tsx` — **RN Animated + Text ◇** (Skia Canvas 없음). 수송선은 GL 부담을 의도적으로 회피.

`app/` 게임 화면: Skia import **없음** (worldmap Canvas 주석은 Android View).

---

## PASS 패턴 (코드 근거)

1. **전투** — PictureRecorder 모듈 싱글톤 · Path 풀 `rewind` · `<Path>.map` 없음 · rAF coalesce flush · unmount 루프 정지  
2. **드론 trail** — Path 풀 · Paint/Recorder **지연 생성** · 드론·FX 0이면 recorder 미생성·Picture drop  
3. **성운 dodge** — FX를 Picture 1장 배칭 · `useImage` 수동 dispose 금지  
4. **공용** — `skiaMemoryLifecycle` · combat presentation reclaim 등록 · GPU layer register/unregister  
5. **useImage** — combat/nebula/inbound 모두 훅 수명 위임 (FinalizerDaemon SIGSEGV 가드)

---

## Hub 동시 Canvas 맵 (idle / 활성)

| 상태 | 동시 Skia Canvas | 비고 |
|------|------------------|------|
| 허브 idle (드론·dodge 없음) | **0** | 궤도 마크는 RN |
| 인바운드 trail만 | **1** | trail layer |
| dodge latch/sticky | **1~2** | trail + nebula dodge overlay |
| 전투 orbit (`showEdenRaidTest`) | **1~2** | combat + (옵션) Skia 성운 풀스크린 |

듀얼스택(RN 성운 + Skia dodge)은 텍스처 축출 회귀 방지용 **의도적** 설계. sticky 해제 디바운스(2026-08-05)로 EGL 2× 고정 완화.

---

## RISK / 여지 (P0 없음)

### P1 — 효율 여지 (동작 정상 · 압력 완화 후보)

| ID | 위치 | 내용 | 안정 수정 방향 |
|----|------|------|----------------|
| P1-1 | `SkiaPlanetNebulaShaderBackdrop` `setInterval` 50ms | `fxLoopActive` 동안 FX 없어도 틱이 돔(early return). 빈 구간 rAF/이벤트화가 더 쌈 | hitFx non-empty일 때만 interval 또는 inbound와 동일 rAF coalesce |
| P1-2 | nebula `useImage`×3 | sticky 마운트 중 텍스처 상주 — 언마운트 디바운스로 완화됨 · Canvas off여도 훅은 유지 | 현 디바운스 유지 · 추가 remount 금지 |
| P1-3 | Picture 매 프레임 `finishRecording` | 활성 FX 중 새 SkPicture 참조 교체(수동 dispose 금지 계약) | 현 계약 유지 · 활성 시간 최소화(이미 idle skip) |

### P2 — 정리

| ID | 내용 |
|----|------|
| P2-1 | `PlanetHubOrbitSkiaLayer` 명칭 vs 실제 RN — 문서/이름 정리(동작 변경 없음) |
| P2-2 | 전투 HUD `setInterval` 120ms (`PlanetEdenRaidTestLayer`) — Skia 아님 · Hermes 압력(별도 축) |

---

## FAIL

**헌법 위반(루프 내 Make/Paint · Path.map · useImage 수동 dispose) — 정적 전수에서 미발견.**

---

## Recommended next (안정 우선)

1. **유지** — 전투/드론 Picture·Path 풀 계약 · remount 상시 ON 금지  
2. **선택** — P1-1 nebula dodge 틱을 “FX 있을 때만”으로 (게임성 무영향 · 계측 후)  
3. **비권장** — Skia 전면 재작성 · hub 궤도 마크를 다시 Skia로 전환

---

## 교차

- `tools/memory-audit/reports/skia-worklet-latest.md` — 20/20  
- `tools/worklet-contract-audit/reports/latest.md` — PASS  
- dodge sticky 패치 — `HUB_DODGE_OVERLAY_UNMOUNT_DEBOUNCE_MS` + logcat 확인(2026-08-05)
