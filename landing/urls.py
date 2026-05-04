"""URL-маршрутизація додатка `landing`."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    LandingChangeLogViewSet,
    LandingFaqItemViewSet,
    LandingFeatureViewSet,
    LandingHeroViewSet,
    LandingIntegrationViewSet,
    LandingMetricViewSet,
    LandingSettingsViewSet,
    LandingTestimonialViewSet,
    LandingUseCaseViewSet,
    landing_public,
)

# Адмінський роутер — підключається у /api/admin/landing/
admin_router = DefaultRouter()
admin_router.register(r"hero", LandingHeroViewSet, basename="landing-hero")
admin_router.register(r"settings", LandingSettingsViewSet, basename="landing-settings")
admin_router.register(r"features", LandingFeatureViewSet, basename="landing-features")
admin_router.register(r"use-cases", LandingUseCaseViewSet, basename="landing-use-cases")
admin_router.register(
    r"integrations", LandingIntegrationViewSet, basename="landing-integrations"
)
admin_router.register(r"metrics", LandingMetricViewSet, basename="landing-metrics")
admin_router.register(
    r"testimonials", LandingTestimonialViewSet, basename="landing-testimonials"
)
admin_router.register(r"faq", LandingFaqItemViewSet, basename="landing-faq")
admin_router.register(r"changelog", LandingChangeLogViewSet, basename="landing-changelog")

urlpatterns = [
    # Публічний — анонімний
    path("landing/", landing_public, name="landing-public"),
    # Адмінські — IsAdminUser
    path("admin/landing/", include(admin_router.urls)),
]
