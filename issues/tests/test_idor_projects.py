"""
Тести IDOR (Insecure Direct Object Reference) для Project.
Перевіряємо, що автентифікований користувач НЕ може читати/змінювати чужі проєкти.
"""

import pytest


@pytest.mark.django_db
class TestProjectIDOR:
    def test_cannot_list_others_project(self, api_client, make_user, make_project):
        owner = make_user()
        intruder = make_user()
        make_project(owner=owner, name="Owner's Secret")

        api_client.force_login(intruder)
        response = api_client.get("/api/projects/")

        assert response.status_code == 200
        # Зловмисник не повинен бачити чужий проєкт
        names = [p["name"] for p in response.json()["results"]]
        assert "Owner's Secret" not in names

    def test_cannot_retrieve_others_project(self, api_client, make_user, make_project):
        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)

        api_client.force_login(intruder)
        response = api_client.get(f"/api/projects/{project.id}/")

        assert response.status_code == 404  # get_queryset відфільтрує

    def test_cannot_update_others_project(self, api_client, make_user, make_project):
        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)

        api_client.force_login(intruder)
        response = api_client.patch(
            f"/api/projects/{project.id}/", {"name": "Hijacked"}, format="json"
        )

        assert response.status_code in (403, 404)
        project.refresh_from_db()
        assert project.name != "Hijacked"

    def test_cannot_delete_others_project(self, api_client, make_user, make_project):
        owner = make_user()
        intruder = make_user()
        project = make_project(owner=owner)

        api_client.force_login(intruder)
        response = api_client.delete(f"/api/projects/{project.id}/")

        assert response.status_code in (403, 404)
        # Проєкт має лишитись
        from issues.models import Project

        assert Project.objects.filter(id=project.id).exists()

    def test_member_can_view_but_not_delete(self, api_client, make_user, make_project):
        from issues.models import ProjectMembership

        owner = make_user()
        member = make_user()
        project = make_project(owner=owner)
        ProjectMembership.objects.create(project=project, user=member, role="member")

        api_client.force_login(member)
        # Учасник бачить
        response = api_client.get(f"/api/projects/{project.id}/")
        assert response.status_code == 200
        # Але не видалить (не власник)
        response = api_client.delete(f"/api/projects/{project.id}/")
        assert response.status_code == 403

    def test_owner_can_update_own_project(self, api_client, user, project):
        api_client.force_login(user)
        response = api_client.patch(
            f"/api/projects/{project.id}/", {"name": "Renamed"}, format="json"
        )

        assert response.status_code == 200
        project.refresh_from_db()
        assert project.name == "Renamed"
