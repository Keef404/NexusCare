@echo off
rem Recree rest-api / websocket / visio-app (nouveau code + variables) avec DNS public, sans rebuild.
cd /d "%~dp0.."
del scripts\logs\done.flag 2>nul
set C=docker compose -f docker-compose.yml -f docker-compose.local-dns.yml
echo [%date% %time%] restart > scripts\logs\up.log
%C% up -d --no-build --force-recreate rest-api websocket visio-app >> scripts\logs\up.log 2>&1
echo EXIT=%ERRORLEVEL% >> scripts\logs\up.log
timeout /t 60 /nobreak >nul
docker compose ps -a > scripts\logs\ps.log 2>&1
docker compose logs --tail=60 visio-app > scripts\logs\visio-app.log 2>&1
docker compose logs --tail=120 rest-api > scripts\logs\rest-api.log 2>&1
docker compose logs --tail=40 websocket > scripts\logs\websocket.log 2>&1
echo DONE > scripts\logs\done.flag
