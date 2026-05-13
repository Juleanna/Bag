"""Email-нотифікації для модуля підтримки.

Аналогічно до changelog_notify.send_release_email: окремий модуль, що
викликається з signal (новий тікет) і з viewset (новий коментар у тред).
Помилки SMTP кидаються назовні — виклик-сайт сам вирішує ловити чи ні.
"""

import logging

from django.conf import settings as django_settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMessage

from .models import SupportAgentPermission, SupportTicket

logger = logging.getLogger(__name__)
User = get_user_model()


def _from_email() -> str:
    return getattr(django_settings, "DEFAULT_FROM_EMAIL", "noreply@bugtracker.local")


def _agent_emails_for_category(category: str) -> list[str]:
    """Список email-адрес адмінів і агентів з доступом до категорії.
    Без дублікатів. Пусті email пропускаються."""
    emails: set[str] = set()
    # Адміни (мають доступ до всього)
    for u in User.objects.filter(is_staff=True):
        if u.email:
            emails.add(u.email)
    # Агенти з can_view_all або відповідною категорією
    perms = SupportAgentPermission.objects.select_related("user").all()
    for p in perms:
        if not p.user.email:
            continue
        if p.can_view_all or category in (p.categories or []):
            emails.add(p.user.email)
    return list(emails)


def notify_new_ticket(ticket: SupportTicket) -> int:
    """Шле лист агентам/адмінам про новий тікет. Повертає кількість адрес.
    Кидає виняток на SMTP-помилці."""
    recipients = _agent_emails_for_category(ticket.category)
    # Не нотифікуємо самого автора (якщо він агент)
    author_email = getattr(ticket.submitted_by, "email", "") or ticket.submitted_email
    if author_email:
        recipients = [e for e in recipients if e != author_email]
    if not recipients:
        return 0
    subject = f"Нове звернення: {ticket.subject}"
    submitter = (
        ticket.submitted_by.username
        if ticket.submitted_by
        else ticket.submitted_email or "анонім"
    )
    body = (
        f"Категорія: {ticket.category}\n"
        f"Пріоритет: {ticket.get_priority_display()}\n"
        f"Від: {submitter}\n\n"
        f"{ticket.description or '(опис не задано)'}"
    )
    EmailMessage(subject, body, _from_email(), to=[], bcc=recipients).send(
        fail_silently=False
    )
    return len(recipients)


def notify_reply(ticket: SupportTicket, comment, is_staff_reply: bool) -> int:
    """Шле лист про нову відповідь у треді:
      - staff_reply → автору тікета (на email, що він залишив)
      - user-uplift → агентам з доступом до категорії
    """
    if is_staff_reply:
        to_email = (
            ticket.submitted_by.email
            if ticket.submitted_by and ticket.submitted_by.email
            else ticket.submitted_email
        )
        if not to_email:
            return 0
        subject = f"Відповідь на ваше звернення: {ticket.subject}"
        author = comment.author.username if comment.author else "Саппорт"
        body = f"{author} відповів:\n\n{comment.body}"
        EmailMessage(subject, body, _from_email(), to=[to_email]).send(
            fail_silently=False
        )
        return 1
    # user-uplift → агенти
    recipients = _agent_emails_for_category(ticket.category)
    # Виключаємо автора повідомлення (він не хоче лист на себе)
    if comment.author and comment.author.email:
        recipients = [e for e in recipients if e != comment.author.email]
    if not recipients:
        return 0
    subject = f"Нова репліка у звернені: {ticket.subject}"
    author = comment.author.username if comment.author else "користувач"
    body = f"{author} додав уточнення:\n\n{comment.body}"
    EmailMessage(subject, body, _from_email(), to=[], bcc=recipients).send(
        fail_silently=False
    )
    return len(recipients)
