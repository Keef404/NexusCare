@echo off
cd /d "%~dp0.."
set L=scripts\logs\diag.log
echo [%date% %time%] diag2 > %L%
echo --- nslookup via 8.8.8.8 >> %L%
nslookup registry.npmjs.org 8.8.8.8 >> %L% 2>&1
echo --- nslookup via 1.1.1.1 >> %L%
nslookup registry-1.docker.io 1.1.1.1 >> %L% 2>&1
echo --- container dns test >> %L%
docker run --rm --dns 8.8.8.8 --entrypoint nslookup redis:7-alpine registry.npmjs.org >> %L% 2>&1
docker run --rm --dns 8.8.8.8 --entrypoint nslookup redis:7-alpine api.groq.com >> %L% 2>&1
echo --- compose ps >> %L%
docker compose ps -a >> %L% 2>&1
echo DONE >> %L%
