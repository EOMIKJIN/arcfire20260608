---
handoff: arc-core-self-optimize
generated: 2026-04-19T05:33:23.908Z
---

# 에이전트 지시문 (템플릿)

# Cursor 에이전트용 — 아크코어 자기 최적화 (범위 고정)

당신은 **Arcfire Online** 저장소에서 작업한다. 첨부된 **`cursor-handoff.md`** 상단의 일일 점검 요약을 읽고, **아크코어 및 직접 연결된 런타임 경로만** 성능·메모리·구조 개선을 수행한다.

## 수정 허용 범위 (우선순위)

1. `src/arcCore/**` — 허브, 명령 버스, 서브코어, 프로세스, 레지스트리
2. `src/world/planetTradePortDb.ts` — 경제 서브코어가 위임하는 무역소 DB (아크코어 명령 축과 일치하게만)
3. `tools/daily-perf-audit/**`, `tools/arc-core-self-optimize/**` — 점검·핸드오프 도구 (필요 시)

## 수정 금지·보류

- `tables/content/**` CSV 데이터 정본 — 변경이 필요하면 **사용자에게 요청**만 하고 직접 수정하지 않는다.
- `app/(game)/**` UI 대규모 리라이트 — 이번 작업 범위 밖 (무역 화면은 경제 명령과 충돌 시 최소 수정만).
- 아크코어와 무관한 리팩터·스타일 통일 드라이브.

## 작업 원칙

- **테이블 단일 소스**, **아크코어 = 세계 근원 축** — `.cursor/rules/arcfire-online.mdc` 계약을 따른다.
- 일일 보고서의 `setInterval` / `subscribe` / `addEventListener` 목록이 있으면, **해당 파일에서 누수 가능성만** 최소 수정으로 정리한다.
- 변경 후 `npx tsc --noEmit` 통과를 목표로 한다.

## 산출

- 변경 요약을 짧게 한국어로 보고한다.
- 불확실하면 코드를 바꾸지 말고 **질문 목록**만 제시한다.

---

# 일일 점검 보고서 (자동 삽입)

# Daily audit — 2026-04-19T05:33:00.621Z

## TypeScript (`npx tsc --noEmit`)

```
(no output)
```

**exit:** 0

## Content tables (`npm run build:content-tables`)

```
> arcfire-online@0.1.0 build:content-tables
> node tools/content-tables/build-content-from-csv.mjs

Generated CSV-driven content TS files at src/data/generated
```

**exit:** 0

## Largest TS/TSX under `src/` + `app/` (bytes)

- 110,337 — `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- 101,456 — `app/(game)/planet.tsx`
- 42,945 — `src/data/generated/csvNpcCapitalShips.ts`
- 35,223 — `src/data/generated/csvItemDefs.ts`
- 32,572 — `src/data/generated/csvNpcCaptains.ts`
- 29,727 — `app/(game)/worldmap.tsx`
- 24,094 — `src/types/index.ts`
- 20,632 — `app/(game)/trade.tsx`
- 17,559 — `src/data/generated/csvSystems.ts`
- 16,884 — `src/store/clanWarFoundationStore.ts`
- 16,204 — `app/(game)/shipyard.tsx`
- 15,743 — `src/data/galaxy100.ts`
- 11,400 — `src/store/playerStore.ts`
- 9,977 — `app/(game)/combat.tsx`
- 9,951 — `app/(game)/skilltree.tsx`
- 9,835 — `app/(game)/intro.tsx`
- 8,755 — `src/npc/nearbyOrbitPresenceSystem.ts`
- 8,392 — `src/stages/planetMainStageLayout.ts`

## `setInterval(` occurrences (manual leak review)

- `src/combat/useCapitalRealtimeDuelOutcome.ts`
- `src/components/TypewriterText.tsx`
- `app/(game)/planet.tsx`

## `subscribe(` / `addEventListener(` hints (manual cleanup review)

**subscribe**
- `src/arcCore/ArcCoreHub.ts`

**addEventListener**
- `src/arcCore/ArcCoreHub.ts`
- `app/_layout.tsx`

## Optional dependency scan

_Skipped (slow / RN·Expo false positives). To include: `AUDIT_RUN_DEPCHECK=1 npm run audit:daily`_
