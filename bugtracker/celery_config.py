# Celery Configuration for async tasks
# Install: pip install celery redis

CELERY_BROKER_URL = "redis://localhost:6379/0"
CELERY_RESULT_BACKEND = "redis://localhost:6379/0"
CELERY_ACCEPT_CONTENT = ["application/json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes

# Task routing
CELERY_TASK_ROUTES = {
    "issues.tasks.send_notification": {"queue": "notifications"},
    "issues.tasks.export_issues": {"queue": "exports"},
    "issues.tasks.send_digest": {"queue": "emails"},
}

# Task time limits
CELERY_TASK_SOFT_TIME_LIMIT = 20 * 60  # 20 minutes
CELERY_TASK_HARD_TIME_LIMIT = 30 * 60  # 30 minutes
