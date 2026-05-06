from django.apps import AppConfig


class IssuesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "issues"

    def ready(self):
        # Реєстрація сигналів (login events, webhook delivery)
        from . import signals  # noqa: F401
