# Release 빌드 후 장기 플레이테스트 감시 — 정밀 logcat + 10분 mem + 실시간 알림
# 자동 앱 재시작은 기본 OFF (monitor-paused.flag) — 수동 플레이 중단 방지
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 10,
  [int]$WaitForAppMin = 60,
  [switch]$AllowAutoRemediation,
  [switch]$RestartExisting,
  [string]$BuildNote = 'post-rebuild playtest — worldmap scroll teardown + lifecycle timer'
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Get-KstNow { (Get-Date).ToUniversalTime().AddHours(9) }

function Test-ProcessAlive([int]$procId) {
  if ($procId -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $procId -ErrorAction SilentlyContinue) } catch { return $false }
}

function Stop-IfPidFile([string]$pidPath, [string]$label) {
  if (-not (Test-Path $pidPath)) { return }
  $old = [int](Get-Content $pidPath -Raw).Trim()
  if (Test-ProcessAlive $old) {
    if (-not $RestartExisting) {
      Write-Warning "$label already running (pid=$old). Use -RestartExisting to replace."
      return $old
    }
    Stop-Process -Id $old -Force -ErrorAction SilentlyContinue
  }
  Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
  return 0
}

# --- adb ---
$dev = (adb devices 2>&1 | Select-String 'device$' | Select-Object -First 1)
if (-not $dev) {
  Write-Error 'No adb device. Connect device and retry.'
  exit 1
}
Write-Output "adb=$($dev.Line.Trim())"

# --- wait for app (build/install complete) ---
$deadline = (Get-Date).AddMinutes($WaitForAppMin)
$appPid = ''
while ((Get-Date) -lt $deadline) {
  $appPid = (adb shell "pidof $Package" 2>$null | Out-String).Trim()
  if ($appPid) { break }
  Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Waiting for $Package (build/install?)..." -ForegroundColor Yellow
  Start-Sleep -Seconds 15
}
if (-not $appPid) {
  Write-Warning "App not running after ${WaitForAppMin}m — starting monitors anyway (launch app when ready)."
} else {
  Write-Output "app_pid=$appPid"
}

# --- session manifest ---
$kst = Get-KstNow
$sessionId = "playtest-$($kst.ToString('yyyyMMdd-HHmmss'))"
$headCommit = ''
try { $headCommit = (git -C (Split-Path $ScriptRoot -Parent -Parent) rev-parse --short HEAD 2>$null).Trim() } catch {}

$paused = -not $AllowAutoRemediation
$pauseFlag = Join-Path $logDir 'monitor-paused.flag'
if ($paused) {
  New-Item -ItemType File -Force -Path $pauseFlag | Out-Null
  Write-Output 'auto_remediation=PAUSED (record-only; remove monitor-paused.flag to re-enable)'
} else {
  Remove-Item $pauseFlag -Force -ErrorAction SilentlyContinue
  Write-Output 'auto_remediation=ACTIVE'
}

$session = @{
  sessionId = $sessionId
  startedAtKst = $kst.ToString('yyyy-MM-dd HH:mm:ss')
  headCommit = $headCommit
  buildNote = $BuildNote
  autoRemediationPaused = $paused
  intervalMin = $IntervalMin
  focusAreas = @(
    'long_idle_hub',
    'planet_worldmap_cycle',
    'galaxy_transit_combat',
    'wave_combat_skia',
    'facility_substage'
  )
  passCriteria = @{
    fatalSignalAfterStart = 0
    workletExecuteSyncCrash = 0
    glFloorDriftMbMax = 25
    abnormalRestartWithin25m = 0
  }
  milestones = @()
}
$sessionPath = Join-Path $logDir 'playtest-session-active.json'
$session | ConvertTo-Json -Depth 6 | Set-Content -Path $sessionPath -Encoding utf8
Copy-Item -Path $sessionPath -Destination (Join-Path $logDir "$sessionId.json") -Force

# reset scan state for fresh session
Remove-Item (Join-Path $logDir '.playtest-scan-offset') -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $logDir '.playtest-scan-seen.txt') -Force -ErrorAction SilentlyContinue
Add-Content -Path (Join-Path $logDir 'playtest-alerts.log') -Value "[$($kst.ToString('yyyy-MM-dd HH:mm:ss'))] SESSION_START $sessionId commit=$headCommit"

# --- stop/restart child monitors ---
Stop-IfPidFile (Join-Path $logDir 'watch-30m.pid') 'mem-monitor' | Out-Null
Stop-IfPidFile (Join-Path $logDir 'precision-logcat.pid') 'precision-logcat' | Out-Null
Stop-IfPidFile (Join-Path $logDir 'playtest-scan.pid') 'playtest-scan' | Out-Null
Stop-IfPidFile (Join-Path $logDir 'report-watch.pid') 'report-watch' | Out-Null

# --- precision logcat (DEBUG backtrace 포함) ---
$precision = & (Join-Path $ScriptRoot 'start-precision-logcat.ps1') -Package $Package -ClearLogcat
$precision | ForEach-Object { Write-Output $_ }

# --- mem monitor (10m default) ---
adb logcat -c 2>$null | Out-Null
$crashTs = Get-Date -Format 'yyyyMMdd-HHmmss'
$crashLog = Join-Path $logDir "crash-$crashTs.log"
Start-Process -WindowStyle Hidden -FilePath 'adb' -ArgumentList @(
  'logcat', '-v', 'threadtime',
  'AndroidRuntime:E', 'ReactNativeJS:E', 'ReactNativeJS:W',
  'libc:E', 'DEBUG:E', 'ActivityManager:I',
  '*:S'
) -RedirectStandardOutput $crashLog | Out-Null

$mon = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $ScriptRoot 'run-monitor.ps1'),
  '-Package', $Package,
  '-IntervalMin', "$IntervalMin"
)
Set-Content -Path (Join-Path $logDir 'watch-30m.pid') -Value $mon.Id -Encoding ascii

# --- real-time pattern scanner ---
$scan = Start-Process -WindowStyle Hidden -PassThru -FilePath 'powershell' -ArgumentList @(
  '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $ScriptRoot 'scan-playtest-alerts.ps1'),
  '-LogDir', $logDir,
  '-PollSec', '20'
)
Set-Content -Path (Join-Path $logDir 'playtest-scan.pid') -Value $scan.Id -Encoding ascii

# --- user heartbeat console (visible PowerShell window) ---
$report = Start-Process -WindowStyle Normal -PassThru -FilePath 'powershell' -ArgumentList @(
  '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass',
  '-File', (Join-Path $ScriptRoot 'report-watch.ps1'),
  '-Package', $Package,
  '-IntervalMin', "$IntervalMin"
)
Set-Content -Path (Join-Path $logDir 'report-watch.pid') -Value $report.Id -Encoding ascii

# --- baseline snapshot ---
if ($appPid) {
  & (Join-Path $ScriptRoot 'manual-mem-snapshot.ps1') -Package $Package -Note "PLAYTEST_START_$sessionId" | Out-Null
}

Add-Content -Path (Join-Path $logDir 'incidents.log') -Value "[$($kst.ToString('yyyy-MM-dd HH:mm:ss'))] PLAYTEST_START $sessionId interval=${IntervalMin}m paused=$paused"

Write-Output ''
Write-Output '=== PLAYTEST WATCH ACTIVE ==='
Write-Output "session=$sessionPath"
Write-Output "monitor_pid=$($mon.Id) interval_min=$IntervalMin"
Write-Output "scan_pid=$($scan.Id)"
Write-Output "report_pid=$($report.Id)"
Write-Output "precision_log=$logDir\precision-playtest-*.log"
Write-Output "alerts=$logDir\playtest-alerts.log"
Write-Output "timeline=$logDir\mem-timeline.csv"
Write-Output ''
Write-Output 'Milestones during play:'
Write-Output "  powershell -File tools/long-run-monitor/tag-playtest-milestone.ps1 -Label worldmap_cycle_10"
Write-Output ''
Write-Output 'After playtest:'
Write-Output "  powershell -File tools/long-run-monitor/stop-playtest-watch.ps1"
Write-Output "  powershell -File tools/long-run-monitor/analyze-playtest-session.ps1"
Write-Output ''
Write-Output 'See tools/long-run-monitor/PLAYTEST_WATCH.md'
