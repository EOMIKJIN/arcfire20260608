param(
  [int]$DelayMinutes = 5
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
$logDir = Join-Path $PSScriptRoot 'logs'
$scheduleLog = Join-Path $logDir 'schedule-8am-report.log'
$marker = Join-Path $logDir 'TEST_REPORT_PENDING.md'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Log([string]$msg) {
  $line = '[' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '] [test-report] ' + $msg
  Write-Output $line
  try { Add-Content -Path $scheduleLog -Value $line -Encoding utf8 } catch {}
}

$scheduledAt = Get-Date
$targetAt = $scheduledAt.AddMinutes($DelayMinutes)
$delaySec = [math]::Max(1, $DelayMinutes * 60)

$markerBody = @(
  '# Test report scheduled',
  "scheduled: $($scheduledAt.ToString('yyyy-MM-dd HH:mm:ss K'))",
  "target: $($targetAt.ToString('yyyy-MM-dd HH:mm:ss K'))",
  "delay_min: $DelayMinutes"
) -join "`n"
Set-Content -Path $marker -Value $markerBody -Encoding utf8

Log "scheduled target=$($targetAt.ToString('yyyy-MM-dd HH:mm:ss K')) delay_min=$DelayMinutes"

Start-Sleep -Seconds $delaySec

Set-Location $Root
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
  Log 'FAIL node not found'
  exit 1
}

Log 'running schedule-8am --publish-only'
& $node (Join-Path $PSScriptRoot 'schedule-8am-kim-daily-auto-report.cjs') '--publish-only'
$exitCode = $LASTEXITCODE
if ($exitCode -eq 0) {
  Log 'DONE CHAT_REPORT_PENDING written'
} else {
  Log "FAIL exit=$exitCode"
}
exit $exitCode
