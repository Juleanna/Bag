# BugTracker

Веб-застосунок для керування проєктами та задачами (баг-трекер).
Backend — Django 5.2 + DRF, frontend — Vanilla TypeScript + Vite + Tailwind/DaisyUI.

---

## Зміст

1. [Можливості](#можливості)
2. [Стек технологій](#стек-технологій)
3. [Структура проєкту](#структура-проєкту)
4. [Швидкий старт](#швидкий-старт)
5. [Налаштування `.env`](#налаштування-env)
6. [Команди розробки](#команди-розробки)
7. [API](#api)
8. [Деплой у production](#деплой-у-production)
9. [Безпека](#безпека)
10. [Внесок і тестування](#внесок-і-тестування)

---

## Можливості

- **Проєкти й задачі.** Кілька проєктів, у кожному — задачі зі статусом, пріоритетом, виконавцем, дедлайном і мітками.
- **Учасники й ролі.** `viewer`, `member`, `manager`, `owner`. Учасники додаються через запрошення (email + токен).
- **Коментарі та вкладення.** Markdown у коментарях, безпечні посилання, вкладення з обмеженням розміру / типу.
- **Чек-листи, зв'язки між задачами, журнал активностей.** Аудит будь-якої зміни.
- **Сповіщення.** Внутрішні + email через Celery (опційно).
- **Зіркові задачі**, командна палітра, гарячі клавіші, темна тема, локалізація (uk / en).
- **API.** REST через DRF + автогенерована OpenAPI-документація (`/api/schema/`, `/api/docs/`).

## Стек технологій

| Шар        | Технології                                                          |
| ---------- | ------------------------------------------------------------------- |
| Backend    | Python 3.11+, Django 5.2, DRF 3.15, drf-spectacular                 |
| Async      | Celery 5 + Redis (опційно)                                          |
| Frontend   | TypeScript 5.9, Vite 7, Tailwind CSS 4, DaisyUI                     |
| База даних | SQLite (dev), PostgreSQL (production через `DATABASE_URL`)          |
| Сервер     | Gunicorn + Whitenoise + Nginx                                       |
| Контейнер  | Docker + docker-compose                                             |

## Структура проєкту

```
bag/
├── bugtracker/              # Django project (settings, urls, wsgi/asgi, celery)
│   ├── settings.py          # Налаштування (читає .env)
│   ├── urls.py              # Кореневі URL
│   ├── celery.py            # Конфіг Celery
│   └── logging_config.py    # Налаштування логування
├── issues/                  # Основний Django app
│   ├── models.py            # Project, Issue, Comment, Attachment, ...
│   ├── serializers.py       # DRF серіалізатори (з обмеженням queryset)
│   ├── views_api.py         # ViewSet'и з фільтрацією за членством
│   ├── views_auth.py        # Реєстрація / логін / профіль (з throttle)
│   ├── permissions.py       # IsProjectOwner, IsAuthenticatedAndMember, ...
│   ├── tasks.py             # Celery таски (email)
│   ├── api_urls.py          # API роутер
│   ├── admin.py             # Django admin
│   └── migrations/
├── frontend/                # Vite + TypeScript SPA
│   ├── src/
│   │   ├── main.ts          # Точка входу + роутер
│   │   ├── api.ts           # ApiClient (CSRF, fetch)
│   │   ├── auth.ts          # checkAuth + ініціалізація
│   │   ├── state.ts         # Глобальний state
│   │   ├── components.ts    # h(), Card, Button, Form, ...
│   │   ├── helpers.ts       # renderMarkdown, sanitizeUrl, formatDate
│   │   ├── i18n/            # uk.ts, en.ts
│   │   └── pages/           # login, register, projects, issues, ...
│   ├── vite.config.ts
│   └── tsconfig.json
├── templates/               # Django HTML (для Vite-bundle)
├── static/                  # Статичні файли (зібрані вручну)
├── manage.py
├── requirements.txt         # Python залежності
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── deploy.sh                # Скрипт деплою
├── START_APP.sh / .bat      # Старт обох процесів локально
└── .env / .env.example      # Конфігурація середовища
```

---

## Швидкий старт

### Передумови

- Python 3.11+ (`python --version`)
- Node.js 18+ і npm (`node --version`)
- (Опційно) Redis — лише якщо потрібен Celery / кеш

### 1. Клонування та venv

```bash
git clone <repo> bag
cd bag

# Створення віртуального середовища
python -m venv venv

# Активація (Windows / Git Bash)
source venv/Scripts/activate
# Активація (Linux / macOS)
source venv/bin/activate
```

### 2. Backend

```bash
pip install -r requirements.txt
cp .env.example .env          # створити свій .env (відредагувати за потреби)
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver    # http://127.0.0.1:8000/
```

### 3. Frontend

В іншому терміналі:

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173/
```

Vite проксує `/api/*` на Django (`http://localhost:8000`) — авторизація через сесійні cookie + CSRF працює без додаткових налаштувань.

### 4. Перевірка

Відкрийте `http://localhost:5173/` — побачите форму входу.
Зареєструйтесь через UI або увійдіть за обліковим записом superuser.

> 💡 На Windows можна одночасно стартувати backend + frontend через `START_APP.bat`,
> на Linux/macOS — `./START_APP.sh`.

---

## Налаштування `.env`

Скопіюйте `.env.example` у `.env` і відредагуйте під своє середовище.

| Змінна                           | Призначення                                                | За замовчуванням                          |
| -------------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| `SECRET_KEY`                     | Секрет Django — **обов'язково замінити в production**      | `dev-secret-key-change-me`                |
| `DEBUG`                          | Режим розробки                                             | `False`                                   |
| `ALLOWED_HOSTS`                  | Список дозволених хостів через кому                        | `localhost,127.0.0.1`                     |
| `DATABASE_URL`                   | URL БД (`postgres://…`); якщо не задано — SQLite           | `sqlite:///db.sqlite3`                    |
| `CORS_ALLOWED_ORIGINS`           | Origin'и, яким дозволено CORS                              | `http://localhost:5173,…`                 |
| `CSRF_TRUSTED_ORIGINS`           | Origin'и, яким довіряємо CSRF                              | `http://localhost:5173,…`                 |
| `CELERY_BROKER_URL`              | URL брокера Celery                                         | `redis://localhost:6379/0`                |
| `REDIS_URL`                      | URL Redis для кешу (опційно)                               | —                                         |
| `SENTRY_DSN`                     | DSN для Sentry (опційно)                                   | —                                         |
| `DEFAULT_FROM_EMAIL`             | Адреса відправника email                                   | `noreply@bugtracker.local`                |
| `EMAIL_BACKEND`                  | Backend email Django                                       | console (виводить у stdout)               |

### Production-only змінні (читаються лише при `DEBUG=False`)

| Змінна                         | Дефолт     | Опис                                              |
| ------------------------------ | ---------- | ------------------------------------------------- |
| `SECURE_SSL_REDIRECT`          | `True`     | Перенаправляти HTTP → HTTPS                       |
| `SESSION_COOKIE_SECURE`        | `True`     | Cookie сесії лише через HTTPS                     |
| `CSRF_COOKIE_SECURE`           | `True`     | CSRF cookie лише через HTTPS                      |
| `SECURE_HSTS_SECONDS`          | `31536000` | HSTS на рік                                       |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | `True`   | HSTS на піддомени                                 |
| `SECURE_HSTS_PRELOAD`          | `True`     | Дозвіл на HSTS preload list                       |

---

## Команди розробки

### Django

```bash
python manage.py runserver         # запуск dev-сервера
python manage.py shell             # інтерактивна оболонка
python manage.py makemigrations    # генерація міграцій
python manage.py migrate           # застосування міграцій
python manage.py createsuperuser   # створення адміністратора
python manage.py collectstatic     # збір статики (для production)
python manage.py check             # перевірка конфігурації
```

### Frontend

```bash
cd frontend
npm run dev      # dev-сервер з hot-reload
npm run build    # production-збірка → frontend/dist/
npm run preview  # перегляд production-збірки
npm run lint     # ESLint
npx tsc --noEmit # перевірка типів TypeScript
```

### Celery (опційно — потребує Redis)

```bash
# Worker
celery -A bugtracker worker -l info

# Beat scheduler (для періодичних задач)
celery -A bugtracker beat -l info
```

---

## API

Базовий URL: `/api/`. Автентифікація — сесія + CSRF через cookie.

### Документація

- **Swagger UI:** `/api/docs/` (тільки для адміністраторів)
- **ReDoc:** `/api/redoc/`
- **OpenAPI JSON:** `/api/schema/`

### Ключові ендпоінти

| Метод   | Шлях                              | Опис                                           |
| ------- | --------------------------------- | ---------------------------------------------- |
| `GET`   | `/api/auth/csrf/`                 | Отримати CSRF-токен (виставляє cookie)         |
| `GET`   | `/api/auth/whoami/`               | Інформація про поточного користувача           |
| `POST`  | `/api/auth/login/`                | Вхід (10 спроб/хв з IP)                        |
| `POST`  | `/api/auth/register/`             | Реєстрація (5/год з IP, валідація пароля)      |
| `POST`  | `/api/auth/logout/`               | Вихід                                          |
| `PATCH` | `/api/auth/profile/`              | Оновлення профілю                              |
| `POST`  | `/api/auth/password/`             | Зміна пароля                                   |
| `*`     | `/api/projects/`                  | Проєкти (CRUD, тільки свої)                    |
| `*`     | `/api/issues/`                    | Задачі (фільтри: `?project=`, `?status=`, `?assignee=me`) |
| `*`     | `/api/comments/`                  | Коментарі (`?issue=<id>`)                      |
| `*`     | `/api/attachments/`               | Вкладення (multipart/form-data)                |
| `*`     | `/api/labels/`                    | Мітки (запис лише admin)                       |
| `*`     | `/api/memberships/`               | Учасники проєктів (manager+)                   |
| `*`     | `/api/invitations/`               | Запрошення (manager+)                          |
| `POST`  | `/api/invitations/accept/`        | Прийняти запрошення (`{token}`)                |
| `*`     | `/api/checklist/`                 | Пункти чек-листа                               |
| `*`     | `/api/relations/`                 | Зв'язки між задачами                           |
| `*`     | `/api/activities/`                | Журнал змін (read-only)                        |
| `*`     | `/api/notifications/`             | Сповіщення                                     |
| `POST`  | `/api/notifications/mark_all_read/` | Позначити все прочитаним                     |
| `*`     | `/api/starred/`                   | Зіркові задачі                                 |
| `POST`  | `/api/starred/toggle/`            | Перемкнути зірочку (`{issue}`)                 |

### Throttling

| Scope      | Ліміт         |
| ---------- | ------------- |
| `user`     | 120 / хв      |
| `anon`     | 30 / хв       |
| `login`    | 10 / хв з IP  |
| `register` | 5 / год з IP  |

---

## Деплой у production

### Через Docker Compose

```bash
# 1. Налаштувати .env (DEBUG=False, реальний SECRET_KEY, DATABASE_URL, ALLOWED_HOSTS, ...)
# 2. Зібрати і запустити
docker-compose up -d --build

# 3. Міграції + статика
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py collectstatic --noinput
docker-compose exec web python manage.py createsuperuser
```

### Без Docker (Linux + Nginx + Gunicorn + systemd)

1. Зібрати frontend: `cd frontend && npm ci && npm run build`
2. Зібрати статику Django: `python manage.py collectstatic --noinput`
3. Налаштувати Nginx (див. `nginx.conf`) на проксі до Gunicorn
4. Запустити Gunicorn: `gunicorn bugtracker.wsgi:application --workers 4 --bind 127.0.0.1:8000`
5. (Опційно) запустити Celery worker як systemd-сервіс

> Готовий скрипт автоматизації деплою: `./deploy.sh` (потрібно адаптувати під ваше середовище).

### Контрольний список production

- [ ] `DEBUG=False`
- [ ] `SECRET_KEY` згенеровано і збережено в `.env` (не комітити!)
- [ ] `ALLOWED_HOSTS` містить реальні домени
- [ ] `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` — реальні домени з `https://`
- [ ] `DATABASE_URL` вказує на PostgreSQL
- [ ] HTTPS (Let's Encrypt / Cloudflare)
- [ ] Бекапи БД налаштовані
- [ ] (Опційно) Sentry DSN заданий
- [ ] Celery worker запущений (для email-сповіщень)
- [ ] Nginx віддає `MEDIA_URL` із `Content-Disposition: attachment`

---

## Безпека

Що вже зроблено:

- **Permissions з членством у проєкті** — IDOR неможливий (`IsAuthenticatedAndMember`, `IsProjectOwner`, `IsProjectManager`, `IsAuthorOrReadOnly`)
- **Querysets обмежено** для всіх ViewSet'ів за `Q(owner=user) | Q(members=user)`
- **Серіалізатори обмежують** `PrimaryKeyRelatedField.queryset` лише доступними об'єктами
- **CSRF + SessionAuth** — захист усіх write-методів
- **XSS-фільтр у markdown** — `sanitizeUrl()` блокує `javascript:`, `data:`, `vbscript:`
- **Валідатори файлів** — whitelist розширень + ліміт 10 МБ
- **AUTH_PASSWORD_VALIDATORS** на реєстрації та зміні пароля (мін. 8 символів, не numeric, не common, не similar)
- **Throttling**: загальний (user/anon) + scope `login`/`register`
- **HSTS, SSL redirect, Secure cookies** в production
- **Audit log** усіх змін у `IssueActivity`
- **Транзакції** у критичних операціях (`perform_update`, `accept`, `toggle`)

---

## Внесок і тестування

Тести покриваються через `pytest-django` (рекомендовано). Файл `issues/tests.py` поки порожній — додавайте сценарії на:

- IDOR (доступ до чужих проєктів)
- Throttle login / register
- Валідацію вкладень (розмір / тип)
- Перенесення між проєктами через PATCH

```bash
pip install pytest-django
pytest                       # запуск тестів
pytest --cov=issues          # з покриттям
```

---

## Ліцензія

Внутрішній проєкт. Деталі — у конкретного власника репозиторію.
