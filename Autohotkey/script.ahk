; Start Photoshop
if WinExist("ahk_class Photoshop") {
  WinActivate
} else {
  ; Will have issues with trial version of Photoshop
  Run "C:\Program Files (x86)\Adobe\Adobe Photoshop CS6\Photoshop.exe"
  WinWait, ahk_class Photoshop
}

; Load the extension
Run "C:\Users\Gaurav\Desktop\PSD2JSON.jsx"

; Wait for script to load
Sleep, 2000

; Wait till all the documents are closed and then exit
WinWait, Adobe Photoshop CS6 Extended
Exit
