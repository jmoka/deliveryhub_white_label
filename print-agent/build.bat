@echo off
REM Gera o executavel DeliveryHubAgente.exe (Windows) em dist\
pip install -r requirements-dev.txt
python -m PyInstaller --onefile --windowed --name "DeliveryHubAgente" gui.py
echo.
echo Pronto: dist\DeliveryHubAgente.exe
