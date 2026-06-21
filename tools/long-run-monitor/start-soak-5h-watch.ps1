# 5h Arcadia hub soak — baseline + 10m correlation sampler
param(
  [string]$Package = 'com.arcfire.online'
)

$ScriptRoot = $PSScriptRoot
$LogDir = Join-Path $ScriptRoot 'logs'
$sessionFile = Join-Path $LogDir 'soak-5h-session-20260621.json'
$corrCsv = Join-Path $LogDir 'mem-correlation-soak-20260621.csv'
$startedAt = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

Write-Host "=== 5h soak watch start $startedAt ==="

# baseline in mem-timeline
& (Join-Path $ScriptRoot 'manual-mem-snapshot.ps1') -Package $Package -Note 'SOAK5H_PATCH_HUB_DRONE_20260621_START'

# dedicated 10m correlation (31 samples ≈ 5h10m)
$corrJob = Start-Process -FilePath 'powershell.exe' -ArgumentList @(
  '-ExecutionPolicy', 'Bypass', '-NoProfile', '-File',
  (Join-Path $ScriptRoot 'run-mem-correlation-10m.ps1'),
  '-IntervalMin', '10',
  '-MaxSamples', '31',
  '-OutputCsv', $corrCsv
) -PassThru -WindowStyle Hidden

$pidFile = Join-Path $LogDir 'soak-5h-correlation.pid'
Set-Content -Path $pidFile -Value $corrJob.Id -Encoding ascii

Write-Host "Correlation sampler PID $($corrJob.Id) -> $corrCsv (10m x 31)"
Write-Host "30m watch monitor should stay running (watch-30m.pid)"
Write-Host ""
Write-Host "After ~5h run:"
Write-Host "  powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/report-soak-5h.ps1"
Write-Host "Expected end ~$((Get-Date).AddHours(5).ToString('yyyy-MM-dd HH:mm:ss')) KST"
