/**
 * 은하 그래프(760개 성계 좌표·연결) 정적 프리컴파일.
 * buildGalaxySystems100()은 고정 시드(mulberry32(20260415))만 쓰는 순수/결정적 함수라
 * 매 앱 부팅마다 런타임에서 다시 계산할 필요가 없다(O(n²)x200 좌표 완화 비용 제거).
 * 실행: npx tsx tools/galaxy-graph/generate-galaxy-systems.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildGalaxySystems100 } from '../../src/data/galaxy100';

const systems = buildGalaxySystems100();
const count = Object.keys(systems).length;

const out = `// AUTO-GENERATED — tools/galaxy-graph/generate-galaxy-systems.ts 로 재생성.
// 은하 그래프(성계 좌표·연결) 프리컴파일 — buildGalaxySystems100()은 순수·결정적 함수라
// 매 부팅마다 런타임 재계산이 불필요함(760개 O(n²)x200 좌표 완화 비용 제거).
// STAR_SYSTEMS(src/data/systems)나 생성 알고리즘이 바뀌면 위 명령으로 재생성할 것.
import type { StarSystem } from '../../types';

export const GALAXY_SYSTEMS_PRECOMPUTED: Record<string, StarSystem> = ${JSON.stringify(systems, null, 2)};
`;

const outPath = resolve(process.cwd(), 'src/data/generated/galaxySystems100.generated.ts');
writeFileSync(outPath, out, 'utf8');
console.log(`[generate-galaxy-systems] wrote ${count} systems -> ${outPath}`);
