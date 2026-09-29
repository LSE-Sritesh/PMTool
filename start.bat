@echo off
rem Double click to start Sitebook. Close this window to stop it.
cd /d "%~dp0"
node server.js --open
pause
