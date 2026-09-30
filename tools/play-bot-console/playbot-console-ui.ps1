# 플레이봇 가시 콘솔 — UTF-8 + 한글 고정폭. 앱/세이브 미접촉.
# PS 5.1은 본 파일을 UTF-8 BOM으로 저장해야 한글 리터럴이 안 깨진다.

function Initialize-PlaybotConsoleUi {
  try { chcp 65001 | Out-Null } catch {}
  try {
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [Console]::OutputEncoding = $utf8
    [Console]::InputEncoding = $utf8
    $global:OutputEncoding = $utf8
  } catch {}

  if (-not ('Arcfire.Playbot.ConsoleFont' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
namespace Arcfire.Playbot {
  [StructLayout(LayoutKind.Sequential)]
  public struct Coord { public short X; public short Y; }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct ConsoleFontInfoEx {
    public uint cbSize;
    public uint nFont;
    public Coord dwFontSize;
    public int FontFamily;
    public int FontWeight;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
    public string FaceName;
  }
  public static class ConsoleFont {
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern IntPtr GetStdHandle(int nStdHandle);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool SetCurrentConsoleFontEx(IntPtr h, bool max, ref ConsoleFontInfoEx info);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool GetCurrentConsoleFontEx(IntPtr h, bool max, ref ConsoleFontInfoEx info);
    public static bool TrySet(string face, short height) {
      IntPtr h = GetStdHandle(-11);
      if (h == IntPtr.Zero || h == new IntPtr(-1)) return false;
      ConsoleFontInfoEx info = new ConsoleFontInfoEx();
      info.cbSize = (uint)Marshal.SizeOf(typeof(ConsoleFontInfoEx));
      info.dwFontSize.Y = height;
      info.FontFamily = 54;
      info.FontWeight = 400;
      info.FaceName = face;
      if (!SetCurrentConsoleFontEx(h, false, ref info)) return false;
      ConsoleFontInfoEx read = new ConsoleFontInfoEx();
      read.cbSize = info.cbSize;
      if (!GetCurrentConsoleFontEx(h, false, ref read) || read.FaceName == null) return false;
      return read.FaceName.StartsWith(face, StringComparison.OrdinalIgnoreCase);
    }
  }
}
'@
  }

  foreach ($face in @('D2Coding', 'D2Coding ligature', 'GulimChe', 'DotumChe', 'BatangChe', 'NSimSun')) {
    try {
      if ([Arcfire.Playbot.ConsoleFont]::TrySet($face, 18)) { break }
    } catch {}
  }

  try {
    $ui = $Host.UI.RawUI
    $ui.WindowTitle = 'Arcfire 플레이봇콘솔'
    $buf = $ui.BufferSize
    if ($buf.Width -lt 120) { $buf.Width = 120 }
    if ($buf.Height -lt 3000) { $buf.Height = 3000 }
    $ui.BufferSize = $buf
    $win = $ui.WindowSize
    if ($win.Width -lt 120 -and $buf.Width -ge 120) { $win.Width = [Math]::Min(120, $buf.Width) }
    if ($win.Height -lt 36 -and $buf.Height -ge 36) { $win.Height = [Math]::Min(36, $buf.Height) }
    $ui.WindowSize = $win
  } catch {}
}
