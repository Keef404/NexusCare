@echo off
rem Demarre la stack avec DNS public + images existantes (sans rebuild) et journalise.
cd /d "%~dp0.."
if not exist scripts\logs mkdir scripts\logs
del scripts\logs\done.flag 2>nul
set C=docker compose -f docker-compose.yml -f docker-compose.local-dns.yml
echo [%date% %time%] up (dns) > scripts\logs\up.log
%C% up -d --no-build visio-app oncovision-api >> scripts\logs\up.log 2>&1
echo EXIT=%ERRORLEVEL% >> scripts\logs\up.log
timeout /t 100 /nobreak >nul
docker compose ps -a > scripts\logs\ps.log 2>&1
docker compose logs --tail=80 visio-app > scripts\logs\visio-app.log 2>&1
docker compose logs --tail=60 rest-api > scripts\logs\rest-api.log 2>&1
docker compose logs --tail=60 websocket > scripts\logs\websocket.log 2>&1
docker compose logs --tail=60 oncovision-api > scripts\logs\oncovision-api.log 2>&1
echo DONE > scripts\logs\done.flag
