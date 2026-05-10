"""Перехід Project.workspace (FK) → Project.workspaces (M2M).

Три кроки в одній міграції:
 1. AddField workspaces (M2M) — обидва поля співіснують тимчасово.
 2. RunPython — копіюємо workspace_id у workspaces.
 3. RemoveField workspace — видаляємо стару колонку.
"""
from django.db import migrations, models


def copy_workspace_to_m2m(apps, schema_editor):
    Project = apps.get_model("issues", "Project")
    for project in Project.objects.exclude(workspace__isnull=True):
        project.workspaces.add(project.workspace_id)


def copy_back_first_workspace(apps, schema_editor):
    Project = apps.get_model("issues", "Project")
    for project in Project.objects.all():
        first = project.workspaces.first()
        if first:
            project.workspace_id = first.id
            project.save(update_fields=["workspace"])


class Migration(migrations.Migration):

    dependencies = [
        ("issues", "0016_seed_default_region"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="workspaces",
            field=models.ManyToManyField(
                blank=True, related_name="projects", to="issues.workspace"
            ),
        ),
        migrations.RunPython(copy_workspace_to_m2m, copy_back_first_workspace),
        migrations.RemoveField(
            model_name="project",
            name="workspace",
        ),
    ]
