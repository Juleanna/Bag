# syntax=docker/dockerfile:1.6
# Multi-stage Dockerfile для BugTracker
# - frontend stage: збирає Vite-bundle
# - python-builder: компілює залежності у wheel-кеш
# - runtime: мінімальний образ без build-tools

# ============================================================================
# Stage 1: Frontend build (Vite + TS)
# ============================================================================
FROM node:20-alpine AS frontend
WORKDIR /app/frontend

# Спершу копіюємо лише package.json для кращого кешування шару
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Потім копіюємо решту і збираємо
COPY frontend/ ./
RUN npm run build

# ============================================================================
# Stage 2: Python build (wheel-кеш для швидшого фінального шару)
# ============================================================================
FROM python:3.11-slim AS python-builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /build

# Build deps лише на цьому етапі — у фінал не потрапляють
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir=/wheels -r requirements.txt

# ============================================================================
# Stage 3: Runtime — мінімальний образ
# ============================================================================
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

# Тільки runtime-залежності (libpq для psycopg2, curl для healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

# Непривілейований користувач
RUN useradd -m -u 1000 bugtracker
WORKDIR /app

# Встановлюємо python пакети з wheel-кешу
COPY --from=python-builder /wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels

# Копіюємо backend
COPY --chown=bugtracker:bugtracker . .

# Готовий frontend-bundle із попереднього stage
COPY --from=frontend --chown=bugtracker:bugtracker /app/frontend/dist ./frontend/dist

# collectstatic запускаємо у build-time, щоб образ був готовий до запуску
RUN python manage.py collectstatic --noinput || true

USER bugtracker

EXPOSE 8000

# Healthcheck: контейнер вважається unhealthy, якщо liveness не відповідає
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8000/api/health/live/ || exit 1

CMD ["gunicorn", "bugtracker.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
