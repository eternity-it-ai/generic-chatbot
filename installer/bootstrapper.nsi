OutFile "${OUTFILE}"
RequestExecutionLevel user
Unicode True

Var AppDataDir
Var BrandingJsonPath
Var TempInstaller

Section "Install"
  ; 1) Write branding.json to %APPDATA%\eternity-ai\
  StrCpy $AppDataDir "$APPDATA\eternity-ai"
  CreateDirectory "$AppDataDir"
  StrCpy $BrandingJsonPath "$AppDataDir\branding.json"

  FileOpen $0 "$BrandingJsonPath" w
  FileWrite $0 '${BRANDING_JSON}'
  FileClose $0

  ; 2) Download base installer
  StrCpy $TempInstaller "$TEMP\eternity-ai-base-installer.exe"
  NSISdl::download /TIMEOUT=30000 "${BASE_INSTALLER_URL}" "$TempInstaller"
  Pop $1
  StrCmp $1 "success" +2
    Abort "Failed to download base installer: $1"

  ; 3) Run base installer
  ExecWait '"$TempInstaller"'
SectionEnd
