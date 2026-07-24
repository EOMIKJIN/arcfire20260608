# 김클로드 착수 — 미발견 성계 별빛 레이어 (권장 1안)

> **배정**: 김팀장 (Cursor 본창) · 2026-07-24  
> **대표님 지시**: 은하 암흑 미발견 성계를 별빛(도트)으로 표시 · **메모리 리스크 없이** · 미발견↔미발견 라인 숨김  
> **완료 후**: `kim-claude-handoff-pending.md` 상단에 **PENDING** 추가 · **git commit 금지** · 김팀장 검수

---

## [pss-pre-dev] (코딩 전 필수 3줄 — handoff에도 복사)

```text
[pss-pre-dev] hot_path=worldmap Svg 마운트·해금 목록 변경 시 1회 Path 재작성 · alloc=스타일별 Path d 문자열 소수 · cache=없음(시스템 좌표는 기존 systems)
[pss-pre-dev] stage=galaxy_map only · dispose=Svg 언마운트와 동일 · risk=P1(성계당 Circle 금지)·P2(Views)
[pss-pre-dev] verdict=PASS — 단일/소수 Path 배칭+해시 희소만 허용 · N개 Circle/라벨/edge REDESIGN
```

---

## 1. 배경 (이미 검토 완료 · 재조사 최소)

| 사실 | 위치 |
|------|------|
| 미발견 확장 synth는 `visibleSystemsList`에서 **제외** → 완전 암흑 | `app/(game)/worldmap.tsx` `hiddenUndiscoveredSystems` |
| 규모 | `galaxy100` TARGET≈760 · `미발견-*` 수백 |
| 기존 노드/라인 | `GalaxyMapSystemsSvg` — **여기에 넣지 말 것** |
| 권장안 | `hash(id)` 희소 + **배칭 Path** + 라인·라벨·터치 없음 |

---

## 2. 구현 범위 (이 task만)

### 신규 파일

`src/galaxyMap/GalaxyMapUndiscoveredStarlightSvg.tsx`

**Props (제안):**

```ts
systems: readonly StarSystem[];  // = hiddenUndiscoveredSystems
toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
```

**동작:**

1. **표시 여부** — `hash32(systemId) % 100 < SHOW_PCT` (권장 **SHOW_PCT = 32~40**) 만 Path에 포함.
2. **밝기** — 동일 해시로 opacity 구간 예: `0.06 ~ 0.45` (일부만 밝게, 대부분 거의 안 보임).
3. **미세 색** — cool white / 아주 약한 blue-cyan 2~3색만; 해시로 선택. 강한 채도·글로우 금지.
4. **도트** — SVG `<Path>` **스타일(색·opacity)별 1개**에 짧은 세그먼트 또는 `M x y l 0.01 0` 식으로 배칭 (`GalaxyMapSystemsSvg`의 `batchGalaxyMapConnectionPaths` 패턴 참고).  
   - **금지**: 성계마다 `<Circle>` / `<G>` / `<Text>`.
5. **라인·라벨·선택링** — 일절 없음.
6. **랜덤** — `Math.random` / 매 렌더 재해시 **금지**. `systemId` 결정적 해시만.
7. `memo` + `useMemo`로 `systems` id 목록·`toScreen` 의존 시에만 `d` 재생성.

**해시 유틸** — 파일 내부 작은 `hashStringToU32`면 충분 (신규 공유 모듈 남발 금지).

### worldmap 배선

`app/(game)/worldmap.tsx` — 기존 `<Svg>` 안:

```tsx
{/* Voronoi 위 · GalaxyMapSystemsSvg 아래 권장 (별빛이 노드에 가리지 않게) */}
<GalaxyMapUndiscoveredStarlightSvg
  systems={hiddenUndiscoveredSystems}
  toScreen={toScreen}
/>
<GalaxyMapSystemsSvg ... />
```

- 부모 `Svg`에 이미 `pointerEvents="none"` — 유지.
- `hiddenUndiscoveredSystems`는 **이미 있음** — 그대로 전달. visible 목록에 미발견을 합치지 **말 것**.
- deferred tile / direction prewarm 로직 **변경 금지** (별빛은 전체 hidden 목록 기준 1회 Path면 됨).

### 범위外 (하지 말 것)

- Skia 신규 Canvas / Worklet
- `visibleSystemsList`에 미발견 편입
- 미발견↔미발견 connection 그리기
- 터치·패널·이름·i18n
- `GALAXY_ROUTE` / 메가팩션 수도
- Fresco·이미지 아틀라스 별밭

---

## 3. Self-check (필수)

```bash
npx tsc --noEmit -p tsconfig.client.json
npm run audit:memory:all
```

- [ ] tsc PASS  
- [ ] audit:memory:all PASS  
- [ ] git commit **안 함**  
- [ ] handoff PENDING + `[pss-pre-dev]` 3줄 + 변경 파일 목록  

---

## 4. handoff PENDING 템플릿 (완료 시 상단 삽입)

```markdown
## ⏳ PENDING — 미발견 성계 별빛 레이어

| 필드 | 값 |
|------|-----|
| **status** | **`PENDING`** |
| **updated** | 2026-07-24 (김클로드) |
| **task_id** | `galaxy-undiscovered-starlight-20260724` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-undiscovered-starlight.md` |

### 변경 파일
- `src/galaxyMap/GalaxyMapUndiscoveredStarlightSvg.tsx` (신규)
- `app/(game)/worldmap.tsx` (import + Svg 자식 1줄)

### self-check
- [ ] tsc
- [ ] audit:memory:all
- [ ] commit 안 함

### 리스크
- Path `d` 길이·스타일 버킷 수(색×opacity)가 과다하면 버킷 상한(예: opacity를 4단으로 양자화) 적용했는지 명시
```

---

## 5. 김클로드 호출 문장 (대표님·✱ 패널)

```text
@김클로드 tools/kim-team-lead/reports/kim-claude-ready-undiscovered-starlight.md 읽고
미발견 별빛 레이어 권장 1안 구현한 뒤 kim-claude-handoff-pending.md 를 PENDING 으로 올려.
git commit 금지. tsc·audit:memory:all 필수.
```
