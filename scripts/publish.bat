@echo off
setlocal EnableExtensions DisableDelayedExpansion

rem ===================================================
rem publish.bat - Build + publish Tauri update assets
rem ===================================================

rem Resolve repo root based on this script location (scripts/..)
for %%I in ("%~dp0..") do set "REPO_SOURCE=%%~fI"

rem Versions repo location (can be overridden by env var)
if not defined REPO_VERSIONS set "REPO_VERSIONS=C:\Users\yotam\OneDrive\Documents\Work\Aman\EternityAi-Ai-Agent-versions"

rem ===================================================
rem Hardcoded signing password (requested)
rem NOTE: This is sensitive; anyone with repo access can see it.
set "PUBLISH_SIGNING_PASSWORD=MyNewPassword123"

pushd "%REPO_SOURCE%"
if errorlevel 1 goto :fail

call :ensure_cmd npm
if errorlevel 1 goto :fail
call :ensure_cmd powershell
if errorlevel 1 goto :fail

rem ---- Make common tool paths available (best-effort)
call :try_add_path "%USERPROFILE%\.cargo\bin"
call :try_add_path "%ProgramFiles%\Git\cmd"
call :try_add_path "%ProgramFiles(x86)%\Git\cmd"
call :try_add_path "%LocalAppData%\Programs\Git\cmd"

call :ensure_cmd cargo
if errorlevel 1 goto :fail_cargo
call :ensure_cmd git
if errorlevel 1 goto :fail_git

rem ---- Ensure versions repo exists
if not exist "%REPO_VERSIONS%\" goto :fail_versions_repo

rem ---- Signing key location for `tauri signer`
rem Canonical env var for `tauri signer` is TAURI_PRIVATE_KEY_PATH.
if defined TAURI_PRIVATE_KEY_PATH goto :signing_ok
if exist "%USERPROFILE%\.tauri\eternity.key" set "TAURI_PRIVATE_KEY_PATH=%USERPROFILE%\.tauri\eternity.key"
if exist "%USERPROFILE%\.tauri\eternity_v2.key" set "TAURI_PRIVATE_KEY_PATH=%USERPROFILE%\.tauri\eternity_v2.key"
if not defined TAURI_PRIVATE_KEY_PATH goto :fail_signing_key
:signing_ok
echo Using TAURI_PRIVATE_KEY_PATH from "%TAURI_PRIVATE_KEY_PATH%"

rem ---- Get version from src-tauri/tauri.conf.json
for /f "usebackq tokens=*" %%a in (`powershell -NoProfile -Command "(Get-Content 'src-tauri\\tauri.conf.json' | ConvertFrom-Json).version"`) do set "VERSION=%%a"
if not defined VERSION goto :fail_version

echo ===================================================
echo RELEASING ETERNITY-AI VERSION: v%VERSION%
echo ===================================================

rem ---- 1/4 Build backend sidecar
echo [1/4] Building Backend Sidecar...
rmdir /s /q "%REPO_SOURCE%\build" 2>nul
rmdir /s /q "%REPO_SOURCE%\dist" 2>nul

if not exist "backend\.venv\Scripts\activate.bat" goto :fail_venv
call "backend\.venv\Scripts\activate.bat"
if errorlevel 1 goto :fail

python -m PyInstaller --onefile --name backend --clean --hidden-import=backend --hidden-import=backend.state --hidden-import=backend.llm --hidden-import=backend.csv_handler --hidden-import=backend.metadata --hidden-import=backend.analysis --hidden-import=backend.commands backend\main.py
if errorlevel 1 goto :fail

mkdir "src-tauri\bin" 2>nul
copy /y "dist\backend.exe" "src-tauri\bin\backend-x86_64-pc-windows-msvc.exe"
if errorlevel 1 goto :fail

rem ---- 2/4 Build Tauri app (produces installer)
echo [2/4] Compiling and Signing Tauri App...
call npm run tauri -- build
if errorlevel 1 goto :fail

rem ---- 3/4 Prepare update assets
echo [3/4] Preparing update assets...
set "RELEASE_DIR=%REPO_SOURCE%\src-tauri\target\release\bundle\nsis"
set "INSTALLER=%RELEASE_DIR%\eternity-ai_%VERSION%_x64-setup.exe"
set "LATEST_UPDATE_EXE=%REPO_VERSIONS%\update.exe"
set "LATEST_INSTALLER=%REPO_VERSIONS%\EternityAi_Setup.exe"
set "LATEST_UPDATE_JSON=%REPO_VERSIONS%\update.json"

set "RELEASES_DIR=%REPO_VERSIONS%\releases"
set "VERSION_DIR=%RELEASES_DIR%\v%VERSION%"
set "VERSION_UPDATE_EXE=%VERSION_DIR%\update.exe"
set "VERSION_INSTALLER=%VERSION_DIR%\EternityAi_Setup.exe"
set "VERSION_UPDATE_JSON=%VERSION_DIR%\update.json"

if not exist "%INSTALLER%" goto :fail_missing_installer

mkdir "%RELEASES_DIR%" 2>nul
mkdir "%VERSION_DIR%" 2>nul

rem Keep per-version copies
copy /y "%INSTALLER%" "%VERSION_INSTALLER%"
if errorlevel 1 goto :fail
copy /y "%INSTALLER%" "%VERSION_UPDATE_EXE%"
if errorlevel 1 goto :fail

rem Update latest pointers at repo root
copy /y "%INSTALLER%" "%LATEST_INSTALLER%"
if errorlevel 1 goto :fail
copy /y "%INSTALLER%" "%LATEST_UPDATE_EXE%"
if errorlevel 1 goto :fail

rem Sign update.exe (latest).
rem IMPORTANT: If the key is password-protected, set TAURI_PRIVATE_KEY_PASSWORD in the environment *before* running publish.bat.
set "TAURI_PRIVATE_KEY_PASSWORD=%PUBLISH_SIGNING_PASSWORD%"
echo Using signing password from PUBLISH_SIGNING_PASSWORD

set "SIG="
set "SIG_FILE=%TEMP%\tauri_update_sig_%RANDOM%%RANDOM%.txt"
del /q "%SIG_FILE%" 2>nul
npx tauri signer sign -f "%TAURI_PRIVATE_KEY_PATH%" "%LATEST_UPDATE_EXE%" > "%SIG_FILE%"
if errorlevel 1 goto :fail_sign
rem Prefer reading the generated .sig file (more reliable than parsing stdout)
if exist "%LATEST_UPDATE_EXE%.sig" (
  set /p "SIG="<"%LATEST_UPDATE_EXE%.sig"
) else (
  set /p "SIG="<"%SIG_FILE%"
)
del /q "%SIG_FILE%" 2>nul
if not defined SIG goto :fail_sign

rem Archive signature file if it was created
if exist "%LATEST_UPDATE_EXE%.sig" (
  copy /y "%LATEST_UPDATE_EXE%.sig" "%VERSION_DIR%\update.exe.sig" >nul
)

rem Write update.json (latest)
> "%LATEST_UPDATE_JSON%" echo {
>> "%LATEST_UPDATE_JSON%" echo   "version": "v%VERSION%",
>> "%LATEST_UPDATE_JSON%" echo   "notes": "Manual release of v%VERSION%",
>> "%LATEST_UPDATE_JSON%" echo   "platforms": {
>> "%LATEST_UPDATE_JSON%" echo     "windows-x86_64": {
>> "%LATEST_UPDATE_JSON%" echo       "signature": "%SIG%",
>> "%LATEST_UPDATE_JSON%" echo       "url": "https://raw.githubusercontent.com/yotam-aman/EternityAi-Ai-Agent-versions/main/update.exe"
>> "%LATEST_UPDATE_JSON%" echo     }
>> "%LATEST_UPDATE_JSON%" echo   }
>> "%LATEST_UPDATE_JSON%" echo }

rem Write update.json (archived per-version)
> "%VERSION_UPDATE_JSON%" echo {
>> "%VERSION_UPDATE_JSON%" echo   "version": "v%VERSION%",
>> "%VERSION_UPDATE_JSON%" echo   "notes": "Manual release of v%VERSION%",
>> "%VERSION_UPDATE_JSON%" echo   "platforms": {
>> "%VERSION_UPDATE_JSON%" echo     "windows-x86_64": {
>> "%VERSION_UPDATE_JSON%" echo       "signature": "%SIG%",
>> "%VERSION_UPDATE_JSON%" echo       "url": "https://raw.githubusercontent.com/yotam-aman/EternityAi-Ai-Agent-versions/main/releases/v%VERSION%/update.exe"
>> "%VERSION_UPDATE_JSON%" echo     }
>> "%VERSION_UPDATE_JSON%" echo   }
>> "%VERSION_UPDATE_JSON%" echo }

rem ---- 4/4 Push to versions repo
echo [4/4] Pushing to GitHub Versions Repo...
pushd "%REPO_VERSIONS%"
if errorlevel 1 goto :fail

git add .
if errorlevel 1 goto :fail

git diff --cached --quiet
if errorlevel 1 git commit -m "Release v%VERSION%"

git push origin main
if errorlevel 1 goto :fail

popd

echo ===================================================
echo SUCCESS: v%VERSION% is now live for all users.
echo ===================================================
popd
pause
exit /b 0

:fail_cargo
echo.
echo [ERROR] Rust toolchain (cargo) not found.
echo Install Rust via rustup, then re-run this script.
echo Suggested: winget install Rustlang.Rustup
goto :fail

:fail_git
echo.
echo [ERROR] Git not found.
echo Install Git for Windows, then re-run this script.
echo Suggested: winget install Git.Git
goto :fail

:fail_versions_repo
echo.
echo [ERROR] Versions repo not found: "%REPO_VERSIONS%"
goto :fail

:fail_signing_key
echo.
echo [ERROR] TAURI_PRIVATE_KEY_PATH not set and default key not found.
echo Expected default key at: "%USERPROFILE%\.tauri\eternity.key"
echo Set TAURI_PRIVATE_KEY_PATH (and TAURI_PRIVATE_KEY_PASSWORD if needed) then re-run.
goto :fail

:fail_version
echo.
echo [ERROR] Failed to read version from src-tauri\tauri.conf.json
goto :fail

:fail_venv
echo.
echo [ERROR] Python venv not found at backend\.venv
echo Create it and install requirements, then re-run.
goto :fail

:fail_missing_installer
echo.
echo [ERROR] Missing installer: "%INSTALLER%"
goto :fail

:fail_sign
echo.
echo [ERROR] Failed to sign update artifact: "%LATEST_UPDATE_EXE%"
echo Ensure your private key is valid and TAURI_PRIVATE_KEY_PASSWORD is set correctly (if the key is encrypted).
goto :fail

:fail
echo ===================================================
echo FAILED: release v%VERSION% did not complete.
echo ===================================================
popd 2>nul
pause
exit /b 1

:ensure_cmd
where %~1 >nul 2>nul
exit /b %errorlevel%

:try_add_path
if exist "%~1\" set "PATH=%~1;%PATH%"
exit /b 0
