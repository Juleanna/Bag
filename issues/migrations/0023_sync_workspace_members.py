"""Однократна синхронізація workspace-членства для існуючих ProjectMembership.

Контекст: у поточному стані юзер може бути доданий до проєкту (ProjectMembership),
але не бути учасником workspace, до якого цей проєкт належить. У такому випадку
sidebar (який фільтрує проєкти по активному workspace) не показує цей проєкт,
хоча /bugs повертає його баги.

Ця міграція пробігає по всіх ProjectMembership і додає user'а у workspace.members
кожного проєкту, до якого він належить.
"""

from django.db import migrations


def sync_workspace_memberships(apps, schema_editor):
    ProjectMembership = apps.get_model("issues", "ProjectMembership")
    Workspace = apps.get_model("issues", "Workspace")

    # Для кожного членства у проєкті — додати юзера у всі workspaces цього проєкту.
    for pm in ProjectMembership.objects.select_related("project").iterator():
        workspaces = pm.project.workspaces.all()
        for ws in workspaces:
            ws.members.add(pm.user_id)


def noop(apps, schema_editor):
    """Reverse-міграція не потрібна — нікого не видаляємо."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("issues", "0022_testresult_case_preconditions_snapshot_and_more"),
    ]

    operations = [
        migrations.RunPython(sync_workspace_memberships, reverse_code=noop),
    ]
