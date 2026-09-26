import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const rows = JSON.parse(fs.readFileSync(path.join(dir, '_portrait-remaining.json'), 'utf8'));
const BATCH = 50;
for (let i = 0, n = 0; i < rows.length; i += BATCH, n += 1) {
  const slice = rows.slice(i, i + BATCH);
  const file = path.join(dir, `_portrait-batch-${n}.json`);
  fs.writeFileSync(file, JSON.stringify(slice, null, 2));
  console.log(`batch ${n} count=${slice.length} ${slice[0].id} .. ${slice[slice.length - 1].id}`);
}
