# Auto-stop playtest at 23:30 KST (2026-06-27 session)
$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
Set-Location $root
$endAt = [DateTime]::Parse('2026-06-27 23:30:00')
$delaySec = [math]::Max(30, [int](($endAt - (Get-Date)).TotalSeconds))
Start-Sleep -Seconds $delaySec
& (Join-Path $PSScriptRoot 'stop-playtest-watch.ps1')
& (Join-Path $PSScriptRoot 'analyze-playtest-session.ps1')
$kst = (Get-Date).ToUniversalTime().AddHours(9).ToString('yyyy-MM-dd HH:mm:ss')
Add-Content -Path (Join-Path $PSScriptRoot 'logs\playtest-alerts.log') -Value "[$kst] AUTO_STOP scheduled_2330"
