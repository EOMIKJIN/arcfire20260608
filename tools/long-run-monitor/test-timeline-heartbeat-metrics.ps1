# Get-TimelineHeartbeatMetrics — stale fallback / last-valid-row (08:03 측정 실패 회귀)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'monitor-host-budget.ps1')

$tmp = Join-Path $env:TEMP ("arcfire-tl-hb-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$header = 'iso_time,pid,pss_mb,rss_mb,gl_mb,egl_mb,graphics_mb,native_heap_mb,java_heap_mb,threads,views,delta_pss_mb,delta_gl_mb,note'
$now = Get-Date
$freshIso = $now.AddMinutes(-8).ToString('yyyy-MM-dd HH:mm:ss')
$staleIso = $now.AddMinutes(-23).ToString('yyyy-MM-dd HH:mm:ss')
$oldIso = $now.AddMinutes(-120).ToString('yyyy-MM-dd HH:mm:ss')
$fail = 0

function Assert-True([bool]$cond, [string]$name) {
  if ($cond) { Write-Output "PASS $name" } else { Write-Output "FAIL $name"; $script:fail++ }
}

try {
  @(
    $header
    "$oldIso,111,700.0,800,20.0,1,2,3,4,,300,0,0,"
    "$staleIso,24620,825.5,890.4,34.2,40.7,74.8,451.7,39.3,,406,38.7,4.6,"
    "$($now.ToString('yyyy-MM-dd HH:mm:ss')),,,,,,PROCESS_NOT_RUNNING"
  ) | Set-Content -Path (Join-Path $tmp 'mem-timeline.csv') -Encoding utf8

  $skipBad = Get-TimelineHeartbeatMetrics -LogDir $tmp -MaxAgeMin 20 -StaleFallbackMaxAgeMin 90 -MatchPid '24620'
  Assert-True ($null -ne $skipBad) 'skip_invalid_last_row'
  Assert-True ($skipBad.pid -eq '24620') 'match_pid'
  Assert-True ($skipBad.stale -eq $true) 'stale_flag_23m'
  Assert-True ($skipBad.pssMb -eq '825.5') 'reuse_stale_pss'

  $tooOld = Get-TimelineHeartbeatMetrics -LogDir $tmp -MaxAgeMin 20 -StaleFallbackMaxAgeMin 10 -MatchPid '24620'
  Assert-True ($null -eq $tooOld) 'drop_beyond_stale_cap'

  @(
    $header
    "$freshIso,24620,807.2,,33.9,,,,,,399,,,DAILY_8AM_REPORT"
  ) | Set-Content -Path (Join-Path $tmp 'mem-timeline.csv') -Encoding utf8
  $fresh = Get-TimelineHeartbeatMetrics -LogDir $tmp -MaxAgeMin 35 -StaleFallbackMaxAgeMin 90 -MatchPid '24620'
  Assert-True ($null -ne $fresh -and $fresh.stale -eq $false) 'fresh_8am_row'
  Assert-True ($fresh.glMb -eq '33.9') 'fresh_gl'
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}

if ($fail -gt 0) { Write-Output "RESULT FAIL count=$fail"; exit 1 }
Write-Output 'RESULT PASS'
exit 0
