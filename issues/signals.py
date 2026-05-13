"""
Сигнали для:
1. LoginEvent — фіксує успішні і невдалі логіни
2. Webhook delivery — відправляє outgoing webhooks при подіях issue/comment
"""

import hashlib
import hmac
import logging

from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import (
    ChangelogEntry,
    ChangelogSubscription,
    Comment,
    Issue,
    LoginEvent,
    Project,
    ProjectMembership,
    TestRun,
    Webhook,
    WebhookDelivery,
    WorkflowStatus,
)


@receiver(post_save, sender=ProjectMembership)
def _sync_workspace_membership(sender, instance, created, **kwargs):
    """Додає користувача у всі workspaces проєкту при додаванні до проєкту.

    Інакше юзер не побачить проєкт у sidebar (він фільтрує по активному workspace),
    хоча через ProjectMembership формально має доступ до багів проєкту.
    """
    if not created:
        return
    try:
        for ws in instance.project.workspaces.all():
            ws.members.add(instance.user_id)
    except Exception:
        logging.getLogger(__name__).exception(
            "Не вдалося синхронізувати workspace-членство для membership %s", instance.pk
        )


# Дефолтний набір статусів, що створюється для кожного нового проєкту.
DEFAULT_WORKFLOW = [
    {"key": "open", "label": "Відкрито", "color": "var(--st-open-dot)", "is_done": False, "is_default": True},
    {"key": "in_progress", "label": "В процесі", "color": "var(--st-progress-dot)", "is_done": False, "is_default": False},
    {"key": "blocked", "label": "Заблоковано", "color": "var(--st-blocked-dot)", "is_done": False, "is_default": False},
    {"key": "done", "label": "Готово", "color": "var(--st-resolved-dot)", "is_done": True, "is_default": False},
    {"key": "cancelled", "label": "Скасовано", "color": "var(--st-closed-dot)", "is_done": True, "is_default": False},
]


@receiver(post_save, sender=Project)
def _seed_workflow_for_new_project(sender, instance, created, **kwargs):
    """Створює дефолтні WorkflowStatus при створенні нового проєкту."""
    if not created:
        return
    for i, s in enumerate(DEFAULT_WORKFLOW):
        WorkflowStatus.objects.get_or_create(
            project=instance,
            key=s["key"],
            defaults={
                "label": s["label"],
                "color": s["color"],
                "is_done": s["is_done"],
                "is_default": s["is_default"],
                "sort_order": i,
            },
        )

logger = logging.getLogger(__name__)


def _client_ip(request):
    if request is None:
        return None
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


@receiver(user_logged_in)
def _on_login_success(sender, request, user, **kwargs):
    LoginEvent.objects.create(
        user=user,
        username_attempted=user.username,
        success=True,
        ip_address=_client_ip(request),
        user_agent=(request.META.get("HTTP_USER_AGENT", "") if request else "")[:255],
        method="password",
    )


@receiver(user_login_failed)
def _on_login_failure(sender, credentials, request, **kwargs):
    LoginEvent.objects.create(
        user=None,
        username_attempted=str(credentials.get("username", ""))[:150],
        success=False,
        ip_address=_client_ip(request),
        user_agent=(request.META.get("HTTP_USER_AGENT", "") if request else "")[:255],
        method="password",
    )


# ============================================================================
# Webhook delivery
# ============================================================================


def _deliver_webhook(event: str, payload: dict, project_id=None):
    """
    Викликає всі активні webhooks, що підписалися на event.
    Помилки логуються у WebhookDelivery, не падають у синхронному коді.
    """
    try:
        import requests  # noqa: WPS433
    except ImportError:
        logger.warning("requests не встановлено — webhooks не доставлено")
        return

    qs = Webhook.objects.filter(is_active=True)
    if project_id is not None:
        from django.db.models import Q

        qs = qs.filter(Q(project_id=project_id) | Q(project__isnull=True))
    else:
        qs = qs.filter(project__isnull=True)

    for hook in qs:
        events = hook.events or []
        if event not in events:
            continue

        body = {"event": event, "payload": payload}
        headers = {"Content-Type": "application/json", "X-BugTracker-Event": event}
        if hook.secret:
            import json

            sig = hmac.new(
                hook.secret.encode("utf-8"),
                json.dumps(body, separators=(",", ":")).encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()
            headers["X-BugTracker-Signature"] = f"sha256={sig}"

        delivery = WebhookDelivery(webhook=hook, event=event, payload=payload)
        try:
            r = requests.post(hook.url, json=body, headers=headers, timeout=5)
            delivery.status_code = r.status_code
            delivery.response_body = r.text[:2000]
            from django.utils import timezone as tz

            hook.last_called_at = tz.now()
            hook.last_status_code = r.status_code
            hook.save(update_fields=["last_called_at", "last_status_code"])
        except Exception as exc:
            delivery.error = str(exc)[:1000]
        delivery.save()


@receiver(post_save, sender=Issue)
def _issue_saved(sender, instance, created, **kwargs):
    event = "issue.created" if created else "issue.updated"
    if instance.status in ("done", "cancelled") and not created:
        event = "issue.closed"
    _deliver_webhook(
        event,
        {
            "id": instance.id,
            "title": instance.title,
            "status": instance.status,
            "priority": instance.priority,
            "project": instance.project_id,
            "assignee": instance.assignee_id,
        },
        project_id=instance.project_id,
    )


@receiver(post_save, sender=Comment)
def _comment_saved(sender, instance, created, **kwargs):
    if not created:
        return
    _deliver_webhook(
        "comment.created",
        {
            "id": instance.id,
            "issue": instance.issue_id,
            "author": instance.author_id,
            "body": instance.body[:500],
        },
        project_id=instance.issue.project_id,
    )


@receiver(post_save, sender=TestRun)
def _test_run_saved(sender, instance, created, **kwargs):
    if instance.status != TestRun.Status.COMPLETED:
        return
    _deliver_webhook(
        "test_run.completed",
        {
            "id": instance.id,
            "name": instance.name,
            "project": instance.project_id,
        },
        project_id=instance.project_id,
    )


@receiver(post_save, sender=ChangelogEntry)
def _changelog_entry_saved(sender, instance, created, **kwargs):
    """При публікації нового запису розсилаємо email активним підписникам.

    Тригер: created=True І is_published=True. Чернетки (is_published=False)
    не повідомляють підписників — навіть якщо їх пізніше опублікують.
    Це навмисно: edit існуючого запису не дзвонить листи повторно.
    """
    if not created or not instance.is_published:
        return
    try:
        from django.conf import settings
        from django.core.mail import EmailMessage

        subs = list(
            ChangelogSubscription.objects.filter(is_active=True).values_list(
                "email", flat=True
            )
        )
        if not subs:
            return
        subject = f"BugTracker · v{instance.version}: {instance.title}"
        type_labels = {"new": "Нове", "imp": "Покращено", "fix": "Виправлено", "sec": "Безпека"}
        lines = [instance.summary, ""]
        for c in instance.changes or []:
            if isinstance(c, dict) and c.get("text"):
                lines.append(f"• {type_labels.get(c.get('type'), '')}: {c['text']}")
        body = "\n".join(lines).strip() or "Деталі — на сторінці Changelog."
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bugtracker.local")
        # bcc, щоб підписники не бачили одне одного
        EmailMessage(subject, body, from_email, to=[], bcc=subs).send(fail_silently=True)
    except Exception:
        logger.exception("Не вдалося розіслати changelog-нотифікації")

