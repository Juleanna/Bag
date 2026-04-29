"""
Регресійний тест: NotificationViewSet раніше мав [:50] slicing у get_queryset,
що ламало пагінацію та mark_read(detail=True). Перевіряємо, що це виправлено.
"""

import pytest


@pytest.mark.django_db
class TestNotifications:
    def test_can_list_paginated(self, api_client, user):
        from issues.models import Notification

        # Створюємо 60 нотифікацій (більше за старий ліміт 50)
        for i in range(60):
            Notification.objects.create(user=user, message=f"msg {i}")

        api_client.force_login(user)
        response = api_client.get("/api/notifications/")
        assert response.status_code == 200
        body = response.json()
        # Пагінатор повертає count усіх нотифікацій, не обмежений 50
        assert body["count"] == 60

    def test_mark_read_works_for_old_notification(self, api_client, user):
        from issues.models import Notification

        # Створюємо 60 нотифікацій — найстарішу легко пропустити з [:50]
        for i in range(60):
            Notification.objects.create(user=user, message=f"msg {i}", is_read=False)
        oldest = Notification.objects.order_by("created_at").first()

        api_client.force_login(user)
        response = api_client.post(f"/api/notifications/{oldest.id}/mark_read/")
        assert response.status_code == 200
        oldest.refresh_from_db()
        assert oldest.is_read is True

    def test_mark_all_read(self, api_client, user):
        from issues.models import Notification

        for i in range(5):
            Notification.objects.create(user=user, message=f"m{i}", is_read=False)

        api_client.force_login(user)
        response = api_client.post("/api/notifications/mark_all_read/")
        assert response.status_code == 200
        assert Notification.objects.filter(user=user, is_read=False).count() == 0

    def test_user_sees_only_own_notifications(self, api_client, make_user):
        from issues.models import Notification

        u1 = make_user()
        u2 = make_user()
        Notification.objects.create(user=u1, message="for u1")
        Notification.objects.create(user=u2, message="for u2")

        api_client.force_login(u1)
        response = api_client.get("/api/notifications/")
        results = response.json()["results"]
        messages = [n["message"] for n in results]
        assert "for u1" in messages
        assert "for u2" not in messages
