"""
Тести автентифікації: реєстрація, логін, throttle, валідація пароля.
"""

import pytest


@pytest.mark.django_db
class TestRegister:
    def test_weak_password_rejected(self, api_client):
        response = api_client.post(
            "/api/auth/register/",
            {"username": "weak", "email": "weak@e.com", "password": "1"},
            format="json",
        )
        assert response.status_code == 400
        assert response.json()["ok"] is False

    def test_short_password_rejected(self, api_client):
        response = api_client.post(
            "/api/auth/register/",
            {"username": "short", "email": "short@e.com", "password": "abc12"},
            format="json",
        )
        # MinimumLengthValidator(8) має відхилити
        assert response.status_code == 400

    def test_invalid_email_rejected(self, api_client):
        response = api_client.post(
            "/api/auth/register/",
            {"username": "bad", "email": "not-an-email", "password": "ValidPass123!"},
            format="json",
        )
        assert response.status_code == 400

    def test_duplicate_username_rejected(self, api_client, user):
        response = api_client.post(
            "/api/auth/register/",
            {"username": user.username, "email": "new@e.com", "password": "ValidPass123!"},
            format="json",
        )
        assert response.status_code == 400

    def test_valid_register_creates_user(self, api_client):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        response = api_client.post(
            "/api/auth/register/",
            {
                "username": "fresh",
                "email": "fresh@e.com",
                "password": "ValidPass123!",
            },
            format="json",
        )
        assert response.status_code == 200
        assert User.objects.filter(username="fresh").exists()


@pytest.mark.django_db
class TestLogin:
    def test_login_with_username(self, api_client, user):
        response = api_client.post(
            "/api/auth/login/",
            {"username": user.username, "password": user._raw_password},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["isAuthenticated"] is True

    def test_login_with_email(self, api_client, user):
        response = api_client.post(
            "/api/auth/login/",
            {"username": user.email, "password": user._raw_password},
            format="json",
        )
        assert response.status_code == 200

    def test_wrong_password_rejected(self, api_client, user):
        response = api_client.post(
            "/api/auth/login/",
            {"username": user.username, "password": "wrong"},
            format="json",
        )
        assert response.status_code == 400

    def test_whoami_returns_unauthenticated_when_not_logged_in(self, api_client):
        response = api_client.get("/api/auth/whoami/")
        assert response.status_code == 200
        assert response.json()["isAuthenticated"] is False


@pytest.mark.django_db
class TestThrottle:
    """
    Throttle налаштований у settings: login=10/min, register=5/hour.
    Перевіряємо лише, що кеш throttle очищується між тестами і ліміт працює.
    """

    def test_login_throttle_after_many_attempts(self, api_client, settings):
        from django.core.cache import cache

        cache.clear()
        # Імітуємо 11 невдалих спроб з одного IP — 11-та має повернути 429
        for _ in range(11):
            response = api_client.post(
                "/api/auth/login/",
                {"username": "no_user", "password": "wrong"},
                format="json",
            )
            if response.status_code == 429:
                break
        assert response.status_code == 429
        cache.clear()
