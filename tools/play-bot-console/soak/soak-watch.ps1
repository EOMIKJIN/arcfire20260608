# 장시간 체류(소크) 감시 — 김플레이 · 2026-10-09
# 60초마다 meminfo 한 줄을 CSV로 남긴다. logcat 전체를 파일로 상시 캡처한다(기기 버퍼 소실 방지).
# views 가 바뀌거나 PSS/GL 이 임계를 넘거나 Native PSS 가 한 샘플에 크게 뛰면
# 즉시 스크린샷 · meminfo · gfxinfo 스냅샷을 남기고 alerts.log 에 한 줄 쓴다.
# 프로세스가 사라지면 exit-info 를 저장한다. adb 가 끊겨도 감시는 멈추지 않는다(무선 adb).
#
# 사용: powershell -File tools/play-bot-console/soak/soak-watch.ps1 -Minutes 420
param(
  [int]$IntervalSec = 60,
  [int]$Minutes = 420,
  [double]$PssAlertMb = 900,
  [double]$GlAlertMb = 200,
  [double]$NativeJumpMb = 40,
  # 허브는 오버레이·드론으로 views 가 ±20 정도 흔들린다 → 이보다 큰 변화만 스냅샷(화면 전환 · 2026-10-09 04:18 같은 이벤트)
  [int]$ViewsJump = 30,
  [string]$Tag = (Get-Date -Format 'yyyyMMdd-HHmm')
)

$pkg = 'com.arcfire.online'
$dir = Join-Path $PSScriptRoot "..\logs\soak\$Tag"
New-Item -ItemType Directory -Force $dir | Out-Null
$csv = Join-Path $dir 'mem.csv'
$alerts = Join-Path $dir 'alerts.log'

'time,pid,pss_mb,swap_pss_mb,gl_mb,egl_mb,native_pss_mb,native_alloc_mb,dalvik_mb,unknown_mb,bitmap_malloced_mb,views' |
  Out-File -Encoding utf8 $csv

function Write-Alert($text) {
  "$(Get-Date -Format s) $text" | Out-File -Append -Encoding utf8 $alerts
}

$logcatIndex = 0
function Start-Logcat {
  $script:logcatIndex += 1
  $file = Join-Path $dir "logcat-full-$($script:logcatIndex).txt"
  return Start-Process -FilePath adb -ArgumentList 'logcat -T 1 -v time' -RedirectStandardOutput $file -NoNewWindow -PassThru
}
$logcat = Start-Logcat

# 표 행 하나를 찾아 공백으로 나눈다. 없으면 $null.
function Get-Fields($m, $re) {
  $l = $m | Select-String -Pattern $re | Select-Object -First 1
  if (-not $l) { return $null }
  return "$($l.Line)".Trim() -split '\s+'
}

function Get-Mb($fields, $idx) {
  if (-not $fields -or $fields.Count -le $idx) { return $null }
  return [math]::Round([double]$fields[$idx] / 1024, 1)
}

function Save-Snapshot($reason) {
  $stamp = Get-Date -Format 'HHmmss'
  $base = Join-Path $dir "snap-$stamp"
  adb shell dumpsys meminfo $pkg | Out-File -Encoding utf8 "$base-meminfo.txt"
  adb shell dumpsys gfxinfo $pkg | Out-File -Encoding utf8 "$base-gfxinfo.txt"
  # 바이너리 파이프(exec-out >)는 스크립트 실행 환경에서 파일이 안 생기거나 깨진다 → 기기에 저장 후 pull
  adb shell screencap -p /sdcard/arcfire-soak-snap.png | Out-Null
  adb pull /sdcard/arcfire-soak-snap.png "$base-screen.png" | Out-Null
  adb shell rm /sdcard/arcfire-soak-snap.png | Out-Null
  Write-Alert "$reason -> snap-$stamp"
}

$prev = $null
$adbOffline = $false
$end = (Get-Date).AddMinutes($Minutes)
try {
  while ((Get-Date) -lt $end) {
    try {
      # 무선 adb 가 끊기면 adb 는 예외 없이 빈 출력만 낸다 → 프로세스 소멸로 오판하지 않게 먼저 연결 상태를 본다.
      # 끊긴 동안은 prev 를 유지하고 logcat 재시작도 하지 않는다.
      $state = "$(adb get-state 2>$null)".Trim()
      if ($state -ne 'device') {
        if (-not $adbOffline) { Write-Alert "ADB_OFFLINE state=$state" }
        $adbOffline = $true
        "$(Get-Date -Format 'HH:mm:ss'),,,,,,,,,,," | Out-File -Append -Encoding utf8 $csv
        Start-Sleep $IntervalSec
        continue
      }
      if ($adbOffline) {
        Write-Alert 'ADB_RECONNECTED'
        $adbOffline = $false
      }

      if ($logcat.HasExited) {
        $logcat = Start-Logcat
        Write-Alert "LOGCAT_RESTARTED -> logcat-full-$logcatIndex.txt"
      }

      $t = Get-Date -Format 'HH:mm:ss'
      $procId = "$(adb shell pidof $pkg)".Trim()
      if (-not $procId) {
        "$t,,,,,,,,,,," | Out-File -Append -Encoding utf8 $csv
        if ($prev -and $prev.pid) {
          $stamp = Get-Date -Format 'HHmmss'
          adb shell dumpsys activity exit-info $pkg | Out-File -Encoding utf8 (Join-Path $dir "snap-$stamp-exit-info.txt")
          Write-Alert "PROCESS_GONE pid=$($prev.pid) -> snap-$stamp-exit-info.txt"
        }
        $prev = @{ pid = '' }
        Start-Sleep $IntervalSec
        continue
      }

      $m = adb shell dumpsys meminfo $pkg
      $total = Get-Fields $m 'TOTAL PSS:'
      if (-not $total) {
        Write-Alert "MEMINFO_EMPTY pid=$procId (sample skipped)"
        Start-Sleep $IntervalSec
        continue
      }
      $nh = Get-Fields $m '^\s*Native Heap '
      $bm = Get-Fields $m 'Bitmap \(malloced\):'
      $vw = Get-Fields $m '^\s*Views:'
      $row = @{
        pid = $procId
        pss = Get-Mb $total 2
        swap = Get-Mb $total 9
        gl = Get-Mb (Get-Fields $m '^\s*GL mtrack') 2
        egl = Get-Mb (Get-Fields $m '^\s*EGL mtrack') 2
        nativePss = Get-Mb $nh 2
        nativeAlloc = Get-Mb $nh 8
        dalvik = Get-Mb (Get-Fields $m '^\s*Dalvik Heap ') 2
        unknown = Get-Mb (Get-Fields $m '^\s*Unknown ') 1
        bitmap = if ($bm) { Get-Mb $bm ($bm.Count - 1) } else { $null }
        views = if ($vw -and $vw.Count -gt 1) { $vw[1] } else { $null }
      }
      '{0},{1},{2},{3},{4},{5},{6},{7},{8},{9},{10},{11}' -f $t, $row.pid, $row.pss, $row.swap, $row.gl, $row.egl, $row.nativePss, $row.nativeAlloc, $row.dalvik, $row.unknown, $row.bitmap, $row.views |
        Out-File -Append -Encoding utf8 $csv

      $reasons = @()
      if ($prev -and $prev.pid -and $prev.pid -ne $row.pid) { $reasons += "PID_CHANGED $($prev.pid)->$($row.pid)" }
      if ($prev -and $prev.views -and $row.views -and [math]::Abs([int]$row.views - [int]$prev.views) -ge $ViewsJump) { $reasons += "VIEWS $($prev.views)->$($row.views)" }
      if ($row.pss -ge $PssAlertMb) { $reasons += "PSS $($row.pss)>=$PssAlertMb" }
      if ($row.gl -ge $GlAlertMb) { $reasons += "GL $($row.gl)>=$GlAlertMb" }
      if ($prev -and $prev.nativePss -and $row.nativePss -and ($row.nativePss - $prev.nativePss) -ge $NativeJumpMb) { $reasons += "NATIVE_JUMP $($prev.nativePss)->$($row.nativePss)" }
      # PSS · GL 임계는 넘는 순간 한 번만 스냅샷
      $pssAlready = $prev -and $prev.pss -ge $PssAlertMb
      $glAlready = $prev -and $prev.gl -ge $GlAlertMb
      $snapReasons = $reasons | Where-Object { -not (($_ -like 'PSS*' -and $pssAlready) -or ($_ -like 'GL*' -and $glAlready)) }
      if ($snapReasons) { Save-Snapshot ($snapReasons -join ' | ') }

      $prev = $row
    }
    catch {
      Write-Alert "ADB_ERROR $($_.Exception.Message)"
    }
    Start-Sleep $IntervalSec
  }
}
finally {
  if ($logcat -and -not $logcat.HasExited) { Stop-Process -Id $logcat.Id -ErrorAction SilentlyContinue }
}
