# idle 허브 soak — native/PSS floor drift 감사 (코드 누수 vs GC 톱니 분리)
param(
  [string]$LogDir = (Join-Path $PSScriptRoot 'logs'),
  [string]$SessionFile = (Join-Path $PSScriptRoot 'logs/playtest-session-active.json'),
  [double]$NativeFloorDriftWarnMb = 50,
  [double]$PssFloorDriftWarnMb = 80,
  [int]$MinSamples = 6,
  [int]$MaxViewsSpread = 80
)

$timelineCsv = Join-Path $LogDir 'mem-timeline.csv'
$reportOut = Join-Path $LogDir 'idle-hub-floor-audit-latest.md'
$alertLog = Join-Path $LogDir 'playtest-alerts.log'

if (-not (Test-Path $timelineCsv)) {
  Write-Host "idle-floor-audit SKIP no timeline"
  exit 0
}

$milestoneAt = $null
$milestoneLabel = $null
if (Test-Path $SessionFile) {
  try {
    $sess = Get-Content $SessionFile -Raw | ConvertFrom-Json
    $idle = @($sess.milestones | Where-Object { $_.label -match 'idle' }) | Select-Object -Last 1
    if ($idle) {
      $milestoneAt = [datetime]::ParseExact($idle.atKst, 'yyyy-MM-dd HH:mm:ss', $null)
      $milestoneLabel = $idle.label
    }
  } catch { }
}

$rows = Import-Csv $timelineCsv -ErrorAction SilentlyContinue
if (-not $rows -or $rows.Count -eq 0) { exit 0 }

$filtered = @()
foreach ($r in $rows) {
  if (-not $r.iso_time -or -not $r.pid) { continue }
  try {
    $t = [datetime]::Parse($r.iso_time)
  } catch { continue }
  if ($milestoneAt -and $t -lt $milestoneAt) { continue }
  $pss = 0.0; $nat = 0.0; $gl = 0.0; $views = 0
  [void][double]::TryParse([string]$r.pss_mb, [ref]$pss)
  [void][double]::TryParse([string]$r.native_heap_mb, [ref]$nat)
  [void][double]::TryParse([string]$r.gl_mb, [ref]$gl)
  [void][int]::TryParse([string]$r.views, [ref]$views)
  if ($pss -le 0) { continue }
  $filtered += [pscustomobject]@{
    Time = $t
    Pid = [string]$r.pid
    PssMb = $pss
    NativeMb = $nat
    GlMb = $gl
    Views = $views
    Note = [string]$r.note
  }
}

if ($filtered.Count -lt $MinSamples) {
  Write-Host "idle-floor-audit WAIT samples=$($filtered.Count) need=$MinSamples"
  exit 0
}

$targetPid = ($filtered | Group-Object Pid | Sort-Object Count -Descending | Select-Object -First 1).Name
$pidRows = @($filtered | Where-Object { $_.Pid -eq $targetPid } | Sort-Object Time)
$viewMin = ($pidRows | Where-Object { $_.Views -gt 0 } | Measure-Object -Property Views -Minimum).Minimum
$viewMax = ($pidRows | Where-Object { $_.Views -gt 0 } | Measure-Object -Property Views -Maximum).Maximum
$viewSpread = if ($viewMin -and $viewMax) { $viewMax - $viewMin } else { 0 }

# GC 톱니 제거: 10분 bin 최솟값(floor) 추세
$bins = @{}
foreach ($row in $pidRows) {
  $binKey = [math]::Floor(($row.Time - $pidRows[0].Time).TotalMinutes / 10)
  if (-not $bins.ContainsKey($binKey)) {
    $bins[$binKey] = @{ PssMin = $row.PssMb; NatMin = $row.NativeMb; GlMin = $row.GlMb; Count = 1 }
  } else {
    $b = $bins[$binKey]
    if ($row.PssMb -lt $b.PssMin) { $b.PssMin = $row.PssMb }
    if ($row.NativeMb -gt 0 -and ($b.NatMin -eq 0 -or $row.NativeMb -lt $b.NatMin)) { $b.NatMin = $row.NativeMb }
    if ($row.GlMb -gt 0 -and ($b.GlMin -eq 0 -or $row.GlMb -lt $b.GlMin)) { $b.GlMin = $row.GlMb }
    $b.Count++
  }
}

$sortedBins = $bins.Keys | Sort-Object
$firstBin = $bins[$sortedBins[0]]
$lastBin = $bins[$sortedBins[-1]]
$pssFloorDrift = $lastBin.PssMin - $firstBin.PssMin
$natFloorDrift = if ($firstBin.NatMin -gt 0 -and $lastBin.NatMin -gt 0) { $lastBin.NatMin - $firstBin.NatMin } else { 0 }

$idleHubLikely = $viewSpread -le $MaxViewsSpread
$nativeLeakSuspect = $idleHubLikely -and $natFloorDrift -ge $NativeFloorDriftWarnMb
$pssLeakSuspect = $idleHubLikely -and $pssFloorDrift -ge $PssFloorDriftWarnMb

if (-not $idleHubLikely) {
  $verdict = 'SKIP_NOT_IDLE_HUB'
} elseif ($nativeLeakSuspect -or $pssLeakSuspect) {
  $verdict = 'FAIL_IDLE_FLOOR_DRIFT'
} else {
  $verdict = 'PASS'
}

$md = @"
# Idle hub floor audit — $verdict

milestone: $milestoneLabel
since: $($milestoneAt)
pid: $targetPid
samples: $($pidRows.Count) bins: $($sortedBins.Count)
views spread: $viewSpread (max $MaxViewsSpread for idle hub)

| metric | first 10m bin floor | last 10m bin floor | drift |
|--------|---------------------|--------------------|-------|
| PSS MB | $($firstBin.PssMin) | $($lastBin.PssMin) | $pssFloorDrift |
| Native MB | $($firstBin.NatMin) | $($lastBin.NatMin) | $natFloorDrift |
| GL MB | $($firstBin.GlMin) | $($lastBin.GlMin) | — |

interpretation:
- PASS: GC sawtooth only (floor stable ± thresholds)
- SKIP_NOT_IDLE_HUB: views spread > $MaxViewsSpread — STAGE 전환·플레이 혼재 (idle 판정 불가)
- FAIL_IDLE_FLOOR_DRIFT: idle hub code path leak (not user action)

"@

Set-Content -Path $reportOut -Value $md -Encoding utf8
Write-Host $verdict "pssDrift=$pssFloorDrift nativeDrift=$natFloorDrift viewsSpread=$viewSpread"

if ($verdict -eq 'SKIP_NOT_IDLE_HUB') {
  exit 0
}

if ($verdict -eq 'FAIL_IDLE_FLOOR_DRIFT') {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [IDLE_FLOOR_DRIFT] pid=$targetPid pssDrift=${pssFloorDrift}MB nativeDrift=${natFloorDrift}MB viewsSpread=$viewSpread milestone=$milestoneLabel"
  Add-Content -Path $alertLog -Value $line -Encoding utf8
  try {
    & (Join-Path $PSScriptRoot 'invoke-incident-investigation.ps1') -Reason 'idle_hub_floor_drift' -AlertLine $line
  } catch { }
  exit 1
}

exit 0
