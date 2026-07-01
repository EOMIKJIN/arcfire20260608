# Resume full monitor stack after one-night exception shutdown.
param(
  [switch]$Force
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$flagPath = Join-Path $logDir 'overnight-exception-shutdown.flag'
$incidents = Join-Path $logDir 'incidents.log'
$iso = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

if (-not (Test-Path $flagPath) -and -not $Force) {
  Write-Output 'resume_skip=no overnight-exception-shutdown.flag'
  exit 0
}

Remove-Item $flagPath -Force -ErrorAction SilentlyContinue

$marker = "[$iso] OVERNIGHT_EXCEPTION_RESUME full stack restart"
Add-Content -Path $incidents -Value $marker -Encoding utf8

Write-Output $marker

& (Join-Path $ScriptRoot 'ensure-always-on-watch-stack.ps1') | ForEach-Object { Write-Output $_ }

$ensurePerpetual = Join-Path $ScriptRoot 'ensure-perpetual-watchdog.cjs'
if (Test-Path $ensurePerpetual) {
  & node $ensurePerpetual --force-restart 2>&1 | ForEach-Object { Write-Output "perpetual $_" }
}

Write-Output 'overnight_resume=OK daily_schedule=unchanged'
