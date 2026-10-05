. D:\arcfire20260607\tools\play-bot-console\playbot-process.ps1
$before = Get-PlaybotLiveHarnessPid
Write-Output "before harness=$before"
if ($before -gt 0) { Stop-PlaybotPidTree $before }
Start-Sleep -Seconds 6
$mid = Get-PlaybotLiveHarnessPid
if ($mid -eq 0) { Resume-PlaybotHarnessFromSavedArgs | Out-Null }
Start-Sleep -Seconds 5
$after = Get-PlaybotLiveHarnessPid
$cmds = @(Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'cmd.exe' -and $_.CommandLine -match 'npx tsx' -and $_.CommandLine -match 'run-harness.ts'
})
Write-Output "after harness=$after harnessCmd=$($cmds.Count)"
