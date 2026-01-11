@echo off
setlocal

rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul
del /q backend.spec 2>nul

call backend\.venv\Scripts\activate
pyinstaller --onefile --name backend --clean backend\main.py

mkdir src-tauri\bin 2>nul
copy /y dist\backend.exe src-tauri\bin\backend-x86_64-pc-windows-msvc.exe

echo.
echo [SUCCESS] Backend sidecar copied to src-tauri/bin/backend-x86_64-pc-windows-msvc.exe

endlocal