"""
Тести для нових фіч: soft delete, bulk update, реакції на коментарі,
healthcheck endpoint, експорт CSV.
"""

import pytest


@pytest.mark.django_db
class TestSoftDelete:
    def test_delete_archives_by_default(self, api_client, user, project):
        api_client.force_login(user)
        response = api_client.delete(f"/api/projects/{project.id}/")
        assert response.status_code == 204

        from issues.models import Project

        # Проєкт ще існує, але архівований
        project.refresh_from_db()
        assert project.is_archived is True
        assert Project.objects.filter(id=project.id).exists()

    def test_archived_hidden_by_default(self, api_client, user, project):
        api_client.force_login(user)
        api_client.delete(f"/api/projects/{project.id}/")

        # У звичайному списку проєкту немає
        response = api_client.get("/api/projects/")
        names = [p["name"] for p in response.json()["results"]]
        assert project.name not in names

    def test_archived_visible_with_filter(self, api_client, user, project):
        api_client.force_login(user)
        api_client.delete(f"/api/projects/{project.id}/")

        response = api_client.get("/api/projects/?archived=true")
        ids = [p["id"] for p in response.json()["results"]]
        assert project.id in ids

    def test_force_delete(self, api_client, user, project):
        api_client.force_login(user)
        response = api_client.delete(f"/api/projects/{project.id}/?force=true")
        assert response.status_code == 204

        from issues.models import Project

        assert not Project.objects.filter(id=project.id).exists()

    def test_restore_action(self, api_client, user, project):
        api_client.force_login(user)
        api_client.delete(f"/api/projects/{project.id}/")
        response = api_client.post(f"/api/projects/{project.id}/restore/")
        assert response.status_code == 200

        project.refresh_from_db()
        assert project.is_archived is False


@pytest.mark.django_db
class TestBulkUpdate:
    def test_bulk_change_status(self, api_client, user, project, make_issue):
        i1 = make_issue(project=project, reporter=user, status="open")
        i2 = make_issue(project=project, reporter=user, status="open")
        i3 = make_issue(project=project, reporter=user, status="open")

        api_client.force_login(user)
        response = api_client.post(
            "/api/issues/bulk_update/",
            {"ids": [i1.id, i2.id, i3.id], "status": "done"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["updated"] == 3
        i1.refresh_from_db()
        assert i1.status == "done"

    def test_bulk_rejects_invalid_status(self, api_client, user, project, make_issue):
        issue = make_issue(project=project, reporter=user)
        api_client.force_login(user)
        response = api_client.post(
            "/api/issues/bulk_update/",
            {"ids": [issue.id], "status": "invalid_status"},
            format="json",
        )
        assert response.status_code == 400

    def test_bulk_only_affects_own_issues(
        self, api_client, make_user, make_project, make_issue
    ):
        u1 = make_user()
        u2 = make_user()
        p1 = make_project(owner=u1)
        p2 = make_project(owner=u2)
        i_mine = make_issue(project=p1, reporter=u1, status="open")
        i_others = make_issue(project=p2, reporter=u2, status="open")

        api_client.force_login(u1)
        response = api_client.post(
            "/api/issues/bulk_update/",
            {"ids": [i_mine.id, i_others.id], "status": "done"},
            format="json",
        )
        assert response.status_code == 200
        i_mine.refresh_from_db()
        i_others.refresh_from_db()
        assert i_mine.status == "done"
        assert i_others.status == "open"  # Не торкнулось!


@pytest.mark.django_db
class TestReactions:
    def test_toggle_reaction_adds_then_removes(
        self, api_client, user, project, make_issue
    ):
        from issues.models import Comment, CommentReaction

        issue = make_issue(project=project, reporter=user)
        comment = Comment.objects.create(issue=issue, author=user, body="hi")

        api_client.force_login(user)
        # Додаємо
        response = api_client.post(
            f"/api/comments/{comment.id}/react/", {"emoji": "👍"}, format="json"
        )
        assert response.status_code == 200
        assert response.json()["action"] == "added"
        assert CommentReaction.objects.filter(comment=comment).count() == 1

        # Знімаємо
        response = api_client.post(
            f"/api/comments/{comment.id}/react/", {"emoji": "👍"}, format="json"
        )
        assert response.json()["action"] == "removed"
        assert CommentReaction.objects.filter(comment=comment).count() == 0

    def test_invalid_emoji_rejected(self, api_client, user, project, make_issue):
        from issues.models import Comment

        issue = make_issue(project=project, reporter=user)
        comment = Comment.objects.create(issue=issue, author=user, body="hi")

        api_client.force_login(user)
        response = api_client.post(
            f"/api/comments/{comment.id}/react/", {"emoji": "💩"}, format="json"
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestHealthcheck:
    def test_liveness_anonymous(self, api_client):
        response = api_client.get("/api/health/live/")
        assert response.status_code == 200
        assert response.json()["status"] == "alive"

    def test_readiness_checks_db(self, api_client):
        response = api_client.get("/api/health/ready/")
        assert response.status_code == 200
        assert response.json()["status"] == "ready"


@pytest.mark.django_db
class TestExport:
    def test_export_csv(self, api_client, user, project, make_issue):
        make_issue(project=project, reporter=user, title="First")
        make_issue(project=project, reporter=user, title="Second")

        api_client.force_login(user)
        response = api_client.get(f"/api/projects/{project.id}/export/")
        assert response.status_code == 200
        assert response["Content-Type"].startswith("text/csv")
        body = response.content.decode("utf-8")
        assert "First" in body
        assert "Second" in body


@pytest.mark.django_db
class TestMentions:
    def test_mention_creates_notification(
        self, api_client, make_user, make_project, make_issue
    ):
        from issues.models import Notification, ProjectMembership

        owner = make_user(username="alice")
        member = make_user(username="bob")
        project = make_project(owner=owner)
        ProjectMembership.objects.create(project=project, user=member, role="member")
        issue = make_issue(project=project, reporter=owner)

        api_client.force_login(owner)
        response = api_client.post(
            "/api/comments/",
            {"issue": issue.id, "body": "Hey @bob, please check this"},
            format="json",
        )
        assert response.status_code == 201

        # bob має отримати сповіщення про @mention
        notifs = Notification.objects.filter(user=member)
        assert notifs.exists()
        assert any("згадав" in n.message for n in notifs)
