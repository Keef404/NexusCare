@echo off
rem Rafraichit l'etat des conteneurs et les derniers logs.
cd /d "%~dp0.."
del scripts\logs\done.flag 2>nul
docker compose ps > scripts\logs\ps.log 2>&1
docker compose logs --tail=80 visio-app > scripts\logs\visio-app.log 2>&1
docker compose logs --tail=80 rest-api > scripts\logs\rest-api.log 2>&1
docker compose logs --tail=60 websocket > scripts\logs\websocket.log 2>&1
docker compose logs --tail=60 oncovision-api > scripts\logs\oncovision-api.log 2>&1
echo DONE > scripts\logs\done.flag
