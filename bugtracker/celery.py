"""
Celery configuration for BugTracker.
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bugtracker.settings")

app = Celery("bugtracker")

# Load configuration from Django settings, all configuration keys should have a 'CELERY' prefix
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
