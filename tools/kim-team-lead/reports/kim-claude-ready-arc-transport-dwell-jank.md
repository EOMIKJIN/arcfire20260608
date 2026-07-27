# 김클로드 착수 — 아크코어 수송선단 행성 체류 중 튕김·부자연 회전

> **배정**: 김팀장 (Cursor 본창) · **2026-07-27** · 대표님 보고: 체류 중 **튕기며 회전이 자연스럽지 않음**  
> **지시 발령**: 2026-07-27 12:19 KST — 대표님 「김클로드에게 작업 지시」 → **즉시 착수**  
> **완료 후**: `kim-claude-handoff-pending.md` 상단 **PENDING** · **git commit 금지**  
> **task_id**: `arc-transport-dwell-jank-20260727`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=orbit_worklet_60fps·snapshot_0.25s · alloc=flat재팩시점만 · cache=arcPackSig
[pss-pre-dev] stage=planet_hub_orbit · risk=P1(이중적분)·P3(전함재팩동기화)
[pss-pre-dev] verdict=PASS — 틱당 신규할당금지·sync/적분 단일화만
```

---

## 0. 김팀장 원인 가설 (코드 추적 · 실기 미확인)

### 정본 경로

| 축 | 파일 |
|----|------|
| 시뮬 phase/dwell | `src/arcCore/subcores/AiNpcSubCore.ts` |
| worklet 위치 적분 | `src/components/planet/planetOrbitHubWorklets.ts` `computeArcNpcShipScreenPacked` |
| pack·syncMs | `PlanetHubOrbitSkiaLayer.tsx` (`arcPackSig` · `syncMsSv`) |

### 유력 원인 (우선순위)

| # | 메커니즘 | 체감 |
|---|----------|------|
| **A** | 체류 진입 시 `orbitRadiusPx = 106+rand*28` **즉시 교체** (`advanceShipPhase` dwelling) — entering 끝 반경과 불연속 | **튕김(반경 점프)** |
| **B** | worklet이 `orbitAng += dt*dwellRate` 적분 + JS `publishSnapshot`도 `orbitAngleRad += …` (주석은 worklet-only인데 코드는 이중) — **타 함선 phase 변경 시 전원 re-pack**·`syncMs` 리셋 | **각도 스냅/틱** |
| **C** | `ARC_ORBIT_Y_MUL=0.66` 타원 파라미터 등속 → 화면상 각속도 불균일 | **회전 부자연** |
| **D** | 마커에 heading `rotate` 없음(◇ translate만) — 「회전」이 궤도 각이면 A~C, 함선 nose면 별도 | 제품 확인 |

---

## 1. 범위 (M0~M4)

### ✅ 구현

| # | 내용 |
|---|------|
| **M0** | 적분 **단일화** — 체류 각도는 worklet(또는 JS) **한곳만**. `publishSnapshot`의 `orbitAngleRad +=` 제거 또는 pack 시에만 앵커 동기(주석 계약과 코드 일치) |
| **M1** | 체류 진입 반경 — entering 종료 반경에서 **연속**(lerp/유지). 랜덤 반경은 entering 시작·또는 매우 느린 보간만 |
| **M2** | re-pack 시 continuity — `syncMs` 리셋 + packed `orbitAngleRad`가 worklet 현재각과 **일치**하도록 앵커 공식 문서화·단위테스트 |
| **M3** | (선택) 타원 각속도 보정 또는 dwell rate 튜닝 — 기존 CSV 값 무단 변경 금지, 필요 시 대표님 재확인 |
| **M4** | 짧은 계약 주석 — AiNpcSubCore + PlanetHubOrbitSkiaLayer |

### ❌ 금지

- Skia 루프 `Make()`/`Paint()` · Path `.map()`
- planetId 하드코딩 · 틱당 zustand publish 증가
- `planets.csv`/밸런스 CSV 기존값 무단 변경
- git commit

---

## 2. 게이트

```bash
npx tsc --noEmit -p tsconfig.client.json
npm run audit:worklet-contract
npm run audit:skia-memory   # hub orbit 관련 시
```

실기: 허브에서 수송선 **체류 구간** 30초+ 관찰 — 반경 점프·각도 틱 여부.

---

## 3. handoff

status=`PENDING` · task_id=`arc-transport-dwell-jank-20260727` · 변경 파일 · A/B 중 택한 수정 · 실기 soft/확인
