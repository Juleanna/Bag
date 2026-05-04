"""Тести для адмін-панелі лендінгу (drafts/preview/multilang/changelog/images)."""

import io

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username="admin", email="admin@e.com", password="adminPass123", is_staff=True
    )


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(
        username="reg", email="reg@e.com", password="userPass123"
    )


# ============================================================================
# Public endpoint
# ============================================================================


@pytest.mark.django_db
class TestLandingPublic:
    def test_anonymous_can_get(self, api_client):
        r = api_client.get("/api/landing/")
        assert r.status_code == 200
        body = r.json()
        assert "hero" in body
        assert len(body["features"]) >= 5

    def test_unpublished_hidden_from_public(self, api_client):
        from landing.models import LandingFeature

        f = LandingFeature.objects.first()
        f.is_published = False
        f.save()
        r = api_client.get("/api/landing/")
        ids = [x["id"] for x in r.json()["features"]]
        assert f.id not in ids

    def test_lang_uk_returns_string(self, api_client):
        r = api_client.get("/api/landing/?lang=uk")
        body = r.json()
        assert isinstance(body["hero"]["title_a"], str)
        assert "Баг" in body["hero"]["title_a"]

    def test_lang_en_fallbacks_to_uk(self, api_client):
        r = api_client.get("/api/landing/?lang=en")
        body = r.json()
        assert isinstance(body["hero"]["title_a"], str)
        assert body["hero"]["title_a"]  # не порожній — fallback на uk

    def test_no_lang_returns_dict(self, api_client):
        r = api_client.get("/api/landing/")
        body = r.json()
        assert isinstance(body["hero"]["title_a"], dict)
        assert "uk" in body["hero"]["title_a"]

    def test_preview_anonymous_ignored(self, api_client):
        from landing.models import LandingFeature

        f = LandingFeature.objects.first()
        f.is_published = False
        f.save()
        r = api_client.get("/api/landing/?preview=true")
        ids = [x["id"] for x in r.json()["features"]]
        assert f.id not in ids

    def test_preview_staff_sees_drafts(self, api_client, staff_user):
        from landing.models import LandingFeature

        f = LandingFeature.objects.first()
        f.is_published = False
        f.save()
        api_client.force_login(staff_user)
        r = api_client.get("/api/landing/?preview=true")
        ids = [x["id"] for x in r.json()["features"]]
        assert f.id in ids


# ============================================================================
# Permissions
# ============================================================================


@pytest.mark.django_db
class TestPermissions:
    def test_anonymous_cannot_edit(self, api_client):
        r = api_client.patch(
            "/api/admin/landing/hero/1/", {"eyebrow_badge": "X"}, format="json"
        )
        assert r.status_code in (401, 403)

    def test_regular_cannot_edit(self, api_client, regular_user):
        api_client.force_login(regular_user)
        r = api_client.patch(
            "/api/admin/landing/hero/1/", {"eyebrow_badge": "X"}, format="json"
        )
        assert r.status_code == 403

    def test_staff_can_edit(self, api_client, staff_user):
        from landing.models import LandingHero

        api_client.force_login(staff_user)
        r = api_client.patch(
            "/api/admin/landing/hero/1/",
            {"eyebrow_badge": "Updated"},
            format="json",
        )
        assert r.status_code == 200
        assert LandingHero.load().eyebrow_badge == "Updated"


# ============================================================================
# CRUD + reorder
# ============================================================================


@pytest.mark.django_db
class TestCRUD:
    def test_create_feature(self, api_client, staff_user):
        api_client.force_login(staff_user)
        r = api_client.post(
            "/api/admin/landing/features/",
            {
                "title": {"uk": "Нова можливість", "en": "New feature"},
                "description": {"uk": "Опис", "en": ""},
                "icon": "Bug",
                "color_variant": "accent",
                "position": 99,
                "is_visible": True,
                "is_published": False,
            },
            format="json",
        )
        assert r.status_code == 201

    def test_reorder(self, api_client, staff_user):
        from landing.models import LandingFaqItem

        api_client.force_login(staff_user)
        ids = list(LandingFaqItem.objects.values_list("id", flat=True))
        r = api_client.post(
            "/api/admin/landing/faq/reorder/",
            {"order": list(reversed(ids))},
            format="json",
        )
        assert r.status_code == 200

    def test_delete(self, api_client, staff_user):
        from landing.models import LandingIntegration

        i = LandingIntegration.objects.first()
        api_client.force_login(staff_user)
        r = api_client.delete(f"/api/admin/landing/integrations/{i.id}/")
        assert r.status_code == 204


# ============================================================================
# Drafts / publish workflow
# ============================================================================


@pytest.mark.django_db
class TestPublishUnpublish:
    def test_publish(self, api_client, staff_user):
        from landing.models import LandingFeature

        f = LandingFeature.objects.first()
        f.is_published = False
        f.save()
        api_client.force_login(staff_user)
        r = api_client.post(f"/api/admin/landing/features/{f.id}/publish/")
        assert r.status_code == 200
        f.refresh_from_db()
        assert f.is_published

    def test_unpublish(self, api_client, staff_user):
        from landing.models import LandingFeature

        f = LandingFeature.objects.first()
        api_client.force_login(staff_user)
        r = api_client.post(f"/api/admin/landing/features/{f.id}/unpublish/")
        assert r.status_code == 200
        f.refresh_from_db()
        assert not f.is_published


@pytest.mark.django_db
class TestSingletonDrafts:
    def test_save_draft_does_not_change_live(self, api_client, staff_user):
        from landing.models import LandingHero

        api_client.force_login(staff_user)
        original = LandingHero.load().eyebrow_badge
        r = api_client.post(
            "/api/admin/landing/hero/save-draft/",
            {"eyebrow_badge": "DRAFT"},
            format="json",
        )
        assert r.status_code == 200
        h = LandingHero.load()
        assert h.eyebrow_badge == original  # live не змінилось
        assert h.draft_data and h.draft_data.get("eyebrow_badge") == "DRAFT"

    def test_publish_draft(self, api_client, staff_user):
        from landing.models import LandingHero

        api_client.force_login(staff_user)
        api_client.post(
            "/api/admin/landing/hero/save-draft/",
            {"eyebrow_badge": "PUB"},
            format="json",
        )
        r = api_client.post("/api/admin/landing/hero/publish-draft/")
        assert r.status_code == 200
        h = LandingHero.load()
        assert h.eyebrow_badge == "PUB"
        assert h.draft_data is None

    def test_discard_draft(self, api_client, staff_user):
        from landing.models import LandingHero

        api_client.force_login(staff_user)
        api_client.post(
            "/api/admin/landing/hero/save-draft/",
            {"eyebrow_badge": "X"},
            format="json",
        )
        r = api_client.post("/api/admin/landing/hero/discard-draft/")
        assert r.status_code == 200
        assert LandingHero.load().draft_data is None


# ============================================================================
# Audit log
# ============================================================================


@pytest.mark.django_db
class TestChangeLog:
    def test_create_logged(self, api_client, staff_user):
        from landing.models import LandingChangeLog

        api_client.force_login(staff_user)
        api_client.post(
            "/api/admin/landing/features/",
            {
                "title": {"uk": "T", "en": ""},
                "description": {"uk": "", "en": ""},
                "icon": "Bug",
                "color_variant": "accent",
            },
            format="json",
        )
        assert LandingChangeLog.objects.filter(
            model_name="landingfeature", action="created"
        ).exists()

    def test_publish_logged(self, api_client, staff_user):
        from landing.models import LandingChangeLog, LandingFeature

        f = LandingFeature.objects.first()
        api_client.force_login(staff_user)
        api_client.post(f"/api/admin/landing/features/{f.id}/publish/")
        assert LandingChangeLog.objects.filter(
            object_id=f.id, action="published"
        ).exists()

    def test_changelog_endpoint(self, api_client, staff_user):
        api_client.force_login(staff_user)
        r = api_client.get("/api/admin/landing/changelog/")
        assert r.status_code == 200


# ============================================================================
# Multilanguage
# ============================================================================


@pytest.mark.django_db
class TestMultilang:
    def test_partial_lang_update_keeps_other(self, api_client, staff_user):
        from landing.models import LandingHero

        api_client.force_login(staff_user)
        original_uk = LandingHero.load().title_a.get("uk")
        # Оновлюємо тільки en
        full = LandingHero.load().title_a
        full["en"] = "English"
        api_client.patch(
            "/api/admin/landing/hero/1/", {"title_a": full}, format="json"
        )
        h = LandingHero.load()
        assert h.title_a.get("en") == "English"
        assert h.title_a.get("uk") == original_uk


# ============================================================================
# Image upload
# ============================================================================


@pytest.mark.django_db
class TestIntegrationLogo:
    def test_upload_logo(self, api_client, staff_user, tmp_path, settings):
        from PIL import Image
        from landing.models import LandingIntegration

        settings.MEDIA_ROOT = str(tmp_path)

        img = Image.new("RGB", (16, 16), (100, 100, 200))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.name = "logo.png"
        buf.seek(0)

        api_client.force_login(staff_user)
        integ = LandingIntegration.objects.first()
        r = api_client.patch(
            f"/api/admin/landing/integrations/{integ.id}/",
            {"logo": buf},
            format="multipart",
        )
        assert r.status_code == 200
        assert r.json().get("logo_url") is not None


# ============================================================================
# Singletons / whoami (regression)
# ============================================================================


@pytest.mark.django_db
class TestSingletonBehavior:
    def test_hero_only_pk1(self):
        from landing.models import LandingHero

        h = LandingHero(pk=99)
        h.save()
        assert h.pk == 1
        assert LandingHero.objects.count() == 1


@pytest.mark.django_db
class TestWhoami:
    def test_returns_is_staff(self, api_client, staff_user):
        api_client.force_login(staff_user)
        r = api_client.get("/api/auth/whoami/")
        assert r.json()["user"]["is_staff"] is True
