@echo off
setlocal

rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul
del /q backend.spec 2>nul

call backend\.venv\Scripts\activate
pyinstaller --onefile --name backend --clean backend\main.py

endlocal