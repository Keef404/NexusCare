@echo off
rem Demarre la stack de dev NexusCare (visio-app + dependances + OncoVision API) et journalise.
cd /d "%~dp0.."
if not exist scripts\logs mkdir scripts\logs
echo [%date% %time%] docker compose up > scripts\logs\up.log
docker compose up -d --build --renew-anon-volumes visio-app oncovision-api >> scripts\logs\up.log 2>&1
echo EXIT=%ERRORLEVEL% >> scripts\logs\up.log
docker compose ps > scripts\logs\ps.log 2>&1
docker compose logs --tail=80 visio-app > scripts\logs\visio-app.log 2>&1
docker compose logs --tail=60 rest-api > scripts\logs\rest-api.log 2>&1
docker compose logs --tail=60 websocket > scripts\logs\websocket.log 2>&1
docker compose logs --tail=60 oncovision-api > scripts\logs\oncovision-api.log 2>&1
echo DONE > scripts\logs\done.flag
