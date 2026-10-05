Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -match 'run-harness.ts' -or $_.CommandLine -match 'watch-playbot' -or $_.CommandLine -match 'fqa' -or $_.CommandLine -match 'owner-auto'
} | ForEach-Object {
  '{0} {1} parent={2} {3}' -f $_.ProcessId, $_.Name, $_.ParentProcessId, $_.CommandLine
}
