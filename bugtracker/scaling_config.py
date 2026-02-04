"""
Production-ready database and caching configuration.
"""

# Database optimization for production
# Use PostgreSQL in production:
# pip install psycopg2-binary
#
# .env example:
# DATABASE_URL=postgres://user:password@localhost:5432/bugtracker
#
# Then in settings.py:
# DATABASES = {
#     'default': dj_database_url.config(
#         default=env('DATABASE_URL'),
#         conn_max_age=600
#     )
# }

# Redis Cache Configuration
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "redis.StrictRedis",
        },
        "KEY_PREFIX": "bugtracker",
        "TIMEOUT": 300,  # 5 minutes default
    }
}

# Cache timeout settings
CACHE_TIMEOUTS = {
    "PROJECTS_LIST": 300,  # 5 minutes
    "ISSUES_LIST": 60,  # 1 minute
    "USER_PROJECTS": 600,  # 10 minutes
    "LABELS": 3600,  # 1 hour
}

# Database query optimization
DATABASE_CONFIG = {
    "CONN_MAX_AGE": 600,  # Keep connections alive for 10 minutes
    "ATOMIC_REQUESTS": True,  # Use transactions for data consistency
    "AUTOCOMMIT": True,
}
