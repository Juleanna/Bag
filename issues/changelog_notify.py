"""Спільна логіка email-розсилок для Changelog.

Викликається з двох місць:
- signals.py: автоматично при створенні нового опублікованого запису
- views_api.py: ручна розсилка через @action notify_subscribers (адмін)

Виокремлено в модуль, щоб обидва шляхи мали ідентичну поведінку.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMessage

from .models import ChangelogEntry, ChangelogSubscription

logger = logging.getLogger(__name__)

TYPE_LABELS = {
    "new": "Нове",
    "imp": "Покращено",
    "fix": "Виправлено",
    "sec": "Безпека",
}


def send_release_email(entry: ChangelogEntry) -> int:
    """Розсилає лист про реліз усім активним підпискам у bcc.

    Повертає кількість адрес, що отримали лист.
    Кидає виняток на SMTP-помилці — щоб ручна кнопка показала причину, а
    не німо "0 листів" (це плутало адміна: підписники є, а кажуть "немає").
    Для автоматичного signal'у виняток ловиться зовні (signals.py).
    """
    subs = list(
        ChangelogSubscription.objects.filter(is_active=True).values_list(
            "email", flat=True
        )
    )
    if not subs:
        return 0
    subject = f"BugTracker · v{entry.version}: {entry.title}"
    lines: list[str] = []
    if entry.summary:
        lines.append(entry.summary)
        lines.append("")
    for c in entry.changes or []:
        if isinstance(c, dict) and c.get("text"):
            lines.append(f"• {TYPE_LABELS.get(c.get('type'), '')}: {c['text']}")
    body = "\n".join(lines).strip() or "Деталі — на сторінці Changelog."
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bugtracker.local")
    EmailMessage(subject, body, from_email, to=[], bcc=subs).send(fail_silently=False)
    return len(subs)
