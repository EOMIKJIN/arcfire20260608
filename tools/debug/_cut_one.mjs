import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { removeBackground } from './_bgtemp/node_modules/@imgly/background-removal-node/dist/index.mjs';

const modelDist = path.resolve('tools/debug/_bgtemp/node_modules/@imgly/background-removal-node/dist');
const src = path.resolve('tools/debug/_preview_arcadia_stack.png');
const blob = await removeBackground(pathToFileURL(src).href, {
  publicPath: `file://${modelDist}/`,
  model: 'medium',
  output: { format: 'image/png', type: 'foreground' },
});
fs.writeFileSync('tools/debug/_preview_arcadia_stack_cut.png', Buffer.from(await blob.arrayBuffer()));
console.log('cut ok');
