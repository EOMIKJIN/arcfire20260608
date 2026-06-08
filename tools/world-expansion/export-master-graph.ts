/**
 * 은하 연결 그래프 스냅샷(JSON). 서버 마스터 틱 제거 후에도 검증·외부 도구용으로 유지.
 * 실행(저장소 루트): npm run build:world-expansion-graph
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { GALAXY_SYSTEMS, GAMEPLAY_SYSTEM_IDS, LEGACY_VISIBLE_TOTAL_SYSTEMS } from '../../src/data/galaxy100';
import { ARC_CORE_LEGACY_GUARANTEED_SYSTEM_IDS } from '../../src/arcCore/worldExpansionGuaranteedUnlocks';

const guaranteed = [...ARC_CORE_LEGACY_GUARANTEED_SYSTEM_IDS];
const defaultUnlockedIds = Array.from(
  new Set<string>([...Array.from(GAMEPLAY_SYSTEM_IDS), ...guaranteed]),
).sort();

const connections: Record<string, string[]> = {};
for (const [id, sys] of Object.entries(GALAXY_SYSTEMS)) {
  connections[id] = [...sys.connections].sort();
}

const legacySynthCount = Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - GAMEPLAY_SYSTEM_IDS.size);

const payload = {
  schemaVersion: 1 as const,
  legacySynthCount,
  defaultUnlockedIds,
  connections,
};

const outDir = path.join(process.cwd(), 'tools', 'world-expansion');
const outPath = path.join(outDir, 'master-graph.json');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload), 'utf8');
console.log(`Wrote ${outPath} (${Object.keys(connections).length} nodes)`);
