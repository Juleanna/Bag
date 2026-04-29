"""
Тести системи запрошень: токен write-only, email-перевірка, чужий проєкт не бачимо.
"""

import pytest


@pytest.mark.django_db
class TestInvitationSecurity:
    def test_token_not_returned_in_get(self, api_client, user, project):
        from issues.models import Invitation

        Invitation.objects.create(
            project=project, email="x@e.com", role="member", token="SECRET_TOKEN"
        )
        api_client.force_login(user)
        response = api_client.get(f"/api/invitations/?project={project.id}")
        assert response.status_code == 200
        results = response.json().get("results", response.json())
        for inv in results:
            # Токен повинен бути write-only — немає в GET-відповіді
            assert "token" not in inv or inv["token"] is None or inv["token"] == ""

    def test_cannot_see_invitations_of_foreign_project(
        self, api_client, make_user, make_project
    ):
        from issues.models import Invitation

        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)
        Invitation.objects.create(
            project=project, email="x@e.com", role="member", token="SECRET"
        )

        api_client.force_login(intruder)
        response = api_client.get("/api/invitations/")
        results = response.json().get("results", response.json())
        # Інвайтів не видно (чужий проєкт)
        assert len(results) == 0

    def test_accept_with_correct_email(self, api_client, make_user, make_project):
        from issues.models import Invitation, ProjectMembership

        owner = make_user()
        invitee = make_user(email="invitee@e.com")
        project = make_project(owner=owner)
        Invitation.objects.create(
            project=project, email="invitee@e.com", role="member", token="TOK123"
        )

        api_client.force_login(invitee)
        response = api_client.post(
            "/api/invitations/accept/", {"token": "TOK123"}, format="json"
        )
        assert response.status_code == 200
        assert ProjectMembership.objects.filter(project=project, user=invitee).exists()

    def test_accept_with_wrong_email_rejected(self, api_client, make_user, make_project):
        from issues.models import Invitation

        owner = make_user()
        wrong = make_user(email="wrong@e.com")
        project = make_project(owner=owner)
        Invitation.objects.create(
            project=project, email="invitee@e.com", role="member", token="TOK456"
        )

        api_client.force_login(wrong)
        response = api_client.post(
            "/api/invitations/accept/", {"token": "TOK456"}, format="json"
        )
        assert response.status_code == 403

    def test_accept_invalid_token(self, api_client, user):
        api_client.force_login(user)
        response = api_client.post(
            "/api/invitations/accept/", {"token": "NONEXISTENT"}, format="json"
        )
        assert response.status_code == 400
