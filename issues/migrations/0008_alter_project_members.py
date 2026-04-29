"""
Перехід Project.members на explicit through-модель ProjectMembership.

Django не дозволяє AlterField для додавання `through=` до M2M
(ValueError: cannot alter to or from M2M fields ... add or remove through=).
Тому виконуємо це у два кроки: RemoveField → AddField.

ВАЖЛИВО: RemoveField для M2M видаляє auto-generated through-таблицю
(issues_project_members) разом із записами. Дані вже синхронізовано у
ProjectMembership міграцією 0007 — втрати немає.
"""

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("issues", "0007_sync_members_to_memberships"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Видаляємо auto-generated through (issues_project_members).
        # Дані вже в ProjectMembership (див. міграцію 0007).
        migrations.RemoveField(
            model_name="project",
            name="members",
        ),
        # Додаємо M2M через explicit through-модель.
        # Фізично таблицю не створюємо — ProjectMembership вже існує.
        migrations.AddField(
            model_name="project",
            name="members",
            field=models.ManyToManyField(
                blank=True,
                related_name="projects",
                through="issues.ProjectMembership",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
