"""Активує pg_trgm extension для trigram-similarity (виявлення дублікатів).

TrigramExtension з django.contrib.postgres.operations працює тільки на
Postgres — на SQLite (тести/локально) операція стає no-op автоматично.
"""

from django.contrib.postgres.operations import TrigramExtension
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("issues", "0033_alter_notification_kind"),
    ]

    operations = [
        TrigramExtension(),
    ]
