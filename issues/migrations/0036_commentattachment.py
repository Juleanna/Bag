# Generated for CommentAttachment — медіа-вкладення до коментарів

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import issues.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("issues", "0035_alter_changelogentry_options"),
    ]

    operations = [
        migrations.CreateModel(
            name="CommentAttachment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "file",
                    models.FileField(
                        upload_to="comment_attachments/%Y/%m/%d/",
                        validators=[
                            django.core.validators.FileExtensionValidator(
                                allowed_extensions=issues.models.ALLOWED_FILE_EXTENSIONS
                            ),
                            issues.models.validate_comment_file_size,
                        ],
                    ),
                ),
                ("name", models.CharField(blank=True, max_length=255)),
                ("content_type", models.CharField(blank=True, max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "comment",
                    models.ForeignKey(
                        db_index=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="attachments",
                        to="issues.comment",
                    ),
                ),
                (
                    "uploader",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="uploaded_comment_attachments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["created_at", "id"],
                "indexes": [
                    models.Index(
                        fields=["comment", "created_at"],
                        name="issues_comm_comment_8aff45_idx",
                    ),
                ],
            },
        ),
    ]
