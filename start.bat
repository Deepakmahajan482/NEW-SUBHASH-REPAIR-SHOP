@echo off
title New Subhash Repair Agency - Local System
echo ================================================================
echo   New Subhash Repair Agency - Tata Leyland Leaf Spring Workshop
echo ================================================================
echo.

:: Check / Start MongoDB
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Local MongoDB service is running.
) else (
    echo [INFO] Starting local MongoDB instance...
    if exist "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" (
        start "MongoDB Server" /min "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg"
    ) else (
        echo [WARN] Could not find mongod at default path. Ensure MongoDB service is running.
    )
)

:: Start Backend API (Port 5000)
echo [INFO] Starting Node.js Backend Server on port 5000...
start "Subhash Agency Backend" cmd /k "cd /d %~dp0server\server && npm start"

:: Start Frontend Vite (Port 5173)
echo [INFO] Starting React Frontend Client on port 5173...
start "Subhash Agency Frontend" cmd /k "cd /d %~dp0server\client && npm run dev"

echo.
echo ================================================================
echo   Both Backend & Frontend are launching!
echo   Main Super Admin: deepakmahajan3028@gmail.com (Password: admin123)
echo   Local Database: mongodb://127.0.0.1:27017/subhash_repair_shop
echo ================================================================
timeout /t 3 >nul
start http://localhost:5173
