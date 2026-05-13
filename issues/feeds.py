"""RSS feed для сторінки Changelog.

Реалізовано через django.contrib.syndication. Віддає лише опубліковані
записи. URL — /api/changelog/feed.rss.
"""

from django.contrib.syndication.views import Feed
from django.urls import reverse

from .models import ChangelogEntry


class ChangelogFeed(Feed):
    title = "BugTracker · Changelog"
    description = "Історія релізів BugTracker"
    link = "/changelog"

    def items(self):
        return ChangelogEntry.objects.filter(is_published=True).order_by(
            "-release_date", "-id"
        )[:30]

    def item_title(self, item: ChangelogEntry) -> str:
        return f"v{item.version} · {item.title}"

    def item_description(self, item: ChangelogEntry) -> str:
        parts = []
        if item.summary:
            parts.append(f"<p>{item.summary}</p>")
        if item.changes:
            parts.append("<ul>")
            type_labels = {
                "new": "Нове",
                "imp": "Покращено",
                "fix": "Виправлено",
                "sec": "Безпека",
            }
            for c in item.changes:
                if not isinstance(c, dict):
                    continue
                label = type_labels.get(c.get("type"), "")
                text = c.get("text", "")
                parts.append(f"<li><b>{label}:</b> {text}</li>")
            parts.append("</ul>")
        return "".join(parts)

    def item_link(self, item: ChangelogEntry) -> str:
        return f"/changelog#v{item.version}"

    def item_pubdate(self, item: ChangelogEntry):
        # Конвертуємо date → datetime опівночі UTC (RSS вимагає datetime)
        from datetime import datetime, time, timezone

        return datetime.combine(item.release_date, time.min, tzinfo=timezone.utc)
