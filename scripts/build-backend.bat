@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem --- Resolve repo root based on this script location (scripts/..)
for %%I in ("%~dp0..") do set "REPO_SOURCE=%%~fI"
pushd "%REPO_SOURCE%" || goto :fail

rmdir /s /q "%REPO_SOURCE%\build" 2>nul
rmdir /s /q "%REPO_SOURCE%\dist" 2>nul
del /q "%REPO_SOURCE%\backend.spec" 2>nul

if not exist "backend\.venv\Scripts\activate.bat" (
  echo.
  echo [ERROR] Python venv not found at backend\.venv
  echo Create it and install requirements, then re-run.
  goto :fail
)

call "backend\.venv\Scripts\activate.bat" || goto :fail
python -m PyInstaller --onefile --name backend --clean --hidden-import=backend --hidden-import=backend.state --hidden-import=backend.llm --hidden-import=backend.csv_handler --hidden-import=backend.metadata --hidden-import=backend.analysis --hidden-import=backend.commands backend\main.py || goto :fail

mkdir "src-tauri\bin" 2>nul
copy /y "dist\backend.exe" "src-tauri\bin\backend-x86_64-pc-windows-msvc.exe" || goto :fail

echo.
echo [SUCCESS] Backend sidecar copied to src-tauri/bin/backend-x86_64-pc-windows-msvc.exe
popd
endlocal
exit /b 0

:fail
echo.
echo [FAILED] Backend sidecar build did not complete.
popd 2>nul
endlocal
exit /b 1