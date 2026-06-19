# Post-snapshot: incident detect + GL baseline stair-step (active hub only)
param(
  [string]$LogDir = (Join-Path $PSScriptRoot 'logs'),
  [string]$TimelineCsv = '',
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 30
)

. (Join-Path $PSScriptRoot 'mem-gl-leak-rules.ps1')

if (-not $TimelineCsv) {
  $TimelineCsv = Join-Path $LogDir 'mem-timeline.csv'
}

$incidentLog = Join-Path $LogDir 'incidents.log'
$remediationLog = Join-Path $LogDir 'remediation.log'
$baselineJson = Join-Path $LogDir 'mem-baseline.json'
$refixFlag = Join-Path $LogDir 'gl-leak-refix-requested.flag'
$crashGlob = Join-Path $LogDir 'crash-*.log'
$refixQueue = @()

function Get-LastRemediationAgeMin {
  $throttleFile = Join-Path $LogDir 'last-auto-remediation.txt'
  if (-not (Test-Path $throttleFile)) { return 9999 }
  try {
    $ts = [datetime]::Parse((Get-Content $throttleFile -Raw).Trim())
    return ((Get-Date) - $ts).TotalMinutes
  } catch {
    return 9999
  }
}

function Write-Remediation([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $remediationLog -Value $line
  Write-Host $line
}

function Enqueue-Refix([string]$reason, [hashtable]$ctx) {
  $script:refixQueue += @{ reason = $reason; ctx = $ctx }
}

function Invoke-BestRefix {
  if ($refixQueue.Count -lt 1) { return }
  $best = $refixQueue | Sort-Object { Get-RefixReasonPriority $_.reason } -Descending | Select-Object -First 1
  if ($refixQueue.Count -gt 1) {
    $skipped = ($refixQueue | Where-Object { $_.reason -ne $best.reason } | ForEach-Object { $_.reason }) -join ','
    Write-Remediation "REFIX coalesced -> $($best.reason) (skipped duplicate relaunch: $skipped)"
  }
  $payload = @{
    requestedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
    reason = $best.reason
    intervalMin = $IntervalMin
    ctx = $best.ctx
  } | ConvertTo-Json -Compress
  Set-Content -Path $refixFlag -Value $payload -Encoding utf8
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] REFIX_REQUESTED $($best.reason)"
  Write-Remediation "REFIX_REQUESTED $($best.reason) -> gl-leak-refix-requested.flag"
  & (Join-Path $PSScriptRoot 'apply-auto-remediation.ps1') -LogDir $LogDir -Package $Package -Reason $best.reason -Ctx $best.ctx -MinIntervalMin 45
  try {
    & node (Join-Path $PSScriptRoot 'pack-incident-handoff.cjs') $best.reason 2>&1 | Out-Null
    Write-Remediation 'HANDOFF packed -> outbox/cursor-incident-handoff.md (Kim Team Lead triage)'
  } catch {
    Write-Remediation "WARN handoff pack skipped: $($_.Exception.Message)"
  }
}

if (-not (Test-Path $TimelineCsv)) {
  exit 0
}

$rows = Get-Content $TimelineCsv | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne '' }
if ($rows.Count -lt 1) { exit 0 }

$last = ($rows[-1] -split ',')
$lastPid = $last[1]
$lastGl = 0.0
$lastPss = 0.0
$lastViews = 0
[void][double]::TryParse($last[4], [ref]$lastGl)
[void][double]::TryParse($last[2], [ref]$lastPss)
if ($last.Count -ge 11 -and $last[10] -match '^\d+') { $lastViews = [int]$last[10] }

# --- Crash log tail (진짜 FATAL/SIGSEGV만 — W ReactNativeJS deprecation 제외) ---
$crashFiles = Get-ChildItem -Path $crashGlob -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
$hasRecentRealCrash = $false
if ($crashFiles) {
  $crashPath = $crashFiles[0].FullName
  $stateFile = Join-Path $LogDir '.crash-byte-offset'
  $offset = 0
  if (Test-Path $stateFile) { $offset = [int](Get-Content $stateFile -Raw) }
  $fi = Get-Item $crashPath
  if ($fi.Length -gt $offset) {
    try {
      $fs = [System.IO.File]::Open($crashPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
      $fs.Seek($offset, [System.IO.SeekOrigin]::Begin) | Out-Null
      $reader = New-Object System.IO.StreamReader($fs)
      $newText = $reader.ReadToEnd()
      $reader.Close()
      $fs.Close()
      Set-Content -Path $stateFile -Value $fi.Length -NoNewline
      $crashMaxAgeMin = [math]::Max(35, ($IntervalMin * 2) + 5)
      $crashEvents = Get-ArcfireCrashLogEvents -Text $newText -MaxAgeMin $crashMaxAgeMin
      if ($crashEvents.Count -gt 0) {
        $hasRecentRealCrash = $true
        $freshLines = ($crashEvents | ForEach-Object { $_.Line }) -join "`n"
        $snippet = ($freshLines -split "`n" | Select-Object -Last 40) -join "`n"
        Add-Content -Path $incidentLog -Value "`n===== CRASH $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') arcfire_fresh=$($crashEvents.Count) maxAge=${crashMaxAgeMin}m =====`n$snippet"
        Write-Remediation "INCIDENT CRASH logged -> incidents.log (arcfire fresh=$($crashEvents.Count) maxAge=${crashMaxAgeMin}m)"
        $lastEventFile = Join-Path $LogDir '.crash-last-event'
        $eventKey = ($crashEvents | Select-Object -Last 1).Line
        $prevKey = ''
        if (Test-Path $lastEventFile) { $prevKey = (Get-Content $lastEventFile -Raw).Trim() }
        if ($eventKey -ne $prevKey) {
          Set-Content -Path $lastEventFile -Value $eventKey -NoNewline -Encoding utf8
          try {
            & node (Join-Path $PSScriptRoot 'pack-incident-handoff.cjs') 'real_crash_signature' 2>&1 | Out-Null
            Write-Remediation 'HANDOFF packed -> outbox/cursor-incident-handoff.md (crash)'
          } catch { }
        } else {
          Write-Remediation 'INFO crash duplicate event key — handoff skipped'
        }
      }
    } catch {
      Write-Remediation "WARN crash log read skipped: $($_.Exception.Message)"
    }
  }
}

$hubActiveNow = Test-MemHubActive -Views $lastViews
$hardCeilingNow = Test-MemHardCeilingBreach -GlMb $lastGl -PssMb $lastPss

# --- Session GL baseline (per pid, active hub samples only) ---
$baseline = @{ pid = $lastPid; glMb = $lastGl; pssMb = $lastPss; peakGlMb = $lastGl; updatedAt = (Get-Date -Format 'o') }
if (Test-Path $baselineJson) {
  try {
    $saved = Get-Content $baselineJson -Raw | ConvertFrom-Json
    if ($saved.pid -eq $lastPid) {
      $baseline.glMb = [double]$saved.glMb
      $baseline.pssMb = [double]$saved.pssMb
      $baseline.peakGlMb = [double]$saved.peakGlMb
    }
  } catch { }
}
if ($hubActiveNow -and $lastGl -gt 0) {
  if ($baseline.glMb -le 0 -or $lastGl -lt $baseline.glMb) { $baseline.glMb = $lastGl }
  if ($lastGl -gt $baseline.peakGlMb) { $baseline.peakGlMb = $lastGl }
  $baseline | ConvertTo-Json | Set-Content -Path $baselineJson -Encoding utf8
}

$peakAboveBaseline = $baseline.peakGlMb - ($baseline.glMb + $MEM_BASELINE_LEAK_MARGIN_MB)

# --- GL stair-step: active hub only, skip HUB_ACTIVATION ---
$recent = @($rows | Where-Object {
  $c = $_ -split ','
  $c.Count -ge 5 -and $c[1] -eq $lastPid -and $c[4] -match '^\d'
} | Select-Object -Last 6)

$spikeCount = 0
$noRecoveryCount = 0
foreach ($row in $recent) {
  $cols = Get-MemTimelineCols -Cols ($row -split ',')
  if (-not $cols.Valid) { continue }
  if ($cols.Note -like 'HUB_ACTIVATION*') { continue }
  if (-not (Test-MemHubActive -Views $cols.Views)) { continue }

  if ($cols.Note -like 'GL_SPIKE*' -or ($cols.DeltaGlMb -ge $MEM_GL_SPIKE_DELTA_MB)) {
    $spikeCount += 1
  } elseif ($cols.Note -eq 'GL_RECOVERED idle_ok') {
    $spikeCount = 0
    $noRecoveryCount = 0
  } elseif ($cols.DeltaGlMb -ge 0 -and $cols.DeltaGlMb -lt 5) {
    $noRecoveryCount += 1
  }
}

if ($hubActiveNow -and $hardCeilingNow) {
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] GL_HARD_CEILING gl=$lastGl pss=$lastPss views=$lastViews"
  Write-Remediation "INCIDENT GL_HARD_CEILING gl=$lastGl pss=$lastPss views=$lastViews -> immediate remediation (OOM imminent)"
  Enqueue-Refix 'gl_critical_active_hub' @{ lastGlMb = $lastGl; pssMb = $lastPss; views = $lastViews; hardCeiling = $true }
} elseif ($hubActiveNow -and $spikeCount -ge $MEM_CONSECUTIVE_SPIKE_LIMIT) {
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] GL_LEAK_SUSPECT consecutive_spikes=$spikeCount views=$lastViews active_hub_only"
  Write-Remediation "INCIDENT GL_LEAK_SUSPECT spikes=$spikeCount views=$lastViews (interval=${IntervalMin}m)"
  Enqueue-Refix 'consecutive_gl_spikes' @{
    spikes = $spikeCount
    lastGlMb = $lastGl
    baselineGlMb = $baseline.glMb
    views = $lastViews
    pssMb = $lastPss
  }
} elseif ($hubActiveNow -and $peakAboveBaseline -ge $MEM_BASELINE_LEAK_MARGIN_MB -and $noRecoveryCount -ge 2 -and $lastGl -ge ($baseline.glMb + 15)) {
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] GL_BASELINE_DRIFT peak=$($baseline.peakGlMb) baseline=$($baseline.glMb) current=$lastGl views=$lastViews"
  Write-Remediation "INCIDENT GL_BASELINE_DRIFT peak=$($baseline.peakGlMb) baseline=$($baseline.glMb) current=$lastGl views=$lastViews"
  Enqueue-Refix 'baseline_gl_drift' @{
    peakGlMb = $baseline.peakGlMb
    baselineGlMb = $baseline.glMb
    currentGlMb = $lastGl
    marginMb = $MEM_BASELINE_LEAK_MARGIN_MB
    views = $lastViews
    pssMb = $lastPss
  }
} elseif ($hubActiveNow -and (Test-MemGlCriticalActiveHub -GlMb $lastGl -Views $lastViews)) {
  $recentActiveCols = @(
    $recent | ForEach-Object { Get-MemTimelineCols -Cols ($_ -split ',') } |
      Where-Object { $_.Valid -and (Test-MemHubActive -Views $_.Views) -and ($_.Note -notlike 'HUB_ACTIVATION*') }
  )
  $stableFootprint = Test-MemGlStableCombatFootprint -RecentActiveCols $recentActiveCols -CurGlMb $lastGl -BaselineGlMb $baseline.glMb
  $tag = if ($stableFootprint) { 'GL_ELEVATED_STABLE active_combat_footprint' } else { 'GL_ELEVATED mounting_or_insufficient_samples' }
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $tag gl=$lastGl pss=$lastPss views=$lastViews restart_held"
  Write-Remediation "INFO $tag gl=$lastGl pss=$lastPss views=$lastViews -> restart held (leak detected only via spikes/drift; OOM via hard-ceiling)"
}

Invoke-BestRefix

# --- Process death ---
if ($rows[-1] -match 'PROCESS_NOT_RUNNING') {
  if (Test-Path $baselineJson) { Remove-Item $baselineJson -Force -ErrorAction SilentlyContinue }

  $recentCrash = $null
  if ($crashFiles -and $hasRecentRealCrash) {
    $ageMin = ((Get-Date) - $crashFiles[0].LastWriteTime).TotalMinutes
    if ($ageMin -le ([math]::Max(15, $IntervalMin * 2))) { $recentCrash = $crashFiles[0] }
  }

  if ($recentCrash) {
    $remAgeMin = Get-LastRemediationAgeMin
    $abnormalRestart = $remAgeMin -lt 25
    $deathTag = if ($abnormalRestart) { 'ABNORMAL_RESTART' } else { 'PROCESS_DEATH' }
    Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $deathTag crash=$($recentCrash.Name) age<=$([math]::Max(15, $IntervalMin*2))m rem=${([math]::Round($remAgeMin,1))}m"
    Write-Remediation "INCIDENT $deathTag (recent crash $($recentCrash.Name)) rem=${([math]::Round($remAgeMin,1))}m -> relaunch+verify"
    $remReason = if ($abnormalRestart) { 'abnormal_restart_after_remediation' } else { 'process_death' }
    & (Join-Path $PSScriptRoot 'apply-auto-remediation.ps1') -LogDir $LogDir -Package $Package -Reason $remReason -Ctx @{ lastGlMb = $lastGl; pssMb = $lastPss; remAgeMin = $remAgeMin } -MinIntervalMin $(if ($abnormalRestart) { 10 } else { 20 })
    try {
      & node (Join-Path $PSScriptRoot 'pack-incident-handoff.cjs') $remReason 2>&1 | Out-Null
    } catch { }
  } else {
    Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] PROCESS_EXIT clean (no recent crash signature) — relaunch skipped"
    Write-Remediation 'INFO PROCESS_EXIT clean (no recent crash) -> relaunch skipped (manual close / verification safe)'
  }
}

exit 0
