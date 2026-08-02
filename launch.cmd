@echo off
REM ===================================================================
REM  ChessRetabled launcher
REM    launch.cmd          - start the dev server (auto-reload) + open
REM    launch.cmd prod     - build the installable PWA + preview it + open
REM  Double-click this file, or run it from a terminal.
REM ===================================================================
title ChessRetabled
cd /d "%~dp0"

REM First run: install dependencies (this also vendors the Stockfish engine).
if not exist "node_modules" (
  echo Installing dependencies for the first time - this can take a minute...
  call npm install || (echo. & echo Dependency install failed - see above. & pause & exit /b 1)
)

if /i "%~1"=="prod" (
  echo Building the installable app...
  call npm run build || (echo. & echo Build failed - see above. & pause & exit /b 1)
  echo Starting the preview server - a browser tab will open. Ctrl+C to stop.
  call npm run preview -- --open
) else (
  echo Starting the dev server - a browser tab will open. Ctrl+C to stop.
  call npm run dev -- --open
)

REM Keep the window open if the server exited on its own (e.g. an error).
echo.
echo Server stopped.
pause
