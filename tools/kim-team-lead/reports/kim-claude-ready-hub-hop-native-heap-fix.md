# 김클로드 착수 — 허브 순회 native_heap 누적 (권장 A안)

> **배정**: 김팀장 (Cursor 본창) · 2026-07-08  
> **대표님 지시**: 은하계 지도↔행성 허브 반복 이동 시 PSS 급등·강제 재시동 — **권장 A안**으로 수정  
> **완료 후**: `kim-claude-handoff-pending.md` 상단에 PENDING handoff 추가 · **git commit 금지**

---

## [pss-pre-dev] (코딩 전 필수 3줄)

```text
[pss-pre-dev] hot_path=STAGE전환·행성착륙·성운배경 디코드 · alloc=행성당 1024²×4B Fresco 비트맵(~4MB) · cache=Fresco 기본 상한 무제한
[pss-pre-dev] stage=worldmap↔hub replace·planet_change reclaim · risk=P2(캐시)·P5(착륙 sync)
[pss-pre-dev] verdict=PASS — A안은 디코드 축소+trim 공백 메움, floor 하향 목적
```

---

## 1. 문제 요약 (전반 분석 완료)

### 실측 (대표님 플레이 + mem-timeline)

| 시점 | PSS | Native Heap | GL | Views | 비고 |
|------|-----|-------------|-----|-------|------|
| 밤새 idle | ~810MB | **386~412MB** | ~55MB | ~380 | floor 평탄 |
| 이동 중 (09:52) | ~920MB | **470MB** | ~123MB | ~377 | 계단 상승 시작 |
| 이동 중 (10:01) | **959.9MB** | **494MB** | 45MB | 404 | **GL_HARD_CEILING → 강제 재시동** |
| 재시동 후 | 553MB | 266MB | 8MB | 99 | 정상 |

**대표님 행동**: 은하계 지도에서 여러 행성 허브로 반복 이동 — **native_heap만** 계단식 상승, GL·Views는 정상 범위.

### 근본 원인 (확정)

1. **행성별 성운 배경 PNG 21장** (`planetNebulaBakedAssets.ts`) — 각 **1024×1024** → 디코드 시 **~4MB/장**
2. Android 8+ 비트맵 픽셀은 **native_heap 상주** (GL·Java heap 아님) → 실측 축과 일치
3. 행성을 바꿔가며 이동 → Fresco 비트맵 캐시에 **서로 다른 이미지가 계단 누적** → 기본 캐시 상한까지 plateau
4. **공백**: `runPlanetChangeNativeReclaimLight`(in-hub 연속 착륙)에 **Fresco trim 없음** — worldmap↔hub 왕복에는 trim 배선돼 있으나 planet_change만 빠짐
5. `PlanetNebulaImageBackdrop` `<Image>`에 **다운샘플 없음** — 1024 풀 디코드

### A안 범위 (이번 task)

| # | 조치 | 파일 | 재빌드 |
|---|------|------|--------|
| A1 | `<Image>` **resizeMethod="resize"** + 표시 크기(`size` prop)로 디코드 해상도 축소 | `PlanetNebulaImageBackdrop.tsx` | **불요** (Metro `r`) |
| A2 | **planet_change** 경로에 `trimNativeBitmapCachesAsync()` 추가 | `runPlanetChangeNativeReclaimLight.ts` | **불요** |

**이번 범위外** (별도 task): Fresco 캐시 상한 config · 베이크 512 리베이크 · Skia useImage 성운 단일화 · worldmap SVG 가상화

---

## 2. 구현 상세

### A1 — `PlanetNebulaImageBackdrop.tsx`

**현재** (L44-57): `resizeMode="cover"` 만 — Fresco가 소스 1024×1024 풀 디코드.

**목표**: 뷰포트 `size`(px)에 맞춰 디코드 — 장당 ~4MB → `(size/1024)²` 비율로 축소.

```tsx
// nebula + backdrop Image 공통
<Image
  source={...}
  style={[styles.layer, { width: size, height: size }]}
  resizeMode="cover"
  resizeMethod="resize"   // Android: 디코드 시 다운샘플
  accessibilityIgnoresInvertColors
/>
```

**주의**:
- `styles.layer`의 `width/height: '100%'`와 충돌하지 않게 — **명시 `width/height: size`** 우선
- `backgroundImageSource` 백드롭 Image에도 동일 적용
- iOS는 `resizeMethod` 무시(안전 no-op) — Android 실측 축이므로 OK
- 시각 회귀 없어야 함(cover + 동일 size 정사각)

### A2 — `runPlanetChangeNativeReclaimLight.ts`

**현재**: Skia reclaim + nebula profile prune + memo compact — **Fresco trim 없음**.

**목표**: worldmap↔hub ingress와 동일하게 이전 행성 배경 Fresco 캐시 trim.

**정본 패턴** (`runPlanetHubIngressReclaimPass.ts:35`):

```typescript
import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';

export function runPlanetChangeNativeReclaimLight(previousPlanetId: string): void {
  runCombatSkiaPresentationReclaim();
  prunePlanetNebulaProfilesForPlanets([previousPlanetId]);
  compactPlanetMemoRegistryShells();
  void trimNativeBitmapCachesAsync().then((result) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(
        `[MEM] runPlanetChangeNativeReclaimLight prev=${previousPlanetId} fresco=${result.frescoCleared ?? false}`,
      );
    }
  });
  // 기존 DEV log 유지 또는 위 then 블록에 통합
}
```

**주의**:
- `trimNativeBitmapCachesAsync`는 **현재 마운트된 Image가 참조 중인 비트맵은 유지**, 미사용 캐시만 비움 — 허브 UI 유지 중 planet_change와 호환
- 동기 `await` 금지 — `void ...then()` 패턴 유지(ingress 정본과 동일)

---

## 3. self-check (완료 시 체크)

- [ ] `npx tsc --noEmit -p tsconfig.client.json` — PASS
- [ ] `npm run audit:memory:all` — PASS (hot-path 0)
- [ ] diff 범위: **위 2파일만** (다른 reclaim/모니터 수정 금지)
- [ ] handoff `kim-claude-handoff-pending.md` 상단 PENDING 블록 추가
- [ ] git commit **금지**

---

## 4. 수용 기준 (김팀장 검수)

- [ ] A1: nebula·backdrop `<Image>` 둘 다 `resizeMethod="resize"` + explicit `size` px
- [ ] A2: planet_change 시 Fresco trim 호출 + DEV log
- [ ] **런타임**(대표님): 은하계 3+ 행성 허브 순회 후 native_heap floor가 idle 대비 **+40MB 이내** (기존 +100MB 대비 개선)

---

## 5. 대표님 → 김클로드 복사 지시

```text
@김클로드 tools/kim-team-lead/reports/kim-claude-ready-hub-hop-native-heap-fix.md 를 읽고 권장 A안(A1+A2) 구현해. 완료 후 kim-claude-handoff-pending.md status=PENDING. 커밋 금지.
```
