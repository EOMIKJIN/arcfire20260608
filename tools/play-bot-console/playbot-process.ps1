# 플레이봇 프로세스 트리 · 기록 플래그.
# 창 종료 ≠ 기록 종료. 명시적 stop-playbot-console 만 기록을 끊는다.

function Get-PlaybotNextUntilWall {
  $kst = [DateTime]::UtcNow.AddHours(9)
  $eight = New-Object DateTime $kst.Year, $kst.Month, $kst.Day, 8, 0, 0
  if ($kst -ge $eight) { $eight = $eight.AddDays(1) }
  return ($eight.ToString('yyyy-MM-dd') + 'T08:00:00+09:00')
}
$script:PlaybotToolRoot = $PSScriptRoot
$script:PlaybotLogDir = Join-Path $PSScriptRoot 'logs'
$script:PlaybotRepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Get-PlaybotLogDir {
  New-Item -ItemType Directory -Force -Path $script:PlaybotLogDir | Out-Null
  return $script:PlaybotLogDir
}

function Get-PlaybotExplicitStopPath {
  return (Join-Path (Get-PlaybotLogDir) 'PLAYBOT_EXPLICIT_STOP.flag')
}

function Test-PlaybotExplicitStop {
  return (Test-Path (Get-PlaybotExplicitStopPath))
}

function Set-PlaybotExplicitStop {
  Set-Content -Path (Get-PlaybotExplicitStopPath) -Value ("stoppedAt=" + (Get-Date).ToString('o')) -Encoding utf8
}

function Clear-PlaybotExplicitStop {
  Remove-Item (Get-PlaybotExplicitStopPath) -Force -ErrorAction SilentlyContinue
}

function Get-PlaybotHarnessArgsPath {
  return (Join-Path (Get-PlaybotLogDir) 'PLAYBOT_HARNESS_ARGS.json')
}

function Save-PlaybotHarnessArgs {
  param(
    [string]$Persona = 'mixed_ref',
    [int]$Days = 0,
    [int]$Stage = 1,
    [int]$LiveMs = 120,
    [int]$Seed = 0,
    [string]$UntilWall = '',
    [switch]$Fast
  )
  $payload = @{
    persona = $Persona
    days = $Days
    stage = $Stage
    liveMs = $LiveMs
    seed = $Seed
    untilWall = $UntilWall
    fast = [bool]$Fast
  } | ConvertTo-Json -Compress
  Set-Content -Path (Get-PlaybotHarnessArgsPath) -Value $payload -Encoding utf8
}

function Read-PlaybotHarnessArgs {
  $path = Get-PlaybotHarnessArgsPath
  if (-not (Test-Path $path)) {
    return @{
      persona = 'mixed_ref'
      days = 0
      stage = 1
      liveMs = 120
      seed = 0
      untilWall = ''
      fast = $false
    }
  }
  try {
    return (Get-Content $path -Raw -Encoding utf8 | ConvertFrom-Json)
  } catch {
    return @{
      persona = 'mixed_ref'
      days = 0
      stage = 1
      liveMs = 120
      seed = 0
      untilWall = ''
      fast = $false
    }
  }
}

function Read-PlaybotSharedText([string]$path) {
  if (-not $path -or -not (Test-Path $path)) { return $null }
  $fs = $null
  $sr = $null
  try {
    $fs = [System.IO.File]::Open($path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    $sr = New-Object System.IO.StreamReader($fs, [System.Text.Encoding]::UTF8, $true)
    return $sr.ReadToEnd()
  } catch {
    return $null
  } finally {
    if ($sr) { $sr.Dispose() }
    if ($fs) { $fs.Dispose() }
  }
}

function Get-PlaybotMudLatestPath {
  return (Join-Path (Get-PlaybotLogDir) 'PLAYBOT_MUD_LATEST.txt')
}

function Ensure-PlaybotNative {
  if ('ArcfirePlaybotNative' -as [type]) { return }
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ArcfirePlaybotNative {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
  public static void Focus(int pid) {
    var p = System.Diagnostics.Process.GetProcessById(pid);
    if (p.MainWindowHandle == IntPtr.Zero) return;
    ShowWindow(p.MainWindowHandle, 9);
    SetForegroundWindow(p.MainWindowHandle);
  }
  public static void Hide(int pid) {
    var p = System.Diagnostics.Process.GetProcessById(pid);
    if (p.MainWindowHandle == IntPtr.Zero) return;
    ShowWindow(p.MainWindowHandle, 0);
  }
}
'@
}

function Show-PlaybotWindowByPid([int]$id) {
  if ($id -le 0) { return }
  Ensure-PlaybotNative
  try { [ArcfirePlaybotNative]::Focus($id) } catch {}
}

function Hide-PlaybotWindowByPid([int]$id) {
  if ($id -le 0) { return }
  Ensure-PlaybotNative
  try { [ArcfirePlaybotNative]::Hide($id) } catch {}
}

function Hide-PlaybotHarnessWindows {
  try {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object {
        $_.CommandLine -and
        ($_.CommandLine -match 'play-bot-console[\\/]+run-harness\.ts')
      } |
      ForEach-Object { Hide-PlaybotWindowByPid ([int]$_.ProcessId) }
  } catch {}
}

function Get-PlaybotConsoleRestartLockPath {
  return (Join-Path (Get-PlaybotLogDir) 'PLAYBOT_CONSOLE_RESTARTING.flag')
}

function Restart-PlaybotConsoleWindowOnly {
  param(
    [string]$Persona = 'mixed_ref',
    [int]$Days = 0,
    [int]$Stage = 1,
    [int]$LiveMs = 120,
    [int]$Seed = 0,
    [string]$UntilWall = '',
    [switch]$Fast
  )
  Set-Content -Path (Get-PlaybotConsoleRestartLockPath) -Value ("at=" + (Get-Date).ToString('o')) -Encoding utf8
  try {
    $cid = Read-PlaybotPid 'playbot-console.pid'
    Stop-PlaybotPidTree $cid
    Remove-Item (Join-Path (Get-PlaybotLogDir) 'playbot-console.pid') -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 400
    return (Start-PlaybotConsoleWindow -Persona $Persona -Days $Days -Stage $Stage -LiveMs $LiveMs -Seed $Seed -UntilWall $UntilWall -Fast:$Fast)
  } finally {
    Remove-Item (Get-PlaybotConsoleRestartLockPath) -Force -ErrorAction SilentlyContinue
  }
}

function Test-PlaybotProcAlive([int]$id) {
  if ($id -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $id -ErrorAction SilentlyContinue) } catch { return $false }
}

function Read-PlaybotPid([string]$name) {
  $path = Join-Path (Get-PlaybotLogDir) $name
  if (-not (Test-Path $path)) { return 0 }
  $id = 0
  [void][int]::TryParse((Get-Content $path -Raw -ErrorAction SilentlyContinue).Trim(), [ref]$id)
  return $id
}

function Write-PlaybotPid([string]$name, [int]$id) {
  Set-Content -Path (Join-Path (Get-PlaybotLogDir) $name) -Value $id -Encoding ascii
}

function Stop-PlaybotPidTree([int]$id) {
  if ($id -le 0) { return }
  & taskkill.exe /F /T /PID $id 2>$null | Out-Null
  Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
}

function Stop-PlaybotHarnessByCommandLine {
  try {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object {
        $_.CommandLine -and
        ($_.CommandLine -match 'play-bot-console[\\/]+run-harness\.ts')
      } |
      ForEach-Object { Stop-PlaybotPidTree ([int]$_.ProcessId) }
  } catch {}
}

function Clear-PlaybotRecordingFlag {
  $flag = Join-Path (Get-PlaybotLogDir) 'PLAYBOT_RECORDING.flag'
  $stamp = Join-Path (Get-PlaybotLogDir) 'PLAYBOT_RECORDING_STOPPED.txt'
  Remove-Item $flag -Force -ErrorAction SilentlyContinue
  Set-Content -Path $stamp -Value ("stoppedAt=" + (Get-Date).ToString('o')) -Encoding utf8
}

function Stop-PlaybotRecordingSession {
  Stop-PlaybotPidTree (Read-PlaybotPid 'playbot-harness.pid')
  Stop-PlaybotHarnessByCommandLine
  Clear-PlaybotRecordingFlag
  Remove-Item (Join-Path (Get-PlaybotLogDir) 'playbot-harness.pid') -Force -ErrorAction SilentlyContinue
}

function Get-PlaybotHarnessCmdLine {
  param(
    [string]$Persona = 'mixed_ref',
    [int]$Days = 0,
    [int]$Stage = 1,
    [int]$LiveMs = 120,
    [int]$Seed = 0,
    [string]$UntilWall = '',
    [switch]$Fast
  )
  $harness = Join-Path $script:PlaybotToolRoot 'run-harness.ts'
  if (-not $UntilWall) { $UntilWall = Get-PlaybotNextUntilWall }
  $liveArg = if ($Fast) { '' } else { ' --live' }
  $seedArg = if ($Seed -gt 0) { " --seed $Seed" } else { '' }
  $daysArg = if ($Days -le 0) { ' --until-close' } else { " --days $Days" }
  $wallArg = " --until-wall $UntilWall"
  return "chcp 65001>nul & npx tsx `"$harness`" --persona $Persona$daysArg --stage $Stage --live-ms $LiveMs$liveArg$seedArg$wallArg --console-session"
}

function Get-PlaybotLiveHarnessPid {
  $alive = Read-PlaybotPid 'playbot-harness.pid'
  if (Test-PlaybotProcAlive $alive) { return $alive }
  try {
    $hit = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object {
        $_.CommandLine -and
        $_.Name -eq 'cmd.exe' -and
        ($_.CommandLine -match 'npx tsx') -and
        ($_.CommandLine -match 'play-bot-console[\\/]+run-harness\.ts')
      } |
      Sort-Object ProcessId |
      Select-Object -First 1
    if ($hit -and $hit.ProcessId) {
      Write-PlaybotPid 'playbot-harness.pid' ([int]$hit.ProcessId)
      return [int]$hit.ProcessId
    }
  } catch {}
  return 0
}

function Start-PlaybotHarnessDetached {
  param(
    [string]$Persona = 'mixed_ref',
    [int]$Days = 0,
    [int]$Stage = 1,
    [int]$LiveMs = 120,
    [int]$Seed = 0,
    [string]$UntilWall = '',
    [switch]$Fast
  )
  $alive = Get-PlaybotLiveHarnessPid
  if ($alive -gt 0) { return $alive }
  Save-PlaybotHarnessArgs -Persona $Persona -Days $Days -Stage $Stage -LiveMs $LiveMs -Seed $Seed -UntilWall $UntilWall -Fast:$Fast
  $cmdLine = Get-PlaybotHarnessCmdLine -Persona $Persona -Days $Days -Stage $Stage -LiveMs $LiveMs -Seed $Seed -UntilWall $UntilWall -Fast:$Fast
  # Start-Process 로 띄우면 가시 콘솔의 자식이 되어, 창 재시작 때 기록까지 죽는다.
  # WMI Create + ShowWindow=0 으로 부모를 끊고 창은 숨긴다.
  $full = 'cmd.exe /d /c ' + $cmdLine
  try {
    $startup = New-CimInstance -CimClass (Get-CimClass Win32_ProcessStartup) -ClientOnly -Property @{ ShowWindow = [uint16]0 }
    $created = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
      CommandLine = $full
      CurrentDirectory = $script:PlaybotRepoRoot
      ProcessStartupInformation = $startup
    }
    if ($created -and [int]$created.ReturnValue -eq 0 -and [int]$created.ProcessId -gt 0) {
      Write-PlaybotPid 'playbot-harness.pid' ([int]$created.ProcessId)
      Hide-PlaybotWindowByPid ([int]$created.ProcessId)
      return [int]$created.ProcessId
    }
  } catch {}
  $p = Start-Process -FilePath 'cmd.exe' -WorkingDirectory $script:PlaybotRepoRoot -WindowStyle Hidden -PassThru -ArgumentList @(
    '/d', '/c', $cmdLine
  )
  if (-not $p -or -not $p.Id) { return 0 }
  Write-PlaybotPid 'playbot-harness.pid' $p.Id
  return $p.Id
}

function Resume-PlaybotHarnessFromSavedArgs {
  $a = Read-PlaybotHarnessArgs
  $fast = [bool]($a.fast)
  return (Start-PlaybotHarnessDetached -Persona ([string]$a.persona) -Days ([int]$a.days) -Stage ([int]$a.stage) -LiveMs ([int]$a.liveMs) -Seed ([int]$a.seed) -UntilWall ([string]$a.untilWall) -Fast:$fast)
}

function Start-PlaybotConsoleWindow {
  param(
    [string]$Persona = 'mixed_ref',
    [int]$Days = 0,
    [int]$Stage = 1,
    [int]$LiveMs = 120,
    [int]$Seed = 0,
    [string]$UntilWall = '',
    [switch]$Fast
  )
  $alive = Read-PlaybotPid 'playbot-console.pid'
  if (Test-PlaybotProcAlive $alive) { return $alive }
  $hostPs1 = Join-Path $script:PlaybotToolRoot 'host-playbot-console.ps1'
  $psExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
  $conhost = Join-Path $env:SystemRoot 'System32\conhost.exe'
  $hostArgs = @(
    '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', $hostPs1,
    '-Persona', $Persona,
    '-Days', "$Days",
    '-Stage', "$Stage",
    '-LiveMs', "$LiveMs",
    '-Seed', "$Seed",
    '-UntilWall', $UntilWall
  )
  if ($Fast) { $hostArgs += '-Fast' }
  if (Test-Path $conhost) {
    $console = Start-Process -WindowStyle Normal -PassThru -FilePath $conhost -ArgumentList (@('--', $psExe) + $hostArgs)
  } else {
    $console = Start-Process -WindowStyle Normal -PassThru -FilePath $psExe -ArgumentList $hostArgs
  }
  if (-not $console -or -not $console.Id) { return 0 }
  Write-PlaybotPid 'playbot-console.pid' $console.Id
  return $console.Id
}

function Get-PlaybotCurrentMudLog {
  $ptr = Join-Path (Get-PlaybotLogDir) 'PLAYBOT_CURRENT_RUN.txt'
  if (Test-Path $ptr) {
    $runId = (Get-Content $ptr -Raw -ErrorAction SilentlyContinue).Trim()
    if ($runId) {
      $mud = Join-Path $script:PlaybotToolRoot (Join-Path 'runs' (Join-Path $runId 'mud.log'))
      if (Test-Path $mud) { return $mud }
    }
  }
  $runs = Join-Path $script:PlaybotToolRoot 'runs'
  $latest = Get-ChildItem -Path $runs -Filter 'mud.log' -Recurse -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($latest) { return $latest.FullName }
  return ''
}

function Stop-PlaybotAll {
  Set-PlaybotExplicitStop
  $consoleId = Read-PlaybotPid 'playbot-console.pid'
  $watchId = Read-PlaybotPid 'playbot-watch.pid'
  Stop-PlaybotRecordingSession
  Stop-PlaybotPidTree $watchId
  Stop-PlaybotPidTree $consoleId
  Remove-Item (Join-Path (Get-PlaybotLogDir) 'playbot-watch.pid') -Force -ErrorAction SilentlyContinue
  Remove-Item (Join-Path (Get-PlaybotLogDir) 'playbot-console.pid') -Force -ErrorAction SilentlyContinue
}
