const fs = require('fs');
const path = require('path');
function pngSize(file) {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(24);
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  if (buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), bytes: fs.statSync(file).size };
}
function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith('.png')) out.push(p);
  }
}
const roots = ['assets/images/planet', 'assets/images/nebula'];
for (const root of roots) {
  if (!fs.existsSync(root)) { console.log('missing', root); continue; }
  const files = [];
  walk(root, files);
  files.sort();
  for (const f of files) {
    const s = pngSize(f);
    const mb = s ? ((s.w * s.h * 4) / (1024 * 1024)).toFixed(1) : '?';
    console.log(`${mb}MB px ${s ? s.w + 'x' + s.h : '?'} file ${(s.bytes/1024).toFixed(0)}KB ${f}`);
  }
}
