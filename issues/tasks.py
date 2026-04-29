"""
Фонові завдання Celery для BugTracker.
"""

import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3)
def send_issue_notification(self, issue_id, action="created"):
    """Надсилає сповіщення на email при створенні / оновленні задачі."""
    from .models import Issue

    try:
        issue = Issue.objects.select_related("project", "reporter", "assignee").get(
            id=issue_id
        )
    except Issue.DoesNotExist:
        # Задачу видалили — ретраїти безглуздо
        logger.warning("Задачу %s не знайдено для надсилання сповіщення", issue_id)
        return

    members = issue.project.members.exclude(id=issue.reporter_id)

    try:
        for member in members:
            if not member.email:
                continue
            send_mail(
                subject=f"[{issue.project.name}] {action}: {issue.title}",
                message=(
                    f"Задачу '{issue.title}' було {action} у проєкті "
                    f"'{issue.project.name}'.\n"
                    f"Статус: {issue.get_status_display()}\n"
                    f"Пріоритет: {issue.get_priority_display()}\n"
                    f"Автор: {issue.reporter.username}"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[member.email],
                fail_silently=True,
            )
        logger.info("Надіслано сповіщення для задачі %s (%s)", issue_id, action)
    except Exception as exc:
        # Ретраїмо лише транспортні помилки розсилки
        logger.error("Помилка надсилання сповіщення для задачі %s: %s", issue_id, exc)
        raise self.retry(exc=exc, countdown=60) from exc


@shared_task
def send_weekly_digest(user_id):
    """Надсилає тижневий дайджест призначених задач користувачу."""
    from .models import Issue  # noqa: F401  — імпорт для autodiscover

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning("Користувача %s не знайдено для дайджеста", user_id)
        return

    week_ago = timezone.now() - timedelta(days=7)
    assigned = user.assigned_issues.filter(updated_at__gte=week_ago).select_related(
        "project"
    )

    if not assigned.exists() or not user.email:
        return

    lines = [
        f"- [{i.project.name}] {i.title} ({i.get_status_display()})" for i in assigned
    ]
    try:
        send_mail(
            subject="BugTracker: тижневий дайджест",
            message=(
                f"Привіт, {user.username}!\n\n"
                "Ваші задачі, оновлені за тиждень:\n" + "\n".join(lines)
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
        logger.info("Надіслано дайджест користувачу %s", user.email)
    except Exception as exc:
        logger.error("Помилка дайджеста для користувача %s: %s", user_id, exc)
