import fs from 'node:fs';
import path from 'node:path';

const src = path.join(process.env.USERPROFILE || '', '.cursor/projects/d-arcfire20260607/assets');
const dest = path.resolve('assets/images/npc');
const srcIds = fs.existsSync(src)
  ? fs.readdirSync(src).filter((f) => /^(npc_cpt_|Player_pilot).*\.png$/i.test(f))
  : [];
const destIds = fs
  .readdirSync(dest)
  .filter((f) => /^(npc_cpt_|Player_pilot).*\.png$/i.test(f));
console.log(`cursor_assets=${srcIds.length} dest_unique=${destIds.length}`);
