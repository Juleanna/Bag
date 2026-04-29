"""
Тести валідації вкладень: розмір, тип файлу.
"""

import pytest
from django.core.exceptions import ValidationError


@pytest.mark.django_db
class TestAttachmentValidation:
    def test_oversized_file_rejected(self, project, user, large_file):
        """Файл >10 МБ має бути відхилено валідатором."""
        from issues.models import Attachment, Issue

        issue = Issue.objects.create(project=project, reporter=user, title="x")
        attachment = Attachment(issue=issue, uploader=user, file=large_file, name="big.txt")
        with pytest.raises(ValidationError):
            attachment.full_clean()

    def test_html_extension_rejected(self, project, user, html_file):
        """HTML-файл — поза whitelist'ом, має бути відхилено."""
        from issues.models import Attachment, Issue

        issue = Issue.objects.create(project=project, reporter=user, title="x")
        attachment = Attachment(issue=issue, uploader=user, file=html_file, name="evil.html")
        with pytest.raises(ValidationError):
            attachment.full_clean()

    def test_allowed_extension_accepted(self, project, user, small_file):
        from issues.models import Attachment, Issue

        issue = Issue.objects.create(project=project, reporter=user, title="x")
        attachment = Attachment(issue=issue, uploader=user, file=small_file, name="test.txt")
        # Не повинно кидати
        attachment.full_clean()
