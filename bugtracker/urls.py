from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from issues import views_health

urlpatterns = [
    path("admin/", admin.site.urls),
    # API: основний шлях /api/ + версіонований alias /api/v1/
    # /api/ лишається для зворотної сумісності, /api/v1/ — рекомендований
    path("api/", include("issues.api_urls")),
    path("api/v1/", include(("issues.api_urls", "v1"), namespace="v1")),
    # Лендінг: публічний GET + адмінські CRUD
    path("api/", include("landing.urls")),
    # Healthcheck для k8s / docker / load balancer
    path("api/health/", views_health.liveness, name="health-liveness"),
    path("api/health/live/", views_health.liveness, name="health-live"),
    path("api/health/ready/", views_health.readiness, name="health-ready"),
    # OpenAPI / Swagger
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("", TemplateView.as_view(template_name="index.html"), name="home"),
]

if settings.DEBUG:
    # У production /media/ обслуговує захищений view — див. issues/views_media.py
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
