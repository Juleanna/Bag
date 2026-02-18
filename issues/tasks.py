"""
Background tasks for BugTracker using Celery.
"""

from celery import shared_task
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3)
def send_issue_notification(self, issue_id, action="created"):
    """Send notification when issue is created/updated."""
    from .models import Issue

    try:
        issue = Issue.objects.select_related("project", "reporter", "assignee").get(
            id=issue_id
        )
        members = issue.project.members.exclude(id=issue.reporter_id)

        for member in members:
            if member.email:
                send_mail(
                    subject=f"[{issue.project.name}] Issue {action}: {issue.title}",
                    message=(
                        f"Issue '{issue.title}' was {action} in project "
                        f"'{issue.project.name}'.\n"
                        f"Status: {issue.get_status_display()}\n"
                        f"Priority: {issue.get_priority_display()}\n"
                        f"Reporter: {issue.reporter.username}"
                    ),
                    from_email="noreply@bugtracker.com",
                    recipient_list=[member.email],
                    fail_silently=True,
                )
        logger.info("Sent notification for issue %s (%s)", issue_id, action)
    except Exception as exc:
        logger.error("Error sending notification for issue %s: %s", issue_id, exc)
        self.retry(exc=exc, countdown=60)


@shared_task
def send_weekly_digest(user_id):
    """Send weekly digest of assigned issues to user."""
    from .models import Issue
    from django.utils import timezone
    from datetime import timedelta

    try:
        user = User.objects.get(id=user_id)
        week_ago = timezone.now() - timedelta(days=7)
        assigned = user.assigned_issues.filter(
            updated_at__gte=week_ago
        ).select_related("project")

        if assigned.exists() and user.email:
            lines = [
                f"- [{i.project.name}] {i.title} ({i.get_status_display()})"
                for i in assigned
            ]
            send_mail(
                subject="BugTracker: Weekly Digest",
                message=(
                    f"Hi {user.username},\n\n"
                    "Your issues updated this week:\n" + "\n".join(lines)
                ),
                from_email="noreply@bugtracker.com",
                recipient_list=[user.email],
                fail_silently=True,
            )
            logger.info("Sent weekly digest to %s", user.email)
    except Exception as exc:
        logger.error("Digest error for user %s: %s", user_id, exc)
