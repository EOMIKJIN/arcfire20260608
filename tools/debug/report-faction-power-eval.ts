/**
 * 팩션 전력 평가 리포트 — 테이블 시드(점유·함대·항로·함장) 기준
 * 라이브 금고/런타임 PGP는 앱 일일 배치 경로에서만 합류
 * npx tsx tools/debug/report-faction-power-eval.ts
 */
import { compareFactionPowerToTerritorialOutcomes } from '../../src/arcCore/learning/compareFactionPowerToTerritorialOutcomes';
import { evaluateFactionPowerSnapshot } from '../../src/arcCore/learning/evaluateFactionPowerSnapshot';
import { formatFactionPowerEvalReport } from '../../src/arcCore/learning/formatFactionPowerEvalReport';
import { gatherFactionPowerTableInputs } from '../../src/arcCore/learning/gatherFactionPowerTableInputs';

const input = gatherFactionPowerTableInputs({ source: 'table_seed' });
const snapshot = evaluateFactionPowerSnapshot(input);
const compare = compareFactionPowerToTerritorialOutcomes(snapshot, []);
console.log(formatFactionPowerEvalReport({ snapshot, compare }));
console.log('');
console.log('참고: 최근 분쟁 관측·금고·런타임 PGP는 일일 배치(runFactionPowerEvalDailyPass)에서 합류합니다.');
