const fs=require("fs");
const p="d:/arcfire20260607/tools/long-run-monitor/logs/mem-timeline.csv";
const lines=fs.readFileSync(p,"utf8").trim().split(/\r?\n/);
const hdr=lines[0].split(",");
const gi=n=>hdr.indexOf(n);
const rows=[];
for(let i=1;i<lines.length;i++){
  const c=lines[i].split(",");
  const ts=c[gi("iso_time")]||"";
  if(!/^\d{4}-\d{2}-\d{2}/.test(ts)) continue;
  rows.push({date:ts.slice(0,10),ts,pss:+c[gi("pss_mb")],gl:+c[gi("gl_mb")],nat:+c[gi("native_heap_mb")],views:+c[gi("views")]});
}
function st(a){a=a.filter(Number.isFinite);if(!a.length)return null;const s=[...a].sort((x,y)=>x-y);return{n:a.length,min:s[0],max:s[s.length-1],med:s[Math.floor(s.length/2)],p95:s[Math.min(s.length-1,Math.floor(s.length*0.95))],avg:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)};}
function ds(days){const sub=rows.filter(r=>days.includes(r.date));return{n:sub.length,pss:st(sub.map(r=>r.pss)),gl:st(sub.map(r=>r.gl)),nat:st(sub.map(r=>r.nat)),views:st(sub.map(r=>r.views))};}
const days=[...new Set(rows.map(r=>r.date))].sort();
const l7=days.slice(-7);
console.log(JSON.stringify({rows:rows.length,range:[days[0],days[days.length-1]],d26:ds(["2026-06-26"]),d27:ds(["2026-06-27"]),l7agg:ds(l7),daily:l7.map(d=>{const s=ds([d]);return{d,n:s.n,pss:s.pss,gl:s.gl,nat:s.nat,views:s.views};}),hubIdle280_420:["2026-06-25","2026-06-26","2026-06-27"].map(d=>{const sub=rows.filter(r=>r.date===d&&r.views>=280&&r.views<=420);return{d,n:sub.length,pss:st(sub.map(r=>r.pss)),nat:st(sub.map(r=>r.nat))};}),dupViews900:rows.filter(r=>r.views>=900).length,soak:ds(rows.filter(r=>r.ts>="2026-06-27 09:25"&&r.ts<="2026-06-27 12:30").map(r=>r.date))},null,2));
