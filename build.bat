@echo off
@REM /// Need `pkg` (npm install -g pkg) and `7z` (install from "https://www.7-zip.org/")

@REM /// CHANGE VERSION HERE
SET version=%1

@REM /// clean old release (if any)
RMDIR /q /s build

@REM /// make build
CMD /c pkg.cmd src/index.js -t node18-win-x64
MD YTChatView
REN index.exe server.exe
MOVE server.exe YTChatView
XCOPY res YTChatView\res /i /s

MD build
MOVE YTChatView build
CD build

@REM /// compress to zip
CMD /c 7z a -tzip ytchatview_%version%_win64.zip YTChatView
