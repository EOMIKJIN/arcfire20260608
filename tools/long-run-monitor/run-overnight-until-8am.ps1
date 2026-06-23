# Sleep until 08:00 KST then write overnight final report (no app changes)
param(
  [string]$TargetDate = '2026-06-23',
  [int]$TargetHour = 8,
  [int]$TargetMinute = 0
)

function Get-KstNow {
  return (Get-Date).ToUniversalTime().AddHours(9)
}

$targetKst = [datetime]::ParseExact(
  "$TargetDate $($TargetHour.ToString('00')):$($TargetMinute.ToString('00')):00",
  'yyyy-MM-dd HH:mm:ss',
  $null
)

$now = Get-KstNow
if ($now -ge $targetKst) {
  Write-Output "Target KST already passed ($targetKst). Running report now."
} else {
  $waitSec = [int](($targetKst - $now).TotalSeconds)
  Write-Output "Waiting ${waitSec}s until KST $targetKst ..."
  Start-Sleep -Seconds $waitSec
}

& (Join-Path $PSScriptRoot 'run-overnight-final-report.ps1')
Write-Output "Overnight final report complete (KST $(Get-KstNow -Format 'yyyy-MM-dd HH:mm:ss'))"
