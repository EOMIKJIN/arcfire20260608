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

function Write-Remediation([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $remediationLog -Value $line
  Write-Host $line
}

function Request-Refix([string]$reason, [hashtable]$ctx) {
  $payload = @{
    requestedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
    reason = $reason
    intervalMin = $IntervalMin
    ctx = $ctx
  } | ConvertTo-Json -Compress
  Set-Content -Path $refixFlag -Value $payload -Encoding utf8
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] REFIX_REQUESTED $reason"
  Write-Remediation "REFIX_REQUESTED $reason -> gl-leak-refix-requested.flag"
  & (Join-Path $PSScriptRoot 'apply-auto-remediation.ps1') -LogDir $LogDir -Package $Package -Reason $reason -Ctx $ctx -MinIntervalMin 45
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

# --- Crash log tail ---
$crashFiles = Get-ChildItem -Path $crashGlob -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
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
      if ($newText -match 'FATAL|AndroidRuntime|SIGSEGV|signal 11|ReactNativeJS') {
        $snippet = ($newText -split "`n" | Select-Object -Last 40) -join "`n"
        Add-Content -Path $incidentLog -Value "`n===== CRASH $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') =====`n$snippet"
        Write-Remediation 'INCIDENT CRASH logged -> incidents.log'
      }
    } catch {
      Write-Remediation "WARN crash log read skipped: $($_.Exception.Message)"
    }
  }
}

$hubActiveNow = Test-MemHubActive -Views $lastViews

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

if ($hubActiveNow -and $spikeCount -ge $MEM_CONSECUTIVE_SPIKE_LIMIT) {
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] GL_LEAK_SUSPECT consecutive_spikes=$spikeCount views=$lastViews active_hub_only"
  Write-Remediation "INCIDENT GL_LEAK_SUSPECT spikes=$spikeCount views=$lastViews (interval=${IntervalMin}m)"
  Request-Refix 'consecutive_gl_spikes' @{
    spikes = $spikeCount
    lastGlMb = $lastGl
    baselineGlMb = $baseline.glMb
    views = $lastViews
  }
}

if (
  $hubActiveNow
  -and $peakAboveBaseline -ge $MEM_BASELINE_LEAK_MARGIN_MB
  -and $noRecoveryCount -ge 2
  -and $lastGl -ge ($baseline.glMb + 15)
) {
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] GL_BASELINE_DRIFT peak=$($baseline.peakGlMb) baseline=$($baseline.glMb) current=$lastGl views=$lastViews"
  Write-Remediation "INCIDENT GL_BASELINE_DRIFT peak=$($baseline.peakGlMb) baseline=$($baseline.glMb) current=$lastGl views=$lastViews"
  Request-Refix 'baseline_gl_drift' @{
    peakGlMb = $baseline.peakGlMb
    baselineGlMb = $baseline.glMb
    currentGlMb = $lastGl
    marginMb = $MEM_BASELINE_LEAK_MARGIN_MB
    views = $lastViews
  }
}

if ($hubActiveNow -and (Test-MemGlCriticalActiveHub -GlMb $lastGl -Views $lastViews)) {
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] GL_CRITICAL_ACTIVE gl=$lastGl views=$lastViews"
  Write-Remediation "INCIDENT GL_CRITICAL_ACTIVE gl=$lastGl views=$lastViews"
  Request-Refix 'gl_critical_active_hub' @{ lastGlMb = $lastGl; views = $lastViews }
}

# --- Process death ---
if ($rows[-1] -match 'PROCESS_NOT_RUNNING') {
  Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] PROCESS_DEATH see crash log"
  Write-Remediation 'INCIDENT PROCESS_DEATH'
  if (Test-Path $baselineJson) { Remove-Item $baselineJson -Force -ErrorAction SilentlyContinue }
  & (Join-Path $PSScriptRoot 'apply-auto-remediation.ps1') -LogDir $LogDir -Package $Package -Reason 'process_death' -Ctx @{ lastGlMb = $lastGl } -MinIntervalMin 20
}

exit 0
