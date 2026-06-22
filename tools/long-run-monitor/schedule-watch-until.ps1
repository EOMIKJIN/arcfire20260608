# Detached: long-run watch 유지 후 지정 시각(KST)에 monitor 종료
param(
  [Parameter(Mandatory = $true)]
  [string]$UntilLocal,  # 'yyyy-MM-dd HH:mm:ss' 로컬(KST) 시각
  [string]$Note = 'user_scheduled'
)

$ErrorActionPreference = 'SilentlyContinue'
$Root = $PSScriptRoot
$LogDir = Join-Path $Root 'logs'
$SessionLog = Join-Path $LogDir 'watch-session.log'
$PidFile = Join-Path $LogDir 'watch-30m.pid'

function Write-Session([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $SessionLog -Value $line -Encoding utf8
}

try {
  $until = [datetime]::ParseExact($UntilLocal.Trim(), 'yyyy-MM-dd HH:mm:ss', $null)
} catch {
  Write-Session "SCHEDULE_FAIL invalid UntilLocal=$UntilLocal"
  exit 1
}

Write-Session "SCHEDULE_START until=$UntilLocal note=$Note"

while ((Get-Date) -lt $until) {
  $remain = ($until - (Get-Date)).TotalMinutes
  if ($remain -gt 30) {
    Start-Sleep -Seconds 1800
  } else {
    Start-Sleep -Seconds ([Math]::Max(30, [int]($remain * 60)))
  }

  $watchPid = $null
  if (Test-Path $PidFile) {
    $watchPid = (Get-Content $PidFile -Raw).Trim()
  }
  if ($watchPid -and -not (Get-Process -Id ([int]$watchPid) -ErrorAction SilentlyContinue)) {
    Write-Session "WATCH_DIED pid=$watchPid — restarting start-watch-30m.ps1"
    Start-Process -WindowStyle Hidden -FilePath 'powershell' -ArgumentList @(
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-File', (Join-Path $Root 'start-watch-30m.ps1')
    ) -WorkingDirectory $Root | Out-Null
  }
}

if (Test-Path $PidFile) {
  $watchPid = (Get-Content $PidFile -Raw).Trim()
  if ($watchPid) {
    Stop-Process -Id ([int]$watchPid) -Force -ErrorAction SilentlyContinue
    Write-Session "WATCH_STOP pid=$watchPid until_reached=$UntilLocal"
  }
}

Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
Write-Session "SCHEDULE_DONE until=$UntilLocal"
