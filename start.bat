@echo off
rem Double click to start the Project Management Tool. Close this window to stop it.
cd /d "%~dp0"
node server.js --open
pause
