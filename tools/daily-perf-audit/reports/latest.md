# Daily audit — 2026-09-26T15:00:18.623Z

## TypeScript (`npx tsc --noEmit -p tsconfig.client.json`)

```
(no output)
```

**exit:** 0

## Content tables (`npm run build:content-tables`)

```
> arcfire-online@0.1.1 build:content-tables
> node tools/gen-mineral-region-members.mjs && node tools/balance-tables/rebalance-weapon-ttk.mjs && node tools/content-tables/gen-weapon-trade-listing-policy.mjs && node tools/content-tables/sync-weapon-trade-listing.mjs && node tools/content-tables/patch-item-defs-en.mjs && node tools/content-tables/patch-missions-en.mjs && node tools/content-tables/patch-npc-ships-en.mjs && node tools/content-tables/patch-planets-en.mjs && node tools/content-tables/generate-arc-seed-transport-rows.mjs && node tools/content-tables/sync-synth-ownership-into-item-defs.mjs && node tools/content-tables/patch-item-defs-trade-en-full.mjs && node tools/content-tables/sync-star-system-connections-from-planets.mjs && node tools/content-tables/build-content-from-csv.mjs && node tools/content-tables/build-arc-core-chat-tables.mjs && node tools/content-tables/build-bar-patronage-tables.mjs && node tools/content-tables/build-bar-voice-clips.mjs && node tools/content-tables/audit-npc-fleet-master.mjs && node tools/content-tables/audit-mission-quest-placements.mjs

[gen-mineral-region-members] 102 rows
[rebalance-weapon-ttk] updated 0 weapons in weapon_list.csv
weapon_trade_listing_policy: shop=83 excluded_npc_clone=20
tradePortListed sync: canonical=83 TRUE=83 demoted=0
patched D:\arcfire20260607\tables\content\item_defs.csv (290 data rows)
patched missions.csv + mission_objectives.csv
patched 0 npc ship name_en rows
patched planets.csv
[generate-arc-seed-transport-rows] nothing to add — all systems present
[sync-synth-ownership] item_defs.csv — synth ownership up to date
patched rows=0 path=D:\arcfire20260607\tables\content\item_defs.csv
[sync-star-connections] wrote 64 directed edges -> D:\arcfire20260607\tables\content\star_system_connections.csv
Generated CSV-driven content TS files at src/data/generated
build-arc-core-chat-tables: wrote persona/operator-persona/speakers/topics/knowledge/purposes/modes/gm-beats/stella-life/stella-quest-notes
[bar-patronage] attendants=103 songs=5 drinks=3 planetDrinkPrices=54 planetRoster=99 turns=44 hellos=20 clips=2
[bar-voice] clips=2 -> D:\arcfire20260607\src\data\generated\csvBarVoiceClips.ts
[audit:npc-fleet] PASS
  [info] obj_s008_a: vega_base — CSV 무역소 없음 · 퀘스트 전용 무역 SUB-STAGE 허용
  [info] obj_s020_a: titan_ruins — CSV 무역소 없음 · 퀘스트 전용 무역 SUB-STAGE 허용
  [info] obj_tq_anom_01_t: tq_anom 위협 — combat_ops 미강제 (STAGE 3 HOLD · 바 tq 비침범)
=== audit:mission-quest-placements ===
buy_goods objectives: 27
defeat_enemy objectives: 33
placements: 18 · combat_ops: 32
tq_* bar templates: 22 · tq_anom world-event: 1 · bar planets: 18

PASS — buy_goods/defeat_enemy 배치·tq_* materialize·tq_anom 월드이벤트·보상 item 정적 검증 OK
```

**exit:** 0

## Largest TS/TSX under `src/` + `app/` (bytes)

- 660,019 — `src/data/generated/galaxySystems100.generated.ts`
- 482,349 — `src/data/generated/csvNpcCapitalShips.ts`
- 458,963 — `src/data/generated/csvNpcCaptains.ts`
- 383,335 — `src/data/generated/csvItemDefs.ts`
- 246,369 — `src/data/generated/csvStoryScenes.ts`
- 200,040 — `src/data/generated/csvNpcCapitalShipEquipSlots.ts`
- 170,253 — `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- 117,343 — `src/i18n/locales/ko.ts`
- 113,834 — `src/data/generated/csvMainStorySpine.ts`
- 106,929 — `src/i18n/locales/en.ts`
- 104,642 — `app/(game)/worldmap.tsx`
- 93,874 — `app/(game)/planet.tsx`
- 91,882 — `src/data/generated/csvMissions.ts`
- 85,737 — `src/data/generated/csvBarPatronage.ts`
- 71,316 — `src/data/balance/generated/csvSynthSystemColonization.ts`
- 71,070 — `src/data/generated/csvWeapons.ts`
- 65,404 — `src/data/balance/generated/csvCapitalShipMaxUpgradeValue.ts`
- 55,365 — `src/data/generated/planetGlobeLookColonized.ts`

## Planet hub eager `src/combat` import (should be absent)

- OK — no eager combat barrel in `planet.tsx`

- `src/combat/useCapitalRealtimeDuelOutcome.ts`
- `src/components/bar/BarPatronagePerformView.tsx`
- `src/components/combat/TransitCombatSkiaParallaxBackdrop.tsx`
- `src/components/IdleSessionRestartGuard.tsx`
- `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- `src/components/planet/PlanetMainScanActionRow.tsx`
- `src/components/planet/SkiaPlanetNebulaShaderBackdrop.tsx`
- `src/components/shipyard/ShipyardMineralUpgradeTab.tsx`
- `src/game/planetHub/usePlanetHubInterval.ts`
- `src/missions/useMissionTimeLimitNow.ts`
- `src/systems/mining/useMiningDriver.ts`
- `src/ui/overlay/content/ArcCoreChatOverlayContent.tsx`
- `src/ui/overlay/content/PlanetDefenseSatelliteDevContent.tsx`
- `src/ui/overlay/content/PlanetDevelopmentListContent.tsx`
- `src/ui/overlay/content/PlanetGenericFacilityDevContent.tsx`
- `src/ui/overlay/content/PlanetOrbitShipyardDevContent.tsx`
- `app/(game)/planet.tsx`
- `app/(game)/worldmap.tsx`

## `subscribe(` / `addEventListener(` hints (manual cleanup review)

**subscribe**
- `src/arcCore/ArcCoreHub.ts`
- `app/(game)/planet.tsx`

**addEventListener**
- `src/arcCore/ArcCoreHub.ts`
- `src/components/IdleSessionRestartGuard.tsx`
- `src/galaxyMap/GalaxyMapColonizeHubPulseOverlay.tsx`
- `src/galaxyMap/GalaxyMapContestedZoneRingOverlay.tsx`
- `src/game/nativeReclaim/nativeReclaimBootstrap.ts`
- `src/missions/unidentifiedAnomaly/unidentifiedAnomalyTestRotationWatch.ts`
- `src/ui/overlay/ArcCoreAgentSurfaceHost.tsx`
- `app/(game)/planet.tsx`
- `app/(game)/worldmap.tsx`
- `app/_layout.tsx`

## Optional dependency scan

_Skipped (slow / RN·Expo false positives). To include: `AUDIT_RUN_DEPCHECK=1 npm run audit:daily`_
