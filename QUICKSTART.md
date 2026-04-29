# Швидкий старт BugTracker

Запуск локально за 5 хвилин.

## Передумови

- **Python 3.11+** — `python --version`
- **Node.js 18+** — `node --version`

## Крок 1: Backend

```bash
# З кореня проєкту
python -m venv venv
source venv/Scripts/activate    # Windows (Git Bash) / на Linux: source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env             # створити свій .env (можна залишити дефолт для dev)

python manage.py migrate
python manage.py createsuperuser # створіть адміна

python manage.py runserver       # запускає на http://127.0.0.1:8000
```

## Крок 2: Frontend (в іншому терміналі)

```bash
cd frontend
npm install
npm run dev                      # запускає на http://localhost:5173
```

## Крок 3: Перевірка

Відкрийте **http://localhost:5173/** у браузері.
Увійдіть під створеним superuser або зареєструйтесь через форму.

## Все одразу одним скриптом

- Windows: `START_APP.bat`
- Linux / macOS: `./START_APP.sh`

## Швидкі команди

```bash
# Перевірка конфігурації Django
python manage.py check

# Перевірка типів TypeScript
cd frontend && npx tsc --noEmit

# Production-збірка фронтенду
cd frontend && npm run build
```

## Часті проблеми

**`ModuleNotFoundError`** — забули активувати venv:
```bash
source venv/Scripts/activate    # Windows
source venv/bin/activate        # Linux/macOS
```

**`port 8000 already in use`** — вже запущений Django:
```bash
# Знайти процес
lsof -i :8000      # Linux/macOS
netstat -ano | findstr :8000   # Windows
```

**CORS помилка у браузері** — перевірте `CORS_ALLOWED_ORIGINS` у `.env` (має містити `http://localhost:5173`).

**CSRF 403** — frontend не отримав cookie. Перевірте, що:
- Vite dev-сервер запущений (`/api/auth/csrf/` має повертати `Set-Cookie: csrftoken=...`)
- В браузері не вимкнені сторонні cookie

**`relation "issues_…" does not exist`** — забули виконати міграції:
```bash
python manage.py migrate
```

## Далі

Повна документація — у [README.md](README.md):

- [Структура проєкту](README.md#структура-проєкту)
- [Налаштування `.env`](README.md#налаштування-env)
- [Опис API](README.md#api)
- [Деплой у production](README.md#деплой-у-production)
- [Безпека](README.md#безпека)
