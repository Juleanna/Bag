"""
Тести захищеного завантаження вкладень.
"""

import pytest


@pytest.mark.django_db
class TestMediaProtection:
    def test_member_can_download(
        self, api_client, user, project, make_issue, small_file
    ):
        from issues.models import Attachment

        issue = make_issue(project=project, reporter=user)
        attachment = Attachment.objects.create(
            issue=issue, uploader=user, file=small_file, name="test.txt"
        )

        api_client.force_login(user)
        response = api_client.get(f"/api/attachments/{attachment.id}/download/")
        assert response.status_code == 200

    def test_outsider_gets_404(
        self, api_client, make_user, make_project, make_issue, small_file
    ):
        from issues.models import Attachment

        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)
        issue = make_issue(project=project, reporter=owner)
        attachment = Attachment.objects.create(
            issue=issue, uploader=owner, file=small_file, name="secret.txt"
        )

        api_client.force_login(intruder)
        response = api_client.get(f"/api/attachments/{attachment.id}/download/")
        assert response.status_code == 404

    def test_anonymous_gets_403(
        self, api_client, user, project, make_issue, small_file
    ):
        from issues.models import Attachment

        issue = make_issue(project=project, reporter=user)
        attachment = Attachment.objects.create(
            issue=issue, uploader=user, file=small_file, name="x.txt"
        )

        response = api_client.get(f"/api/attachments/{attachment.id}/download/")
        assert response.status_code in (401, 403)
