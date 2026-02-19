@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

REM Determine the directory where this script lives
set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

:start
cls
echo.
echo ===========================================================
echo           BugTracker - Launch Application
echo ===========================================================
echo.

echo Checking dependencies...
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Install from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    echo Install from: https://www.python.org/
    pause
    exit /b 1
)

echo [OK] Node.js found
echo [OK] Python found
echo.

echo ===========================================================
echo               Choose what to launch:
echo.
echo   1) Launch ALL (Frontend + Backend)
echo   2) Only Frontend (Vite dev server)
echo   3) Only Backend (Django)
echo   4) Install dependencies
echo   0) Exit
echo.
echo ===========================================================
echo.

set /p choice="Enter number (0-4): "

if "%choice%"=="1" goto all
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto backend
if "%choice%"=="4" goto install
if "%choice%"=="0" exit /b 0

echo Invalid choice!
pause
goto start

:install
echo.
echo Installing dependencies...
echo.

echo Installing Python dependencies...
cd /d "%ROOT%"
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    python -m venv venv
    call venv\Scripts\activate.bat
)
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Running database migrations...
python manage.py migrate

echo.
echo Installing Frontend dependencies...
cd /d "%ROOT%\frontend"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies!
    pause
    goto start
)
echo.
echo [OK] All dependencies installed!
pause
goto start

:frontend
echo.
echo Launching Vite dev server...
echo Frontend: http://localhost:5173
echo.
cd /d "%ROOT%\frontend"
call npm run dev
pause
goto start

:backend
echo.
echo Launching Django server...
echo Backend: http://localhost:8000
echo Admin:   http://localhost:8000/admin
echo API Docs: http://localhost:8000/api/docs/
echo.
cd /d "%ROOT%"
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found, creating...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
)
echo [OK] Virtual environment activated
echo.
python manage.py migrate --run-syncdb 2>nul
python manage.py runserver
pause
goto start

:all
echo.
echo Launching ALL...
echo.
echo ===========================================================
echo   This will open TWO windows:
echo     - Window 1: Django Backend (http://localhost:8000)
echo     - Window 2: Vite Frontend (http://localhost:5173)
echo.
echo   API Docs: http://localhost:8000/api/docs/
echo ===========================================================
echo.

REM Start backend in a new window
cd /d "%ROOT%"
if exist venv\Scripts\activate.bat (
    start "BugTracker Backend" cmd /k "cd /d "%ROOT%" && call venv\Scripts\activate.bat && python manage.py migrate --run-syncdb 2>nul && python manage.py runserver"
) else (
    start "BugTracker Backend" cmd /k "cd /d "%ROOT%" && python -m venv venv && call venv\Scripts\activate.bat && pip install -r requirements.txt && python manage.py migrate && python manage.py runserver"
)

REM Small delay to let backend start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
start "BugTracker Frontend" cmd /k "cd /d "%ROOT%\frontend" && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Press any key to return to menu...
pause
goto start
