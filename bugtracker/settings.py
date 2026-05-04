"""
Налаштування Django для проєкту bugtracker.
"""

import logging.config
import os
from pathlib import Path

import dj_database_url
import environ

from .logging_config import LOGGING

BASE_DIR = Path(__file__).resolve().parent.parent

# DEBUG за замовчуванням False — небезпечно піднімати prod з DEBUG=True
env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

# SECRET_KEY обов'язково має бути заданий у .env; default лише для dev-старту
SECRET_KEY = env("SECRET_KEY", default="dev-secret-key-change-me")
DEBUG = env("DEBUG")
# ALLOWED_HOSTS більше не дозволяє "*" за замовчуванням — задайте список явно
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "rest_framework",
    "corsheaders",
    "django_vite",
    "drf_spectacular",
    # local
    "issues",
    "landing",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "bugtracker.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "bugtracker.wsgi.application"

# База даних — DATABASE_URL у Docker/production, інакше SQLite
DATABASES = {
    "default": dj_database_url.config(
        default=env("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "uk"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Статичні файли
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# CORS
# Не вмикаємо ALLOW_ALL_ORIGINS разом із ALLOW_CREDENTIALS — браузер так не пропустить
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
)

# CSRF
CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
)

# Django Vite
DJANGO_VITE_DEV_MODE = DEBUG
DJANGO_VITE_DEV_SERVER_HOST = env("VITE_HOST", default="localhost")
DJANGO_VITE_DEV_SERVER_PORT = env.int("VITE_PORT", default=5173)
DJANGO_VITE_ASSETS_PATH = BASE_DIR / "frontend" / "dist"
DJANGO_VITE_MANIFEST_PATH = DJANGO_VITE_ASSETS_PATH / "manifest.json"

# Медіа (вкладення)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Обмеження розміру завантажуваних файлів (10 МБ)
MAX_UPLOAD_SIZE = 10 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Email
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@bugtracker.local")
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)

# Базовий URL для посилань у email (підтвердження, скидання пароля)
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173")

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "user": "120/minute",
        "anon": "30/minute",
        # Окремі scope для критичних ендпоінтів — захист від bruteforce
        "login": "10/minute",
        "register": "5/hour",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# drf-spectacular
SPECTACULAR_SETTINGS = {
    "TITLE": "BugTracker API",
    "DESCRIPTION": "API для системи керування проєктами BugTracker",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # Документацію API бачать лише адміністратори
    "SERVE_PERMISSIONS": ["rest_framework.permissions.IsAdminUser"],
}

# Celery
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["application/json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60

# Redis Cache (вмикається лише за наявності REDIS_URL)
REDIS_URL = env("REDIS_URL", default="")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
            "KEY_PREFIX": "bugtracker",
            "TIMEOUT": 300,
        }
    }

# Sentry (вмикається лише за наявності SENTRY_DSN)
SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=0.1)

# Параметри безпеки для production (DEBUG=False)
# Усі вмикаються одночасно — щоб не залишити "наполовину захищений" prod
if not DEBUG:
    SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
    SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=True)
    CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=True)
    SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)  # 1 рік
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool(
        "SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True
    )
    SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=True)
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
    # Довіряємо заголовку від reverse-proxy (Nginx/Cloudflare)
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = False  # потрібен для frontend, що читає токен
    X_FRAME_OPTIONS = "DENY"

# Логування
logging.config.dictConfig(LOGGING)
