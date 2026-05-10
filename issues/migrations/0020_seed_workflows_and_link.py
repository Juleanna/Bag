"""Заповнення WorkflowStatus для існуючих проєктів і прив'язка issue.workflow_status
до відповідного статусу за ключем (issue.status)."""
from django.db import migrations


DEFAULTS = [
    ("open", "Відкрито", "var(--st-open-dot)", False, True, 0),
    ("in_progress", "В процесі", "var(--st-progress-dot)", False, False, 1),
    ("blocked", "Заблоковано", "var(--st-blocked-dot)", False, False, 2),
    ("done", "Готово", "var(--st-resolved-dot)", True, False, 3),
    ("cancelled", "Скасовано", "var(--st-closed-dot)", True, False, 4),
]


def seed_and_link(apps, schema_editor):
    Project = apps.get_model("issues", "Project")
    Issue = apps.get_model("issues", "Issue")
    WorkflowStatus = apps.get_model("issues", "WorkflowStatus")

    # Створюємо дефолтні WorkflowStatus для всіх проєктів
    for project in Project.objects.all():
        for key, label, color, is_done, is_default, order in DEFAULTS:
            WorkflowStatus.objects.get_or_create(
                project=project,
                key=key,
                defaults={
                    "label": label,
                    "color": color,
                    "is_done": is_done,
                    "is_default": is_default,
                    "sort_order": order,
                },
            )

    # Привʼязуємо issue.workflow_status за key == issue.status
    for issue in Issue.objects.select_related("project").all():
        ws = WorkflowStatus.objects.filter(
            project=issue.project, key=issue.status
        ).first()
        if ws is None:
            # Невідомий статус — створюємо ad-hoc запис
            ws = WorkflowStatus.objects.create(
                project=issue.project,
                key=issue.status,
                label=issue.status.replace("_", " ").title(),
                color="var(--st-open-dot)",
                sort_order=99,
                is_done=issue.status in ("done", "cancelled"),
            )
        issue.workflow_status = ws
        issue.save(update_fields=["workflow_status"])


def unlink(apps, schema_editor):
    Issue = apps.get_model("issues", "Issue")
    Issue.objects.all().update(workflow_status=None)


class Migration(migrations.Migration):

    dependencies = [
        ("issues", "0019_issue_workflow_status"),
    ]

    operations = [
        migrations.RunPython(seed_and_link, unlink),
    ]
