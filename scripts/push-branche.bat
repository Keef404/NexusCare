@echo off
cd /d "%~dp0.."
rem Pousse UNIQUEMENT la branche finalisation-nexuscare (jamais main).
if not exist scripts\logs mkdir scripts\logs
git push -u origin finalisation-nexuscare > scripts\logs\push.log 2>&1
echo exit=%ERRORLEVEL% >> scripts\logs\push.log
echo fini > scripts\logs\push.done
