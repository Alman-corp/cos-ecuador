@echo off
title BI OS Platform
echo ============================================
echo   BI OS Platform — Inicio Rapido
echo ============================================
echo.

cd /d "%~dp0apps\web"

echo [1/3] Verificando dependencias...
if not exist node_modules\.package-lock.json (
    npm install --no-audit --no-fund >nul 2>&1
    if errorlevel 1 (
        echo ERROR: No se pudo instalar dependencias. Ejecuta: npm install
        pause
        exit /b 1
    )
)

echo [2/3] Iniciando servidor...
start "BI OS Server" cmd /c "npm run dev"
echo        Esperando que el servidor arranque...

echo [3/3] Abriendo navegador...
timeout /t 8 /nobreak >nul
start http://localhost:3000

echo.
echo ============================================
echo   Aplicacion corriendo en http://localhost:3000
echo   Cierra esta ventana para detener el servidor
echo ============================================
echo.
pause
