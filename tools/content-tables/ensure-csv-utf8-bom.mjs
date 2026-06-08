import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const TABLE_DIR = resolve(ROOT, 'tables', 'content');
const UTF8_BOM = '\uFEFF';

function main() {
  const files = readdirSync(TABLE_DIR).filter(name => name.toLowerCase().endsWith('.csv'));
  let changed = 0;
  for (const name of files) {
    const p = resolve(TABLE_DIR, name);
    const text = readFileSync(p, 'utf8');
    if (text.startsWith(UTF8_BOM)) continue;
    writeFileSync(p, UTF8_BOM + text, 'utf8');
    changed += 1;
  }
  console.log(`Ensured UTF-8 BOM for CSV files. updated=${changed}, total=${files.length}`);
}

main();
