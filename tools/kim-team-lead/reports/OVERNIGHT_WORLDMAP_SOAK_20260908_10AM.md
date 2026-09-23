# Overnight worldmap soak — 10:00 KST 보고 (2026-09-08)

```text
status=REPORTED
task_id=overnight-worldmap-soak-20260908
reported_kst=2026-09-08 10:01
verdict=WARN
pid=18017 (00:12 기준선 이후 동일 · 재기동 없음)
```

## 판정: **WARN**

- 밤새 **크래시·PROCESS_DEATH·추가 REFIX 없음** · pid **18017 안정** · 모니터 스택 OK · 08:00 데일리 **OK**
- 그러나 **Views ~608~609** 가 장시간 고정(목표 ≤380) · GL이 새벽 **~109MB floor** 유지 후 오전 **재스파이크**
- retention audit 최신 스냅샷 **FAIL**(과거 close 샘플 위주 · overnight soak 전용 판정은 아님)

## 기준선(00:11) vs 지금(10:01 dumpsys)

| 지표 | 00:11 | 10:01 | Δ |
|------|-------|-------|---|
| TOTAL PSS | ~776 MB | **~774 MB** (792639 KB) | ≈0 (안정) |
| Native Heap | ~379 MB | **~255 MB** (261016 KB) | **↓개선**(주간 GC/재클레임) |
| GL mtrack | ~111 MB | **~126 MB** (129508 KB) | ↑소폭 |
| Views | 608 | **609** | **미회수 고착** |
| ViewRootImpl | 1 | 1 | OK |

## 밤새 구간 요약 (mem-timeline · pid 18017)

| 구간 | PSS | GL | Views | 해석 |
|------|-----|-----|-------|------|
| 00:06~07:52 | **758~778** floor | **109~113** | **608** | 누수성 계단↑ 없음 · **고 Views/GL floor 고착** |
| 08:07 | 667 | 109 | 608 | native↓ 급락(재클레임/압력) · Views 유지 |
| 08:38~09:39 | **658~687** | **33~38** | **361~388** | GL·Views **일시 정상대** 회복 |
| 09:55 | **778** | **125** | **609** | `GL_SPIKE` suspect=hub_idle_skia… · 다시 고 footprint |

→ 순수 “시간만 흐르면 floor가 계속 올라가는” 패턴은 **아님**.  
→ **Views 608급 잔류 + GL 고착/재점화**가 운영 WARN의 본체.

## 운영

| 항목 | 상태 |
|------|------|
| watch-30m / report-watch / watchdog | 가동 |
| 08:00 overnight-final | **verdict=OK** |
| 신선 FATAL/SIGSEGV (이 soak 구간) | 관측 없음(추가 REFIX 없음) |
| handoff_pending / chat_pending | True (별도 triage 잔여 가능) |

## 권장 (1안)

월드맵 idle에서 **Views≥450·GL≥80** 이 재현되면 `galaxy_map` STAGE dispose/reclaim · 허브 Skia 잔류 여부를 김팀장 P1로 코드 점검.  
당장 강제 재시작은 불필요(pid 안정·PSS floor 비상승).

## 후속 개선 (2026-09-08 적용)

```text
[pss-pre-dev] hot_path=worldmap Svg mount/reconcile · alloc=batched Path · cache=useMemo
[pss-pre-dev] stage=galaxy_map idle · risk=P2 Views SVG · verdict=PASS
[mem-profile-fix] galaxy_map Views: SvgText LOD(current/selected/reachable) + Voronoi color-batch Path + contested rings unmount when AppState≠active
```

파일: `GalaxyMapSystemsSvg.tsx` · `GalaxyMapTerritoryVoronoiSvg.tsx` · `GalaxyMapContestedZoneRingOverlay.tsx`  
검증: Metro `r` 후 월드맵 idle dumpsys — Views·GL 하락 실측.