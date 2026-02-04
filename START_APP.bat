@echo off
chcp 1251 > nul


REM Запуск BugTracker Frontend + Backend для Windows

echo.
echo г===========================================================¬
echo ¦          ?? BugTracker - Запуск приложения ??            ¦
echo L===========================================================-
echo.

echo.
echo ? Проверка зависимостей...
echo.

REM Проверка Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ? Node.js не найден!
    echo ?? Скачайте с: https://nodejs.org/
    pause
    exit /b 1
)

REM Проверка Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ? Python не найден!
    echo ?? Скачайте с: https://www.python.org/
    pause
    exit /b 1
)

echo ? Node.js найден
echo ? Python найден
echo.

echo г===========================================================¬
echo ¦              ?? Выберите, что запустить:                 ¦
echo ¦                                                           ¦
echo ¦  1) Запустить ВСЁ (Frontend + Backend)                   ¦
echo ¦  2) Только Frontend (Vite dev сервер)                    ¦
echo ¦  3) Только Backend (Django)                              ¦
echo ¦  4) Установить зависимости                               ¦
echo ¦  0) Выход                                                ¦
echo ¦                                                           ¦
echo L===========================================================-
echo.

set /p choice="Введите номер (0-4): "

if "%choice%"=="1" goto all
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto backend
if "%choice%"=="4" goto install
if "%choice%"=="0" exit /b 0

echo ? Неверный выбор!
pause
goto start

:install
echo.
echo ?? Установка зависимостей...
cd /d "c:\Bag"
echo ?? Создание виртуального окружения Python...
python -m venv venv
echo ?? Активация виртуального окружения...
call venv\Scripts\activate.bat
echo ?? Установка Python зависимостей...
pip install --upgrade pip
pip install -r requirements.txt
echo.
echo ?? Установка Frontend зависимостей...
cd /d "c:\Bag\frontend"
call npm install
if %errorlevel% neq 0 (
    echo ? Ошибка установки зависимостей!
    pause
    goto start
)
echo ? Все зависимости установлены!
echo.
pause
goto start

:frontend
echo.
echo ?? Запуск Vite dev сервера...
echo ?? Frontend: http://localhost:5173
echo.
cd /d "c:\Bag\frontend"
call npm run dev
pause
goto start

:backend
echo.
echo ?? Запуск Django сервера...
echo ?? Backend: http://localhost:8000
echo ?? Admin: http://localhost:8000/admin
echo.
cd /d "c:\Bag"
echo ?? Активация виртуального окружения...
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo ? Виртуальное окружение не найдено!
    echo ?? Создание виртуального окружения...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo ?? Установка зависимостей...
    pip install -r requirements.txt
)
echo ? Виртуальное окружение активировано
echo.
python manage.py runserver
pause
goto start

:all
echo.
echo ?? Запуск ВСЁ...
echo.
echo г=============================================================¬
echo ¦  ??  Запустите каждую команду в ОТДЕЛЬНОМ терминале!      ¦
echo ¦                                                             ¦
echo ¦  Терминал 1:                                                ¦
echo ¦    1??  Нажмите Enter                                        ¦
echo ¦    2??  Дождитесь "Django development server is running"    ¦
echo ¦                                                             ¦
echo ¦  Терминал 2:                                                ¦
echo ¦    1??  Откройте новый терминал (Ctrl+Shift+T / Cmd+T)      ¦
echo ¦    2??  Запустите это же меню и выберите пункт 2           ¦
echo ¦    3??  Дождитесь "VITE ready in XXms"                     ¦
echo ¦                                                             ¦
echo ¦  После:                                                     ¦
echo ¦    ?? Откроется: http://localhost:5173 (Frontend)          ¦
echo ¦    ?? Django API: http://localhost:8000/api                ¦
echo ¦    ???  Admin: http://localhost:8000/admin                   ¦
echo ¦                                                             ¦
echo L=============================================================-
echo.
pause

echo.
echo ?? Активация виртуального окружения...
cd /d "c:\Bag"
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo ? Виртуальное окружение не найдено!
    echo ?? Создание виртуального окружения...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo ?? Установка зависимостей...
    pip install -r requirements.txt
)
echo ? Виртуальное окружение активировано
echo.
echo ?? Запуск Django...
python manage.py runserver
goto end

:start
cls
echo.
echo г===========================================================¬
echo ¦          ?? BugTracker - Запуск приложения ??            ¦
echo L===========================================================-
echo.
echo ? Проверка зависимостей...
echo.

goto end

:end
pause
