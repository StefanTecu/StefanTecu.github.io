@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Football Betting Career - Setup Menu (v0.6)

REM ==========================================================
REM Football Betting Career (v0.6) - Menu Installer/Launcher
REM Keep this .bat next to:
REM   BettingOnFixtures-0.6.jar
REM
REM Uses:
REM  - winget to install Java (if missing)
REM  - curl + tar to download/extract JavaFX (avoids PowerShell quoting issues)
REM ==========================================================

set "APP_NAME=Football Betting Career"
set "APP_VER=0.6"
set "APP_JAR=BettingOnFixtures-0.6.jar"
set "MAIN_CLASS=app.MainApp"

set "JFX_VER=21.0.9"
set "JFX_ZIP=openjfx-%JFX_VER%_windows-x64_bin-sdk.zip"
set "JFX_URL=https://download2.gluonhq.com/openjfx/%JFX_VER%/%JFX_ZIP%"

set "HERE=%~dp0"
if "%HERE:~-1%"=="\" set "HERE=%HERE:~0,-1%"

set "JAR_PATH=%HERE%\%APP_JAR%"
set "JFX_HOME=%HERE%\javafx-sdk-%JFX_VER%"
set "JFX_LIB=%JFX_HOME%\lib"

set "LOG=%HERE%\FootballBettingCareer_launcher.log"
call :log_header "Menu started"

if /i "%~1"=="--launch" goto :LAUNCH

goto :MENU


:MENU
cls
echo ==========================================================
echo   %APP_NAME% (v%APP_VER%)
echo   Folder: %HERE%
echo ==========================================================
echo.
echo  [1] Check Java / JavaFX status
echo  [2] Install or Repair Java / JavaFX
echo  [3] Install the game (create shortcuts)
echo  [4] Launch the game
echo.
echo  [Q] Quit
echo.
set /p "CHOICE=Choose an option: "

if /i "%CHOICE%"=="1" goto :CHECK_STATUS
if /i "%CHOICE%"=="2" goto :INSTALL_RUNTIME
if /i "%CHOICE%"=="3" goto :INSTALL_GAME
if /i "%CHOICE%"=="4" goto :LAUNCH
if /i "%CHOICE%"=="Q" goto :END

echo Invalid option.
timeout /t 2 >nul
goto :MENU


:CHECK_STATUS
cls
call :log_header "Option 1 - Check status"
echo ===================== STATUS CHECK ======================
echo.

call :CheckJar
call :DetectJava
call :DetectJavaFX

echo.
echo Log: %LOG%
pause
goto :MENU


:INSTALL_RUNTIME
cls
call :log_header "Option 2 - Install/Repair Java/JavaFX"
echo ============== INSTALL / REPAIR JAVA + JAVAFX ===========
echo.

call :CheckJar
if errorlevel 1 (
  echo Fix the jar placement and try again.
  echo Log: %LOG%
  pause
  goto :MENU
)

call :DetectJava
if not defined JAVA_EXE (
  call :InstallJavaWinget
  if errorlevel 1 (
    echo Java install failed. See log.
    echo Log: %LOG%
    pause
    goto :MENU
  )
  call :DetectJava
)

if not defined JAVA_EXE (
  call :log "ERROR" "Java still not detected after install attempt."
  echo ERROR: Java still not detected. Try reboot.
  echo Log: %LOG%
  pause
  goto :MENU
)

call :DetectJavaFX
if errorlevel 1 (
  call :InstallJavaFX_CurlTar
  if errorlevel 1 (
    echo.
    echo JavaFX install failed. See log.
    echo Log: %LOG%
    pause
    goto :MENU
  )
)

call :DetectJavaFX
if errorlevel 1 (
  echo ERROR: JavaFX still missing after install.
  echo Log: %LOG%
  pause
  goto :MENU
)

echo.
echo Runtime ready: Java + JavaFX installed.
echo Log: %LOG%
pause
goto :MENU


:INSTALL_GAME
cls
call :log_header "Option 3 - Install game (shortcuts)"
echo ===================== INSTALL GAME ======================
echo.

call :CheckJar
if errorlevel 1 ( pause & goto :MENU )

call :DetectJava
call :DetectJavaFX

if not defined JAVA_EXE (
  echo Java not found. Run option [2] first.
  pause
  goto :MENU
)
if errorlevel 1 (
  echo JavaFX not found. Run option [2] first.
  pause
  goto :MENU
)

call :CreateShortcuts
if errorlevel 1 (
  echo Failed to create shortcuts. See log.
  echo Log: %LOG%
  pause
  goto :MENU
)

echo.
echo Installed shortcuts:
echo  - Desktop
echo  - Start Menu
echo Log: %LOG%
pause
goto :MENU


:LAUNCH
cls
call :log_header "Option 4 - Launch game"
echo ======================== LAUNCH =========================
echo.

call :CheckJar
if errorlevel 1 ( pause & goto :MENU )

call :DetectJava
if not defined JAVA_EXE (
  echo Java not found. Run option [2] first.
  pause
  goto :MENU
)

call :DetectJavaFX
if errorlevel 1 (
  echo JavaFX not found. Run option [2] first.
  pause
  goto :MENU
)

call :LaunchGame
echo.
echo Log: %LOG%
pause
goto :MENU


:END
call :log_header "Menu exited"
endlocal
exit /b 0


REM ==========================================================
REM LOG HELPERS
REM ==========================================================
:log_header
set "MSG=%~1"
>> "%LOG%" echo.
>> "%LOG%" echo ==========================================================
>> "%LOG%" echo %APP_NAME% Launcher Log
>> "%LOG%" echo Time   : %DATE% %TIME%
>> "%LOG%" echo Folder : %HERE%
>> "%LOG%" echo Action : %MSG%
>> "%LOG%" echo ==========================================================
exit /b 0

:log
set "TAG=%~1"
set "MSG=%~2"
echo [%DATE% %TIME%] [%TAG%] %MSG%
>> "%LOG%" echo [%DATE% %TIME%] [%TAG%] %MSG%
exit /b 0


REM ==========================================================
REM CHECKS
REM ==========================================================
:CheckJar
call :log "CHECK" "Checking jar presence..."
if exist "%JAR_PATH%" (
  call :log "OK" "Jar found: %JAR_PATH%"
  echo Jar: OK
  exit /b 0
)
call :log "ERROR" "Jar missing. Expected: %JAR_PATH%"
echo ERROR: Cannot find "%APP_JAR%" next to this .bat
echo Folder: %HERE%
echo Log   : %LOG%
exit /b 1


:DetectJava
set "JAVA_EXE="
call :log "CHECK" "Detecting Java (PATH / where / common)..."

for %%J in (java.exe) do set "JAVA_EXE=%%~$PATH:J"

if not defined JAVA_EXE (
  for /f "delims=" %%W in ('where java 2^>nul') do (
    if not defined JAVA_EXE set "JAVA_EXE=%%W"
  )
)

if not defined JAVA_EXE call :FindJavaInCommonPlaces

if defined JAVA_EXE (
  call :log "OK" "Java detected: %JAVA_EXE%"
  echo Java: OK
  >> "%LOG%" echo [JAVA VERSION BEGIN]
  "%JAVA_EXE%" -version >> "%LOG%" 2>&1
  >> "%LOG%" echo [JAVA VERSION END]
) else (
  call :log "WARN" "Java NOT detected."
  echo Java: MISSING
)
exit /b 0


:FindJavaInCommonPlaces
for /d %%D in (
  "%ProgramFiles%\Eclipse Adoptium\jre-21*\bin"
  "%ProgramFiles%\Eclipse Adoptium\jdk-21*\bin"
  "%ProgramFiles%\Eclipse Adoptium\temurin-21*\bin"
  "%ProgramFiles%\Java\jre-21*\bin"
  "%ProgramFiles%\Java\jdk-21*\bin"
  "%LocalAppData%\Programs\Eclipse Adoptium\*\bin"
) do (
  if exist "%%~D\java.exe" (
    set "JAVA_EXE=%%~D\java.exe"
    call :log "OK" "Java candidate found: !JAVA_EXE!"
    exit /b 0
  )
)
exit /b 0


:DetectJavaFX
call :log "CHECK" "Detecting JavaFX..."
call :log "CHECK" "Expected JavaFX home: %JFX_HOME%"
call :log "CHECK" "Expected JavaFX lib : %JFX_LIB%"

set "FX_CONTROLS=0"
set "FX_FXML=0"
set "FX_MEDIA=0"
set "FX_WEB=0"

if exist "%JFX_LIB%\javafx.controls.jar" set "FX_CONTROLS=1"
if exist "%JFX_LIB%\javafx.fxml.jar"     set "FX_FXML=1"
if exist "%JFX_LIB%\javafx.media.jar"    set "FX_MEDIA=1"
if exist "%JFX_LIB%\javafx.web.jar"      set "FX_WEB=1"

call :log "CHECK" "JavaFX jars present? controls=%FX_CONTROLS% fxml=%FX_FXML% media=%FX_MEDIA% web=%FX_WEB%"

if "%FX_CONTROLS%"=="1" (
  echo JavaFX: OK
  exit /b 0
)

echo JavaFX: MISSING
exit /b 1


REM ==========================================================
REM INSTALLERS
REM ==========================================================
:InstallJavaWinget
call :log "STEP" "Installing Java via winget: EclipseAdoptium.Temurin.21.JRE"
where winget >nul 2>nul
if errorlevel 1 (
  call :log "ERROR" "winget not available."
  exit /b 1
)
>> "%LOG%" echo [WINGET OUTPUT BEGIN]
winget install --id EclipseAdoptium.Temurin.21.JRE -e --accept-package-agreements --accept-source-agreements >> "%LOG%" 2>&1
set "WGERR=%ERRORLEVEL%"
>> "%LOG%" echo [WINGET OUTPUT END]
call :log "STEP" "winget exit code = %WGERR%"
if not "%WGERR%"=="0" exit /b 1
exit /b 0


:InstallJavaFX_CurlTar
call :log "STEP" "Installing JavaFX SDK %JFX_VER% using curl+tar (no PowerShell scripts)..."
call :log "STEP" "URL: %JFX_URL%"

REM Clean existing target folder
if exist "%JFX_HOME%" (
  call :log "STEP" "Removing existing JavaFX folder: %JFX_HOME%"
  rmdir /s /q "%JFX_HOME%" >> "%LOG%" 2>&1
)

REM Download to TEMP
set "ZIP_PATH=%TEMP%\%JFX_ZIP%"
call :log "STEP" "Temp ZIP path: %ZIP_PATH%"

REM Check curl exists
where curl >nul 2>nul
if errorlevel 1 (
  call :log "ERROR" "curl not available. Cannot download JavaFX."
  exit /b 1
)

REM Download (follow redirects)
call :log "STEP" "Downloading JavaFX zip with curl..."
>> "%LOG%" echo [CURL OUTPUT BEGIN]
curl -L --fail --retry 3 --retry-delay 2 -o "%ZIP_PATH%" "%JFX_URL%" >> "%LOG%" 2>&1
set "CURLERR=%ERRORLEVEL%"
>> "%LOG%" echo [CURL OUTPUT END]
call :log "STEP" "curl exit code = %CURLERR%"

if not "%CURLERR%"=="0" (
  call :log "ERROR" "curl download failed."
  exit /b 1
)

REM Check size (basic sanity)
for %%A in ("%ZIP_PATH%") do set "ZIPSIZE=%%~zA"
call :log "STEP" "Downloaded ZIP size bytes = %ZIPSIZE%"

REM If it's tiny, it's probably HTML/error page
if %ZIPSIZE% LSS 5000000 (
  call :log "ERROR" "ZIP too small, likely an error page instead of ZIP."
  call :log "ERROR" "Keeping file for inspection: %ZIP_PATH%"
  exit /b 1
)

REM Extract: prefer tar (bsdtar) because it handles zip reliably
where tar >nul 2>nul
if errorlevel 1 (
  call :log "ERROR" "tar not available on this Windows. Cannot extract ZIP."
  call :log "ERROR" "Install/enable tar or use manual extraction."
  exit /b 1
)

call :log "STEP" "Extracting ZIP to: %HERE%"
>> "%LOG%" echo [TAR OUTPUT BEGIN]
tar -xf "%ZIP_PATH%" -C "%HERE%" >> "%LOG%" 2>&1
set "TARERR=%ERRORLEVEL%"
>> "%LOG%" echo [TAR OUTPUT END]
call :log "STEP" "tar exit code = %TARERR%"

if not "%TARERR%"=="0" (
  call :log "ERROR" "tar extraction failed."
  exit /b 1
)

REM Verify extraction created expected folder
if not exist "%JFX_LIB%\javafx.controls.jar" (
  call :log "ERROR" "Extraction finished but expected jar missing:"
  call :log "ERROR" "%JFX_LIB%\javafx.controls.jar"
  call :log "ERROR" "Directory listing of HERE:"
  >> "%LOG%" echo [DIR LIST HERE BEGIN]
  dir "%HERE%" >> "%LOG%" 2>&1
  >> "%LOG%" echo [DIR LIST HERE END]
  exit /b 1
)

REM Cleanup zip
del /q "%ZIP_PATH%" >nul 2>nul
call :log "OK" "JavaFX installed successfully at: %JFX_HOME%"
exit /b 0


REM ==========================================================
REM SHORTCUTS + LAUNCH
REM ==========================================================
:CreateShortcuts
call :log "STEP" "Creating shortcuts (Desktop + Start Menu)..."
set "BAT_PATH=%~f0"
set "DESKTOP=%USERPROFILE%\Desktop"
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
set "LNK_DESKTOP=%DESKTOP%\%APP_NAME%.lnk"
set "LNK_START=%STARTMENU%\%APP_NAME%.lnk"

>> "%LOG%" echo [SHORTCUT OUTPUT BEGIN]
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws=New-Object -ComObject WScript.Shell;" ^
  "$bat='%BAT_PATH%'; $wd='%HERE%';" ^
  "function Mk($path){ $s=$ws.CreateShortcut($path); $s.TargetPath=$bat; $s.Arguments='--launch'; $s.WorkingDirectory=$wd; $s.Save() }" ^
  "Mk('%LNK_DESKTOP%'); Mk('%LNK_START%');" >> "%LOG%" 2>&1
set "SCERR=%ERRORLEVEL%"
>> "%LOG%" echo [SHORTCUT OUTPUT END]

call :log "STEP" "Shortcut creation exit code = %SCERR%"
if not "%SCERR%"=="0" exit /b 1
call :log "OK" "Shortcuts created."
exit /b 0


:LaunchGame
call :log "STEP" "Preparing to launch game..."

set "MODULES=javafx.controls,javafx.fxml"

if exist "%JFX_LIB%\javafx.media.jar" (
  set "MODULES=!MODULES!,javafx.media"
) else (
  call :log "WARN" "javafx.media.jar not found; skipping javafx.media"
)

if exist "%JFX_LIB%\javafx.web.jar" (
  set "MODULES=!MODULES!,javafx.web"
) else (
  call :log "WARN" "javafx.web.jar not found; skipping javafx.web"
)

call :log "STEP" "Java exe    = %JAVA_EXE%"
call :log "STEP" "Jar        = %JAR_PATH%"
call :log "STEP" "JavaFX lib  = %JFX_LIB%"
call :log "STEP" "AddModules = !MODULES!"

>> "%LOG%" echo [GAME OUTPUT BEGIN]
"%JAVA_EXE%" ^
  --module-path "%JFX_LIB%" ^
  --add-modules !MODULES! ^
  -cp "%JAR_PATH%" %MAIN_CLASS% >> "%LOG%" 2>&1
set "GAMEERR=%ERRORLEVEL%"
>> "%LOG%" echo [GAME OUTPUT END]

call :log "STEP" "Game exit code = %GAMEERR%"
if not "%GAMEERR%"=="0" (
  call :log "ERROR" "Game exited with error. See [GAME OUTPUT BEGIN] block."
  exit /b 1
)
call :log "OK" "Game exited normally."
exit /b 0
