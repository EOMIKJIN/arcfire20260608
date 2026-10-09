# React DevTools 훅 토글 ABA 실험 — 누수 인과 확정용(dev 진단 전용) · 김플레이 2026-10-09
# 구간마다 2분 간격으로 GC 직후 alloc 을 찍는다. 끝나면 훅을 원복한다.
param([int]$SegmentMin = 10, [string]$Out = "D:\arcfire20260607\tools\play-bot-console\logs\soak\retention-probe-20261009\rdt-abab.jsonl")
$soak = $PSScriptRoot
$mute = "(function(){var h=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!globalThis.__arcRdtOrig){globalThis.__arcRdtOrig={c:h.onCommitFiberRoot,u:h.onCommitFiberUnmount,p:h.onPostCommitFiberRoot,s:h.onScheduleFiberRoot};}h.onCommitFiberRoot=function(){};h.onCommitFiberUnmount=function(){};h.onPostCommitFiberRoot=function(){};h.onScheduleFiberRoot=function(){};return 'muted';})()"
$restore = "(function(){var h=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;var o=globalThis.__arcRdtOrig;if(!o)return 'no orig';h.onCommitFiberRoot=o.c;h.onCommitFiberUnmount=o.u;h.onPostCommitFiberRoot=o.p;h.onScheduleFiberRoot=o.s;globalThis.__arcRdtOrig=null;return 'restored';})()"
$plan = @(@('A-muted', $mute), @('B-normal', $restore), @('A2-muted', $mute))
try {
  foreach ($seg in $plan) {
    node "$soak\hermes-eval.cjs" $seg[1] | Out-Null
    for ($i = 0; $i -le $SegmentMin; $i += 2) {
      if ($i -gt 0) { Start-Sleep 120 }
      node "$soak\hermes-gc-probe.cjs" "$($seg[0]) +${i}min" | Out-File -Append -Encoding utf8 $Out
    }
  }
}
finally {
  node "$soak\hermes-eval.cjs" $restore | Out-Null
}
