# One-night exception shutdown — stops all monitor stack until resumeAt (default next 08:00 KST).
# Does NOT touch schedule-8am-report-DISABLED.flag or perpetual-detection-DISABLED.flag.
param(
  [string]$ResumeAt = '',
  [string]$Reason = 'user overnight exception shutdown'
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$flagPath = Join-Path $logDir 'overnight-exception-shutdown.flag'
$incidents = Join-Path $logDir 'incidents.log'
$iso = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

function Test-ProcessAlive([int]$procId) {
  if ($procId -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $procId -ErrorAction SilentlyContinue) } catch { return $false }
}

function Stop-PidFile([string]$pidPath, [string]$label) {
  if (-not (Test-Path $pidPath)) { return $false }
  $raw = (Get-Content $pidPath -Raw -ErrorAction SilentlyContinue).Trim()
  $old = 0
  [void][int]::TryParse($raw, [ref]$old)
  if (Test-ProcessAlive $old) {
    Write-Output "stop $label pid=$old"
    Stop-Process -Id $old -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 800
    return $true
  }
  Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
  return $false
}

if (-not $ResumeAt) {
  $now = Get-Date
  $target = Get-Date -Year $now.Year -Month $now.Month -Day $now.Day -Hour 8 -Minute 0 -Second 0
  if ($target -le $now) { $target = $target.AddDays(1) }
  $ResumeAt = $target.ToString('yyyy-MM-dd HH:mm:ss')
}

$pidNames = @(
  'perpetual-watchdog.pid',
  'watch-30m.pid',
  'report-watch.pid',
  'schedule-8am-perpetual.pid',
  'schedule-5pm-report.pid',
  'kim-economy-console.pid',
  'memory-profiler-watch.pid',
  'playtest-scan.pid',
  'precision-logcat.pid',
  'territorial-logcat.pid',
  'state-watch-3h.pid',
  'state-watch-5h.pid',
  'soak-5h-correlation.pid'
)

$stopped = New-Object System.Collections.Generic.List[string]
foreach ($name in $pidNames) {
  $p = Join-Path $logDir $name
  if (Stop-PidFile $p $name) { [void]$stopped.Add($name) }
}

$flagBody = @(
  'kind=overnight-exception-shutdown',
  "created=$iso",
  "resume_at_kst=$ResumeAt",
  "reason=$Reason",
  'daily_schedule=unchanged',
  'note=Remove flag or run resume-after-overnight-exception.ps1 at resume time'
) -join "`n"
Set-Content -Path $flagPath -Value $flagBody -Encoding utf8

$line = "[$iso] OVERNIGHT_EXCEPTION_SHUTDOWN resume_at_kst=$ResumeAt stopped=$($stopped.Count) reason=$Reason"
Add-Content -Path $incidents -Value $line -Encoding utf8

Write-Output "overnight_shutdown=OK flag=$flagPath resume_at_kst=$ResumeAt stopped_count=$($stopped.Count)"
Write-Output 'daily_8am_DISABLED_flag=NOT_SET (schedule unchanged)'

# Schedule auto-resume at resumeAt (background, hidden)
$resumeScript = Join-Path $ScriptRoot 'resume-after-overnight-exception.ps1'
$scheduleScript = Join-Path $ScriptRoot 'schedule-resume-after-overnight-exception.ps1'
if (Test-Path $scheduleScript) {
  Start-Process -FilePath 'powershell.exe' -ArgumentList @(
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-WindowStyle', 'Hidden', '-File', $scheduleScript,
    '-ResumeAt', $ResumeAt
  ) -WindowStyle Hidden | Out-Null
  Write-Output "auto_resume_scheduled=$ResumeAt"
}
