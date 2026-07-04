# 18:05 KST balance-ops re-run (post Daily Batch)
$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$Root = Split-Path $ScriptRoot -Parent | Split-Path -Parent
$logDir = Join-Path $ScriptRoot 'logs'
$log = Join-Path $logDir 'balance-ops-20260703-1800.log'

function Get-KstNow { (Get-Date).ToUniversalTime().AddHours(9) }

while ((Get-KstNow) -lt [datetime]'2026-07-03 18:05:00') {
  Start-Sleep -Seconds 300
}

Set-Location $Root
npm run audit:balance-ops *> $log
$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
Add-Content -Path (Join-Path $logDir 'incidents.log') -Value "[$stamp] BALANCE_OPS_6PM $log" -Encoding utf8
Write-Host "[$stamp] balance-ops done -> $log"
