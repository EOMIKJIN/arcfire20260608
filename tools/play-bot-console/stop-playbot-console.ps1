# 콘솔·워치·하니스·기록 일괄 종료 (명시 중지)
$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'playbot-process.ps1')
$consoleId = Read-PlaybotPid 'playbot-console.pid'
Set-PlaybotExplicitStop
Stop-PlaybotAll
Write-Output "playbot_console=stopped pid=$consoleId recording=off"
