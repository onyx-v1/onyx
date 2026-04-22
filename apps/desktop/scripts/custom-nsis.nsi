; custom-nsis.nsi
; Runs during NSIS install/uninstall to ensure no ghost Onyx process is left behind.
;
; electron-builder picks this up via nsis.include in electron-builder.config.js

; Called before uninstallation begins
!macro customUnInit
  ; Gracefully ask Onyx to quit first, then force-kill after 2s if still running
  ExecWait 'taskkill /IM "Onyx.exe" /T'
  Sleep 2000
  ; Force kill any remaining process tree (handles stuck renderer/GPU processes)
  ExecWait 'taskkill /F /IM "Onyx.exe" /T'
  ExecWait 'taskkill /F /IM "Onyx Helper.exe" /T'
  ExecWait 'taskkill /F /IM "Onyx Helper (GPU).exe" /T'
  ExecWait 'taskkill /F /IM "Onyx Helper (Renderer).exe" /T'
!macroend

; Called before a fresh install (handles reinstall over existing installation)
!macro customInstallMode
  ; Kill any running instance before installing new files
  ExecWait 'taskkill /F /IM "Onyx.exe" /T'
  ExecWait 'taskkill /F /IM "Onyx Helper.exe" /T'
  ExecWait 'taskkill /F /IM "Onyx Helper (GPU).exe" /T'
  ExecWait 'taskkill /F /IM "Onyx Helper (Renderer).exe" /T'
  Sleep 1000
!macroend
