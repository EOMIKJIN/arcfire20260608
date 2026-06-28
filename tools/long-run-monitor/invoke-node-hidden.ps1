# Node — 콘솔 창 없이 실행 (워치독 5분 주기 깜빡임 방지)
function Format-NodeArgumentList {
  param([string[]]$ArgumentValues)
  ($ArgumentValues | ForEach-Object {
    if ($null -eq $_) { return '""' }
    $s = [string]$_
    if ($s -match '[\s"]') {
      '"' + ($s.Replace('"', '\"')) + '"'
    } else {
      $s
    }
  }) -join ' '
}

function Invoke-NodeHidden {
  param(
    [Parameter(Mandatory = $true)][string]$ScriptPath,
    [string[]]$NodeArgs = @(),
    [switch]$CaptureOutput
  )

  $hiddenVbs = Join-Path $PSScriptRoot 'run-node-hidden.vbs'
  $node = (Get-Command node -ErrorAction SilentlyContinue).Source
  if (-not $node) { return @() }

  $argList = @($ScriptPath) + $NodeArgs

  if ($CaptureOutput) {
    $outFile = Join-Path $env:TEMP ("arc-node-out-$([guid]::NewGuid().ToString('N')).txt")
    $errFile = "$outFile.err"
    try {
      $psi = New-Object System.Diagnostics.ProcessStartInfo
      $psi.FileName = $node
      $psi.Arguments = Format-NodeArgumentList -ArgumentValues $argList
      $psi.CreateNoWindow = $true
      $psi.UseShellExecute = $false
      $psi.RedirectStandardOutput = $true
      $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
      $proc = New-Object System.Diagnostics.Process
      $proc.StartInfo = $psi
      [void]$proc.Start()
      $stdout = $proc.StandardOutput.ReadToEnd()
      if (-not $proc.WaitForExit(120000)) {
        try { $proc.Kill() } catch { }
        throw 'Invoke-NodeHidden timeout (120s)'
      }
      $script:LASTEXITCODE = $proc.ExitCode
      $lines = @()
      if ($stdout) { $lines += @($stdout -split "`r?`n" | Where-Object { $_ -ne '' }) }
      return $lines
    } finally {
      Remove-Item $outFile -Force -ErrorAction SilentlyContinue
      Remove-Item $errFile -Force -ErrorAction SilentlyContinue
    }
  }

  if (-not (Test-Path $hiddenVbs)) {
    return @()
  }

  $vbsArgs = @($node, $ScriptPath) + $NodeArgs
  & wscript.exe //B $hiddenVbs @vbsArgs
  return @()
}
