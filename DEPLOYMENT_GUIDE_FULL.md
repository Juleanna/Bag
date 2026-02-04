# 🚀 DEPLOYMENT_GUIDE - Гайд Production деплоя

> Полное руководство по развёртыванию BugTracker на production сервер

---

## 📚 Содержание

1. [Подготовка сервера](#подготовка-сервера)
2. [Установка зависимостей](#установка-зависимостей)
3. [Конфигурация окружения](#конфигурация-окружения)
4. [Docker деплой](#docker-деплой)
5. [Nginx конфигурация](#nginx-конфигурация)
6. [Gunicorn приложение](#gunicorn-приложение)
7. [Celery асинхронные задачи](#celery-асинхронные-задачи)
8. [База данных](#база-данных)
9. [Статические файлы](#статические-файлы)
10. [SSL/HTTPS](#sslhttps)
11. [Мониторинг](#мониторинг)
12. [Чеклист](#чеклист)

---

## 🖥️ Подготовка сервера

### Требования

- **OS:** Ubuntu 20.04+ или CentOS 7+
- **CPU:** 2+ ядра
- **RAM:** 4GB+
- **Disk:** 20GB+ свободного места
- **Python:** 3.11+
- **Node.js:** 18+

### Базовые команды

```bash
# Обновить пакеты
sudo apt update && sudo apt upgrade -y

# Установить Docker и Docker Compose
sudo apt install -y docker.io docker-compose

# Добавить текущего пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker

# Проверить версии
docker --version
docker-compose --version
```

### Создать пользователя для приложения

```bash
# Создать пользователя bugtracker
sudo useradd -m -s /bin/bash bugtracker

# Создать директорию приложения
sudo mkdir -p /home/bugtracker/app
sudo chown bugtracker:bugtracker /home/bugtracker/app

# Перейти в директорию
cd /home/bugtracker/app
```

---

## 📦 Установка зависимостей

### С использованием Docker (рекомендуется)

**1. Создать Dockerfile для бэкенда**

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Установить системные зависимости
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Копировать requirements
COPY requirements.txt .

# Установить Python зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копировать приложение
COPY . .

# Собрать статические файлы
RUN python manage.py collectstatic --noinput

# Порт
EXPOSE 8000

# Команда запуска
CMD ["gunicorn", "bugtracker.wsgi:application", "--bind", "0.0.0.0:8000"]
```

**2. Создать docker-compose.yml**

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:15
    container_name: bugtracker_postgres
    environment:
      POSTGRES_DB: bugtracker
      POSTGRES_USER: bugtracker
      POSTGRES_PASSWORD: secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bugtracker"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: bugtracker_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  web:
    build: .
    container_name: bugtracker_web
    command: gunicorn bugtracker.wsgi:application --bind 0.0.0.0:8000
    environment:
      - DEBUG=False
      - ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
      - DATABASE_URL=postgresql://bugtracker:secure_password_here@postgres:5432/bugtracker
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=your_secret_key_here
    volumes:
      - ./static:/app/static
      - ./media:/app/media
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  celery:
    build: .
    container_name: bugtracker_celery
    command: celery -A bugtracker worker -l info
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://bugtracker:secure_password_here@postgres:5432/bugtracker
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  celery-beat:
    build: .
    container_name: bugtracker_celery_beat
    command: celery -A bugtracker beat -l info
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://bugtracker:secure_password_here@postgres:5432/bugtracker
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

### Без Docker (в Ubuntu)

```bash
# 1. Установить системные зависимости
sudo apt install -y \
  python3.11 \
  python3.11-dev \
  postgresql \
  postgresql-contrib \
  redis-server \
  nginx \
  git \
  curl

# 2. Создать virtual environment
python3.11 -m venv /home/bugtracker/app/venv
source /home/bugtracker/app/venv/bin/activate

# 3. Установить Python зависимости
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# 4. Установить Node для фронтенда
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 5. Запустить PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

---

## ⚙️ Конфигурация окружения

### Создать .env файл

```bash
# .env файл в корне проекта
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
SECRET_KEY=your-super-secret-key-change-this-in-production

# Database
DATABASE_URL=postgresql://bugtracker:password@localhost:5432/bugtracker
DB_ENGINE=django.db.backends.postgresql
DB_NAME=bugtracker
DB_USER=bugtracker
DB_PASSWORD=secure_password_here
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0
CACHE_URL=redis://localhost:6379/1

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=app-specific-password

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Sentry (опционально)
SENTRY_DSN=https://key@sentry.io/project-id

# Frontend
VITE_API_URL=https://yourdomain.com/api/
```

### Генерировать SECRET_KEY

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## 🐳 Docker деплой

### Запустить контейнеры

```bash
# Перейти в директорию проекта
cd /home/bugtracker/app

# Скопировать docker-compose.yml и Dockerfile
cp docker-compose.yml .
cp Dockerfile .

# Запустить контейнеры
docker-compose up -d

# Проверить логи
docker-compose logs -f web

# Выполнить миграции
docker-compose exec web python manage.py migrate

# Создать суперпользователя
docker-compose exec web python manage.py createsuperuser

# Собрать статические файлы
docker-compose exec web python manage.py collectstatic --noinput
```

### Остановить контейнеры

```bash
docker-compose down
```

### Перезапустить контейнеры

```bash
docker-compose restart
```

### Просмотр статуса

```bash
docker-compose ps
```

---

## 🌐 Nginx конфигурация

### Создать конфиг Nginx

```bash
# Создать файл конфигурации
sudo nano /etc/nginx/sites-available/bugtracker

# Или использовать этот файл:
```

```nginx
# /etc/nginx/sites-available/bugtracker

upstream bugtracker_app {
    server 127.0.0.1:8000;
}

# Редирект с HTTP на HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS конфигурация
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL параметры
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Безопасность заголовков
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Размер тела запроса
    client_max_body_size 100M;

    # Gzip сжатие
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;
    gzip_min_length 1024;

    # Django приложение
    location / {
        proxy_pass http://bugtracker_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Статические файлы
    location /static/ {
        alias /home/bugtracker/app/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Медиа файлы
    location /media/ {
        alias /home/bugtracker/app/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Админ панель
    location /admin {
        proxy_pass http://bugtracker_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Активировать конфиг

```bash
# Создать symlink
sudo ln -s /etc/nginx/sites-available/bugtracker /etc/nginx/sites-enabled/

# Проверить конфиг
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx

# Включить автозапуск
sudo systemctl enable nginx
```

---

## 🎯 Gunicorn приложение

### Создать systemd сервис

```bash
# Создать файл сервиса
sudo nano /etc/systemd/system/bugtracker.service
```

```ini
# /etc/systemd/system/bugtracker.service

[Unit]
Description=BugTracker Gunicorn Application
After=network.target
Wants=bugtracker-celery.service

[Service]
Type=notify
User=bugtracker
Group=bugtracker
WorkingDirectory=/home/bugtracker/app

Environment="PATH=/home/bugtracker/app/venv/bin"
EnvironmentFile=/home/bugtracker/app/.env

ExecStart=/home/bugtracker/app/venv/bin/gunicorn \
    --workers 4 \
    --worker-class sync \
    --bind 127.0.0.1:8000 \
    --timeout 60 \
    --access-logfile /var/log/bugtracker/access.log \
    --error-logfile /var/log/bugtracker/error.log \
    bugtracker.wsgi:application

ExecReload=/bin/kill -s HUP $MAINPID
KillMode=process
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Запустить сервис

```bash
# Создать директорию логов
sudo mkdir -p /var/log/bugtracker
sudo chown bugtracker:bugtracker /var/log/bugtracker

# Перезагрузить systemd
sudo systemctl daemon-reload

# Запустить сервис
sudo systemctl start bugtracker

# Включить автозапуск
sudo systemctl enable bugtracker

# Проверить статус
sudo systemctl status bugtracker

# Просмотр логов
sudo tail -f /var/log/bugtracker/error.log
```

---

## 🔄 Celery асинхронные задачи

### Создать сервис Celery Worker

```bash
# Создать файл сервиса
sudo nano /etc/systemd/system/bugtracker-celery.service
```

```ini
# /etc/systemd/system/bugtracker-celery.service

[Unit]
Description=BugTracker Celery Worker
After=network.target redis-server.service

[Service]
Type=forking
User=bugtracker
Group=bugtracker
WorkingDirectory=/home/bugtracker/app

Environment="PATH=/home/bugtracker/app/venv/bin"
EnvironmentFile=/home/bugtracker/app/.env

ExecStart=/home/bugtracker/app/venv/bin/celery \
    -A bugtracker \
    worker \
    --logfile=/var/log/bugtracker/celery.log \
    --pidfile=/run/bugtracker/celery.pid \
    --concurrency=4

ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Создать сервис Celery Beat

```bash
# Создать файл сервиса
sudo nano /etc/systemd/system/bugtracker-celery-beat.service
```

```ini
# /etc/systemd/system/bugtracker-celery-beat.service

[Unit]
Description=BugTracker Celery Beat
After=network.target redis-server.service

[Service]
Type=simple
User=bugtracker
Group=bugtracker
WorkingDirectory=/home/bugtracker/app

Environment="PATH=/home/bugtracker/app/venv/bin"
EnvironmentFile=/home/bugtracker/app/.env

ExecStart=/home/bugtracker/app/venv/bin/celery \
    -A bugtracker \
    beat \
    --logfile=/var/log/bugtracker/celery-beat.log

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Запустить сервисы

```bash
# Перезагрузить systemd
sudo systemctl daemon-reload

# Запустить сервисы
sudo systemctl start bugtracker-celery
sudo systemctl start bugtracker-celery-beat

# Включить автозапуск
sudo systemctl enable bugtracker-celery
sudo systemctl enable bugtracker-celery-beat

# Проверить статус
sudo systemctl status bugtracker-celery
sudo systemctl status bugtracker-celery-beat
```

---

## 🗄️ База данных

### PostgreSQL миграции

```bash
# С Docker
docker-compose exec web python manage.py migrate

# Без Docker
source /home/bugtracker/app/venv/bin/activate
python manage.py migrate
```

### Резервная копия БД

```bash
# Создать бэкап
sudo -u postgres pg_dump bugtracker > /home/bugtracker/backups/bugtracker_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из бэкапа
sudo -u postgres psql bugtracker < /path/to/backup.sql
```

### Установка индексов

```bash
python manage.py shell
```

```python
from django.db import connection
from django.db.models import Model

# Создать индексы для часто используемых полей
with connection.cursor() as cursor:
    # Индекс для проектов по пользователю
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_project_owner ON issues_project(owner_id);')

    # Индекс для задач по проекту
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_issue_project ON issues_issue(project_id);')

    # Индекс для задач по статусу
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_issue_status ON issues_issue(status);')

    # Индекс для поиска по названию
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_issue_title ON issues_issue USING GIN(to_tsvector(\'english\', title));')

print("Индексы созданы успешно!")
```

---

## 📁 Статические файлы

### Собрать статические файлы

```bash
# С Docker
docker-compose exec web python manage.py collectstatic --noinput

# Без Docker
python manage.py collectstatic --noinput
```

### Структура статических файлов

```
staticfiles/
├── admin/          # Django admin
├── rest_framework/ # DRF
└── custom/         # Ваши файлы
```

### Кэширование (CloudFront/CDN)

```bash
# Выполнить collectstatic с хешем
python manage.py collectstatic --noinput --clear

# Скопировать на CDN
aws s3 sync staticfiles/ s3://your-bucket/static/
```

---

## 🔒 SSL/HTTPS

### Получить бесплатный сертификат (Let's Encrypt)

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить сертификат
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Сертификат будет в: /etc/letsencrypt/live/yourdomain.com/

# Автоматический ренью (проверяется два раза в день)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Проверить ренью
sudo certbot renew --dry-run
```

### Настроить HTTPS редирект

```nginx
# Уже есть в конфигурации выше
# HTTP редирект на HTTPS автоматически
```

---

## 📊 Мониторинг

### Логи

```bash
# Gunicorn
sudo tail -f /var/log/bugtracker/error.log

# Nginx
sudo tail -f /var/log/nginx/error.log

# Celery
sudo tail -f /var/log/bugtracker/celery.log

# Systemd
sudo journalctl -u bugtracker -f
```

### Sentry интеграция

```bash
# Установить
pip install sentry-sdk

# В settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    environment="production"
)
```

### Мониторинг производительности

```bash
# Установить Flower для мониторинга Celery
pip install flower

# Запустить Flower
celery -A bugtracker flower --port=5555
# Доступна на http://localhost:5555
```

### Здоровье приложения

```bash
# Создать health check endpoint
curl https://yourdomain.com/api/health/
```

---

## ✅ Чеклист деплоя

### Перед запуском

- [ ] Клонировать репо: `git clone ...`
- [ ] Создать `.env` файл с переменными
- [ ] Установить зависимости: `pip install -r requirements.txt`
- [ ] Выполнить миграции: `python manage.py migrate`
- [ ] Создать суперпользователя: `python manage.py createsuperuser`
- [ ] Собрать статические файлы: `python manage.py collectstatic`
- [ ] Построить Docker образы: `docker-compose build`

### Инфраструктура

- [ ] PostgreSQL запущен и доступен
- [ ] Redis запущен и доступен
- [ ] Nginx установлен и конфигурирован
- [ ] SSL сертификат установлен (Let's Encrypt)
- [ ] Firewall правила настроены (80, 443, 8000)

### Приложение

- [ ] Gunicorn запущен и работает
- [ ] Celery worker запущен и работает
- [ ] Celery beat запущен и работает
- [ ] Статические файлы доступны
- [ ] Админ панель доступна: `/admin/`
- [ ] API доступен: `/api/projects/`

### Безопасность

- [ ] `DEBUG = False`
- [ ] `SECRET_KEY` изменён
- [ ] `ALLOWED_HOSTS` настроены
- [ ] HTTPS редирект работает
- [ ] CSRF токены включены
- [ ] SQL инъекции защита включена
- [ ] XSS защита включена

### Мониторинг

- [ ] Логи направляются в файлы
- [ ] Sentry интегрирован (опционально)
- [ ] Flower запущен для Celery
- [ ] Backup БД настроен (cron job)
- [ ] Alerting настроен

### Финал

- [ ] Протестирована работа всех функций
- [ ] Протестирована обработка ошибок
- [ ] Протестирована авторизация
- [ ] Протестирована асинхронная обработка (Celery)
- [ ] Задокументирована вся конфигурация
- [ ] Команда проинформирована

---

## 🆘 Сложные случаи

### Ошибка "disallowed host"

```python
# settings.py
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
```

### Статические файлы не загружаются

```bash
# Пересобрать
python manage.py collectstatic --noinput --clear

# Проверить в Nginx логах
sudo tail -f /var/log/nginx/error.log
```

### Celery не обрабатывает задачи

```bash
# Проверить статус
sudo systemctl status bugtracker-celery

# Перезапустить
sudo systemctl restart bugtracker-celery

# Логи
sudo tail -f /var/log/bugtracker/celery.log
```

### База данных не отвечает

```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql

# Проверить подключение
psql -U bugtracker -h localhost -d bugtracker
```

---

## 📚 Дальше

- 📖 [SCALING_GUIDE.md](SCALING_GUIDE_FULL.md) - масштабирование
- 🏛️ [ARCHITECTURE.md](ARCHITECTURE_FULL.md) - архитектура системы
- 🐛 [Troubleshooting](TROUBLESHOOTING.md) - решение проблем

---

🚀 **Успешного деплоя!**
