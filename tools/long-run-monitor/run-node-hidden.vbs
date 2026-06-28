' Arcfire — node/cjs 완전 숨김 실행 (Task Scheduler 콘솔 깜빡임 방지)
' Usage: wscript.exe //B run-node-hidden.vbs "C:\path\node.exe" "C:\path\script.cjs" [--args...]
Option Explicit

Dim sh, fso, cmd, i, ensurePath
Set sh = CreateObject("Wscript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

If WScript.Arguments.Count < 2 Then
  WScript.Quit 1
End If

cmd = Quote(WScript.Arguments(0))
For i = 1 To WScript.Arguments.Count - 1
  cmd = cmd & " " & Quote(WScript.Arguments(i))
Next

ensurePath = WScript.Arguments(1)
If fso.FileExists(ensurePath) Then
  sh.CurrentDirectory = fso.GetParentFolderName(fso.GetParentFolderName(fso.GetParentFolderName(ensurePath)))
End If

' 0 = hidden window, False = don't wait
sh.Run cmd, 0, False

Function Quote(ByVal s)
  Quote = """" & Replace(s, """", """""") & """"
End Function
