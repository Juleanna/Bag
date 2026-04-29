"""
Глобальні pytest-фікстури для всього проєкту.
"""

from io import BytesIO

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client() -> APIClient:
    """Анонімний DRF-клієнт без CSRF (enforce_csrf_checks=False за замовчуванням)."""
    return APIClient()


@pytest.fixture
def make_user(db):
    """Фабрика користувачів — кожен виклик створює унікального користувача."""
    counter = {"n": 0}

    def _make(**kwargs):
        counter["n"] += 1
        n = counter["n"]
        defaults = {
            "username": f"user{n}",
            "email": f"user{n}@example.com",
            "password": "TestPass123!",
        }
        defaults.update(kwargs)
        password = defaults.pop("password")
        user = User.objects.create_user(**defaults, password=password)
        # Зберігаємо пароль для зручності в тестах
        user._raw_password = password
        return user

    return _make


@pytest.fixture
def user(make_user):
    return make_user()


@pytest.fixture
def other_user(make_user):
    return make_user()


@pytest.fixture
def auth_client(api_client, user):
    """Авторизований клієнт під фікстурою `user`."""
    api_client.force_login(user)
    return api_client


@pytest.fixture
def make_project(db):
    """Фабрика проєктів. Власника треба передавати явно через owner=."""
    from issues.models import Project, ProjectMembership

    def _make(owner, name="Test Project", **kwargs):
        project = Project.objects.create(name=name, owner=owner, **kwargs)
        # Власник через through-модель — інакше IsProjectMemberOrOwner поверне False
        ProjectMembership.objects.get_or_create(
            project=project, user=owner, defaults={"role": "owner"}
        )
        return project

    return _make


@pytest.fixture
def project(make_project, user):
    return make_project(owner=user)


@pytest.fixture
def make_issue(db):
    """Фабрика задач."""
    from issues.models import Issue

    def _make(project, reporter, title="Test Issue", **kwargs):
        return Issue.objects.create(
            project=project, reporter=reporter, title=title, **kwargs
        )

    return _make


@pytest.fixture
def issue(make_issue, project, user):
    return make_issue(project=project, reporter=user)


@pytest.fixture
def small_file():
    """Створює in-memory файл для тестів вкладень."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    return SimpleUploadedFile("test.txt", b"Hello, world!", content_type="text/plain")


@pytest.fixture
def large_file():
    """Файл, що перевищує MAX_ATTACHMENT_SIZE (10 МБ)."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    # 11 МБ
    big = BytesIO(b"x" * (11 * 1024 * 1024))
    return SimpleUploadedFile("big.txt", big.read(), content_type="text/plain")


@pytest.fixture
def html_file():
    """HTML-файл — має бути відхилено валідатором розширень."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    return SimpleUploadedFile(
        "evil.html", b"<script>alert(1)</script>", content_type="text/html"
    )
