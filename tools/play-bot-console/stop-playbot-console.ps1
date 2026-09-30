# 콘솔·워치·하니스·기록 일괄 종료
$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'playbot-process.ps1')
$consoleId = Read-PlaybotPid 'playbot-console.pid'
Stop-PlaybotAll
Write-Output "playbot_console=stopped pid=$consoleId recording=off"
