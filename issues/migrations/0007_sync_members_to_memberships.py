"""
Дата-міграція: синхронізує існуючі Project.members у ProjectMembership.

ВАЖЛИВО: ця міграція має виконатись ПЕРЕД переходом Project.members на
through=ProjectMembership, інакше при зміні поля Django видалить
auto-generated through-таблицю (issues_project_members) разом з усіма
записами учасників — а вони ще не перенесені у ProjectMembership.
"""

from django.db import migrations


def sync_members_forward(apps, schema_editor):
    """Копіює всіх учасників і власників проєктів у ProjectMembership."""
    Project = apps.get_model("issues", "Project")
    ProjectMembership = apps.get_model("issues", "ProjectMembership")

    for project in Project.objects.all():
        # Власник завжди має роль OWNER
        ProjectMembership.objects.get_or_create(
            project=project,
            user=project.owner,
            defaults={"role": "owner"},
        )
        # Інші учасники — роль MEMBER (якщо запис ще не існує)
        for user in project.members.all():
            if user.id == project.owner_id:
                continue
            ProjectMembership.objects.get_or_create(
                project=project,
                user=user,
                defaults={"role": "member"},
            )


def sync_members_reverse(apps, schema_editor):
    """
    Зворотна міграція: додає всіх учасників з ProjectMembership назад у Project.members.
    Безпечно — операції ідемпотентні.
    """
    Project = apps.get_model("issues", "Project")
    ProjectMembership = apps.get_model("issues", "ProjectMembership")

    for membership in ProjectMembership.objects.all():
        membership.project.members.add(membership.user)


class Migration(migrations.Migration):

    dependencies = [
        ("issues", "0006_alter_attachment_file_alter_invitation_role_and_more"),
    ]

    operations = [
        migrations.RunPython(sync_members_forward, sync_members_reverse),
    ]
