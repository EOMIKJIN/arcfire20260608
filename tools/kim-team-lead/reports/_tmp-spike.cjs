const fs = require('fs');
const path = require('path');
const p = 'tools/long-run-monitor/logs/crash-20261008-230636.log';
const text = fs.readFileSync(p, 'utf8');
const lines = text.split(/\r?\n/);
const keep = [];
for (const line of lines) {
  if (!/10-08 23:(2[2-9]|3[0-9]|4[0-9]|5[0-9])|10-09 00:0/.test(line) && !/10-08 23:(2[2-9]|3\d|4\d|5\d)/.test(line)) continue;
  if (/ReactNativeJS|MEM|galaxy_map|planet_hub|inbound|drone|SIGSEGV|Fatal signal|Force stopping|Start proc/.test(line)) {
    keep.push(line);
  }
}
console.log('kept', keep.length, 'of', lines.length);
const interesting = keep.filter((l) =>
  /\[MEM\]|galaxy_map|planet_hub|disposed|mount|inbound|Force stopping|Start proc|Fatal|native heap purge|reclaim/.test(l),
);
console.log('---interesting', interesting.length);
console.log(interesting.slice(0, 200).join('\n'));
console.log('---TAIL---');
console.log(interesting.slice(-80).join('\n'));
