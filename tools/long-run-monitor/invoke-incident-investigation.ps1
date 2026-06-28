# Incident: logcat capture, handoff pack, Cursor auto-fix trigger
param(
  [Parameter(Mandatory = $true)][string]$Reason,
  [string]$AlertLine,
  [string]$LogDir,
  [string]$Package,
  [switch]$AllowAppRelaunch
)

if (-not $AlertLine) { $AlertLine = '' }
if (-not $LogDir) { $LogDir = Join-Path $PSScriptRoot 'logs' }
if (-not $Package) { $Package = 'com.arcfire.online' }

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'mem-gl-leak-rules.ps1')
. (Join-Path $PSScriptRoot 'monitor-host-budget.ps1')
. (Join-Path $PSScriptRoot 'invoke-node-hidden.ps1')

$remediationLog = Join-Path $LogDir 'remediation.log'
$incidentLog = Join-Path $LogDir 'incidents.log'
$pauseFlag = Join-Path $LogDir 'monitor-paused.flag'
$throttleFile = Join-Path $LogDir '.incident-investigation-throttle.json'
$root = Resolve-Path (Join-Path $PSScriptRoot '../..')
$triggerJson = Join-Path $root '.cursor/trigger-incident-auto-fix.json'
$refixFlag = Join-Path $LogDir 'gl-leak-refix-requested.flag'

function Write-Remediation([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $remediationLog -Value $line -Encoding utf8
  Write-Host $line
}

function Test-Throttled([string]$key, [int]$minIntervalMin = 8) {
  $now = Get-Date
  $raw = '{}'
  if (Test-Path $throttleFile) {
    try { $raw = Get-Content $throttleFile -Raw } catch { $raw = '{}' }
  }
  $map = @{}
  try {
    $parsed = $raw | ConvertFrom-Json
    if ($parsed) {
      $parsed.PSObject.Properties | ForEach-Object { $map[$_.Name] = $_.Value }
    }
  } catch { }
  if ($map.ContainsKey($key)) {
    try {
      $prev = [datetime]::Parse([string]$map[$key])
      if (($now - $prev).TotalMinutes -lt $minIntervalMin) { return $true }
    } catch { }
  }
  $map[$key] = $now.ToString('o')
  ($map | ConvertTo-Json -Compress) | Set-Content -Path $throttleFile -Encoding utf8
  return $false
}

if (Test-Throttled -key $Reason) {
  Write-Remediation "INVESTIGATION throttled reason=$Reason (duplicate within window)"
  exit 0
}

Write-Remediation "INVESTIGATION start reason=$Reason"
if ($AlertLine) {
  $snippet = $AlertLine.Substring(0, [Math]::Min(120, $AlertLine.Length))
  Write-Remediation "INVESTIGATION alert=$snippet"
}

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$logcatOut = Join-Path $LogDir "incident-logcat-$ts.log"
try {
  adb logcat -d -t 800 AndroidRuntime:E ReactNativeJS:E ReactNativeJS:W libc:E DEBUG:E ActivityManager:I *:S 2>&1 |
    Out-File -FilePath $logcatOut -Encoding utf8
  Write-Remediation "INVESTIGATION logcat captured -> $logcatOut"
} catch {
  Write-Remediation "INVESTIGATION logcat WARN $($_.Exception.Message)"
}

try {
  $snap = Get-TimelineHeartbeatMetrics -LogDir $LogDir -MaxAgeMin 20
  $forceMem = $Reason -match 'crash|death|FATAL|SIGSEGV|hard_ceiling|mem_hard'
  if ($snap -and -not $forceMem) {
    $memOut = Join-Path $LogDir "incident-meminfo-$ts.log"
    @(
      "source=mem-timeline (no adb dumpsys — app impact guard)",
      "pid=$($snap.pid) pss_mb=$($snap.pssMb) gl_mb=$($snap.glMb) views=$($snap.views) age_min=$($snap.ageMin)"
    ) | Set-Content -Path $memOut -Encoding utf8
    Write-Remediation "INVESTIGATION mem from timeline gl=$($snap.glMb)MB pss=$($snap.pssMb)MB -> $memOut"
  } elseif (Test-CanInvokeAdbMeminfo -LogDir $LogDir -Force:$forceMem) {
    $memRaw = adb shell dumpsys meminfo $Package 2>&1 | Out-String
    Register-AdbMeminfoInvocation -LogDir $LogDir
    $memOut = Join-Path $LogDir "incident-meminfo-$ts.log"
    $memRaw | Set-Content -Path $memOut -Encoding utf8
    $gl = $null
    $pss = $null
    if ($memRaw -match 'TOTAL PSS:\s+(\d+)') { $pss = [math]::Round([int]$Matches[1] / 1024, 1) }
    if ($memRaw -match '(?m)^\s*GL mtrack\s+(\d+)') { $gl = [math]::Round([int]$Matches[1] / 1024, 1) }
    Write-Remediation "INVESTIGATION mem snapshot gl=${gl}MB pss=${pss}MB -> $memOut"
  } else {
    Write-Remediation 'INVESTIGATION meminfo SKIPPED (host budget — timeline/handoff only)'
  }
} catch {
  Write-Remediation "INVESTIGATION meminfo WARN $($_.Exception.Message)"
}

$payload = @{
  requestedAt = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
  reason = $Reason
  alertLine = $AlertLine
  logcatCapture = $logcatOut
} | ConvertTo-Json -Compress
Set-Content -Path $refixFlag -Value $payload -Encoding utf8

try {
  Invoke-NodeHidden -ScriptPath (Join-Path $PSScriptRoot 'pack-incident-handoff.cjs') -NodeArgs @($Reason) -CaptureOutput |
    ForEach-Object { Write-Remediation $_ }
} catch {
  Write-Remediation "INVESTIGATION handoff pack ERROR $($_.Exception.Message)"
}

$trigger = @{
  triggeredAt = (Get-Date).ToUniversalTime().ToString('o')
  reason = $Reason
  alertLine = $AlertLine
  handoff = 'tools/long-run-monitor/outbox/cursor-incident-handoff.md'
  action = 'P0: logcat root cause -> code fix -> tsc -> ack-incident-handoff.cjs'
} | ConvertTo-Json -Depth 4
$triggerDir = Split-Path $triggerJson -Parent
New-Item -ItemType Directory -Force -Path $triggerDir | Out-Null
Set-Content -Path $triggerJson -Value $trigger -Encoding utf8
Write-Remediation "INVESTIGATION trigger -> .cursor/trigger-incident-auto-fix.json"

Add-Content -Path $incidentLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] INVESTIGATION_TRIGGERED $Reason" -Encoding utf8

$paused = Test-Path $pauseFlag
if ($AllowAppRelaunch -and -not $paused) {
  & (Join-Path $PSScriptRoot 'apply-auto-remediation.ps1') -LogDir $LogDir -Package $Package -Reason $Reason -MinIntervalMin 30
} elseif ($paused) {
  Write-Remediation 'INVESTIGATION code-fix handoff only (monitor-paused — no app relaunch)'
  try {
    Push-Location $root
    npm run audit:skia-memory 2>&1 | Out-Null
    Write-Remediation 'INVESTIGATION audit:skia-memory completed (paused mode static gate)'
  } catch {
    Write-Remediation "INVESTIGATION audit:skia-memory WARN $($_.Exception.Message)"
  } finally {
    Pop-Location
  }
}

Write-Remediation "INVESTIGATION done reason=$Reason"
exit 0
