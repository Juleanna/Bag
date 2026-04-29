"""
Тести IDOR для Issue, Comment, Attachment.
Перевіряємо, що чужий користувач не може створити/редагувати/видалити елементи у чужому проєкті.
"""

import pytest


@pytest.mark.django_db
class TestIssueIDOR:
    def test_cannot_list_others_issues(self, api_client, make_user, make_project, make_issue):
        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)
        make_issue(project=project, reporter=owner, title="Secret Bug")

        api_client.force_login(intruder)
        response = api_client.get("/api/issues/")

        assert response.status_code == 200
        titles = [i["title"] for i in response.json()["results"]]
        assert "Secret Bug" not in titles

    def test_cannot_retrieve_others_issue(self, api_client, make_user, make_project, make_issue):
        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)
        issue = make_issue(project=project, reporter=owner)

        api_client.force_login(intruder)
        response = api_client.get(f"/api/issues/{issue.id}/")

        assert response.status_code == 404

    def test_cannot_create_issue_in_foreign_project(
        self, api_client, make_user, make_project
    ):
        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)

        api_client.force_login(intruder)
        response = api_client.post(
            "/api/issues/",
            {"project": project.id, "title": "Pwned", "description": ""},
            format="json",
        )

        # Серіалізатор обмежує project queryset користувача → 400 (invalid choice)
        assert response.status_code == 400
        from issues.models import Issue

        assert not Issue.objects.filter(title="Pwned").exists()

    def test_cannot_move_issue_to_foreign_project(
        self, api_client, make_user, make_project, make_issue
    ):
        user = make_user()
        my_project = make_project(owner=user, name="Mine")
        foreign_owner = make_user()
        foreign_project = make_project(owner=foreign_owner, name="Foreign")
        issue = make_issue(project=my_project, reporter=user)

        api_client.force_login(user)
        response = api_client.patch(
            f"/api/issues/{issue.id}/",
            {"project": foreign_project.id},
            format="json",
        )

        # Або 400 (validate_project), або 404 (queryset не містить чужий проєкт)
        assert response.status_code in (400, 404)
        issue.refresh_from_db()
        assert issue.project_id == my_project.id

    def test_cannot_assign_to_unrelated_user(
        self, api_client, make_user, make_project, make_issue
    ):
        user = make_user()
        outsider = make_user()
        project = make_project(owner=user)
        issue = make_issue(project=project, reporter=user)

        api_client.force_login(user)
        response = api_client.patch(
            f"/api/issues/{issue.id}/", {"assignee": outsider.id}, format="json"
        )

        # outsider не учасник → серіалізатор відхиляє
        assert response.status_code == 400


@pytest.mark.django_db
class TestCommentIDOR:
    def test_cannot_comment_on_foreign_issue(
        self, api_client, make_user, make_project, make_issue
    ):
        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)
        issue = make_issue(project=project, reporter=owner)

        api_client.force_login(intruder)
        response = api_client.post(
            "/api/comments/",
            {"issue": issue.id, "body": "leaked"},
            format="json",
        )

        assert response.status_code == 400
        from issues.models import Comment

        assert not Comment.objects.filter(body="leaked").exists()

    def test_cannot_list_foreign_comments(
        self, api_client, make_user, make_project, make_issue
    ):
        from issues.models import Comment

        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)
        issue = make_issue(project=project, reporter=owner)
        Comment.objects.create(issue=issue, author=owner, body="secret")

        api_client.force_login(intruder)
        response = api_client.get("/api/comments/")

        bodies = [c["body"] for c in response.json().get("results", response.json())]
        assert "secret" not in bodies

    def test_only_author_can_delete_comment(
        self, api_client, make_user, make_project, make_issue
    ):
        from issues.models import Comment, ProjectMembership

        owner = make_user()
        author = make_user()
        project = make_project(owner=owner)
        ProjectMembership.objects.create(project=project, user=author, role="member")
        project.members.set([owner, author], through_defaults={"role": "member"}) if False else None
        issue = make_issue(project=project, reporter=owner)
        comment = Comment.objects.create(issue=issue, author=author, body="mine")

        # Інший учасник не може видалити чужий коментар
        api_client.force_login(owner)
        response = api_client.delete(f"/api/comments/{comment.id}/")
        assert response.status_code == 403

        # Автор може
        api_client.force_login(author)
        response = api_client.delete(f"/api/comments/{comment.id}/")
        assert response.status_code == 204


@pytest.mark.django_db
class TestAttachmentIDOR:
    def test_attachment_list_excludes_foreign(
        self, api_client, make_user, make_project, make_issue, small_file
    ):
        from issues.models import Attachment

        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)
        issue = make_issue(project=project, reporter=owner)
        Attachment.objects.create(
            issue=issue, uploader=owner, file=small_file, name="secret.txt"
        )

        api_client.force_login(intruder)
        response = api_client.get("/api/attachments/")

        assert response.status_code == 200
        names = [a["name"] for a in response.json().get("results", response.json())]
        assert "secret.txt" not in names
