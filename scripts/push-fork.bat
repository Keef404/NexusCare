@echo off
cd /d "%~dp0.."
rem Pousse UNIQUEMENT la branche finalisation-nexuscare vers le fork (jamais main).
if not exist scripts\logs mkdir scripts\logs
del scripts\logs\push.done 2>nul
git push -u fork finalisation-nexuscare > scripts\logs\push.log 2>&1
echo exit=%ERRORLEVEL% >> scripts\logs\push.log
echo fini > scripts\logs\push.done
