@echo off
cd /d "%~dp0"
echo Iniciando agente GDOOR...
".venv\Scripts\python.exe" -m uvicorn app.main:app --port 8000
pause
