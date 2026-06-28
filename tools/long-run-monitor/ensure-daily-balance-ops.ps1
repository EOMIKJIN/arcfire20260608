# 일 1회 balance-ops — perpetual watchdog 멱등 (앱 무관)
param()

$ErrorActionPreference = 'Continue'
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$logDir = Join-Path $ScriptRoot 'logs'
$stampFile = Join-Path $logDir '.daily-balance-ops-kst-day.txt'
$runLog = Join-Path $logDir 'daily-balance-ops.log'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$kstDay = (Get-Date).ToUniversalTime().AddHours(9).ToString('yyyy-MM-dd')
if (Test-Path $stampFile) {
  $last = (Get-Content $stampFile -Raw).Trim()
  if ($last -eq $kstDay) {
    Write-Output "daily_balance_ops=skip day=$kstDay"
    exit 0
  }
}

$root = Resolve-Path (Join-Path $ScriptRoot '..\..')
$auditScript = Join-Path $root 'tools\balance-ops-audit\run-balance-ops-audit.cjs'
. (Join-Path $ScriptRoot 'invoke-node-hidden.ps1')
Push-Location $root
try {
  $lines = @(Invoke-NodeHidden -ScriptPath $auditScript -CaptureOutput)
  $exit = $LASTEXITCODE
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] exit=$exit kstDay=$kstDay"
  Add-Content -Path $runLog -Value $line -Encoding utf8
  $lines | Select-Object -Last 15 | ForEach-Object { Add-Content -Path $runLog -Value $_ -Encoding utf8 }
  if ($exit -eq 0 -or $exit -eq 1) {
    Set-Content -Path $stampFile -Value $kstDay -Encoding ascii
  }
  Write-Output "daily_balance_ops=ran exit=$exit day=$kstDay"
  exit $exit
} finally {
  Pop-Location
}
