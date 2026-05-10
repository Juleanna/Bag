# Запуск BugTracker у Docker

## Передумови

- **Docker Desktop** запущений (на Windows: запустіть з меню «Пуск», дочекайтеся
  поки в треї значок з китом стане зеленим).
- Перевірити що Docker працює: `docker ps` має показати таблицю (порожню чи ні).

## Dev-режим — для розробки з hot-reload

Підіймає 4 контейнери: PostgreSQL, Redis, Django (runserver), Vite (npm run dev).
Зміни у коді backend і frontend автоматично перезапускають сервери.

```bash
# Перший запуск (білд образу + npm install — займе кілька хвилин)
docker compose -f docker-compose.dev.yml up --build

# Подальші запуски (без перебудови)
docker compose -f docker-compose.dev.yml up

# У фоновому режимі
docker compose -f docker-compose.dev.yml up -d

# Зупинити
docker compose -f docker-compose.dev.yml down
```

**Доступ:**
- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:8000>
- Django admin: <http://localhost:8000/admin>
- PostgreSQL: `localhost:5432` (user/pass: `bugtracker` / `bugtracker_dev`)

**Створити суперюзера:**
```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```

**Запустити тести:**
```bash
docker compose -f docker-compose.dev.yml exec backend python -m pytest
```

**Подивитись логи:**
```bash
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
```

## Production-режим

Підіймає повний продакшн-стек: web (Gunicorn), Celery worker, Celery beat,
Postgres, Redis, Nginx-проксі.

```bash
# 1. Створіть .env з продакшн-значеннями (скопіюйте з .env.production)
cp .env.production .env
# відредагуйте SECRET_KEY, ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS

# 2. Запуск
docker compose up -d --build

# 3. Доступ через Nginx
# http://localhost (порт 80)
```

**Опціональні профілі:**
```bash
# Моніторинг (Prometheus на :9090, Grafana на :3000)
docker compose --profile monitoring up -d

# Бекапи Postgres (щоденні в ./backups/)
docker compose --profile backups up -d
```

## Часті проблеми

**"Cannot connect to Docker daemon"** на Windows
→ Запустіть Docker Desktop (значок у треї має стати зеленим).

**Помилка `port is already allocated`** на 5432 / 6379 / 8000
→ У вас локально запущений Postgres / Redis / Django. Зупиніть їх або змініть
порти у compose-файлі.

**Frontend показує "Network Error" при запитах**
→ Перевірте що backend контейнер живий: `docker compose ps`. Якщо ні —
дивіться логи: `docker compose logs backend`.

**Bind mount не оновлюється на Windows**
→ Переконайтесь що ваша папка проєкту знаходиться під `C:` і додана у
Docker Desktop → Settings → Resources → File Sharing.

## Корисне

```bash
# Очистити все (контейнери + volumes)
docker compose -f docker-compose.dev.yml down -v

# Зайти у контейнер
docker compose -f docker-compose.dev.yml exec backend bash

# Виконати міграції після змін у моделях
docker compose -f docker-compose.dev.yml exec backend python manage.py makemigrations
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Бекап Postgres ad-hoc
docker compose exec db pg_dump -U bugtracker bugtracker | gzip > backup-$(date +%F).sql.gz
```
