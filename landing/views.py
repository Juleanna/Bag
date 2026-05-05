"""
View-сети для адмін-панелі лендінгу.

Архітектура:
- Public `landing_public` (GET /api/landing/) — анонімний, віддає агрегований
  конфіг. Параметр `?lang=uk|en` для повернення простих рядків замість dict.
  `?preview=true` (тільки staff) — повертає включно з is_published=False
  + застосовує draft_data до Hero/Settings.
- Адмінські ViewSet'и — IsAdminUser, з `reorder` action для DnD-сортування,
  `publish`/`unpublish` для items, `save_draft`/`publish_draft`/`discard_draft`
  для singletons.
- Усі мутації автоматично логуються у LandingChangeLog.
"""

from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .audit import log_change
from .models import (
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    LandingChangeLog,
    LandingFaqItem,
    LandingFeature,
    LandingHero,
    LandingIntegration,
    LandingMetric,
    LandingSettings,
    LandingTestimonial,
    LandingUseCase,
)
from .serializers import (
    LandingChangeLogSerializer,
    LandingFaqItemSerializer,
    LandingFeatureSerializer,
    LandingHeroSerializer,
    LandingIntegrationSerializer,
    LandingMetricSerializer,
    LandingPublicSerializer,
    LandingSettingsSerializer,
    LandingTestimonialSerializer,
    LandingUseCaseSerializer,
)


def _resolve_lang(request):
    """
    Повертає мову з ?lang= для фронту лендінгу (рядки замість dict).
    Якщо lang не передано — None (серіалізатор віддасть dict {uk, en}).
    """
    lang = request.query_params.get("lang", "").lower().strip()
    if lang in SUPPORTED_LANGUAGES:
        return lang
    return None


def _apply_draft_to_singleton(instance):
    """Накладає draft_data на in-memory копію singleton'а (без save)."""
    if not instance.draft_data:
        return instance
    for field, value in instance.draft_data.items():
        if hasattr(instance, field):
            setattr(instance, field, value)
    return instance


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def landing_public(request):
    """
    Параметри:
    - `?lang=uk|en` — рядки замість dict
    - `?preview=true` (staff) — включає чорновики + draft_data
    """
    lang = _resolve_lang(request)
    preview = request.query_params.get("preview") == "true"
    if preview and not (request.user.is_authenticated and request.user.is_staff):
        preview = False

    hero = LandingHero.load()
    settings = LandingSettings.load()
    if preview:
        hero = _apply_draft_to_singleton(LandingHero.load())
        settings = _apply_draft_to_singleton(LandingSettings.load())

    items_filter = {} if preview else {"is_published": True}
    data = {
        "hero": hero,
        "settings": settings,
        "features": LandingFeature.objects.filter(is_visible=True, **items_filter),
        "use_cases": LandingUseCase.objects.filter(is_visible=True, **items_filter),
        "integrations": LandingIntegration.objects.filter(is_visible=True, **items_filter),
        "metrics": LandingMetric.objects.filter(is_visible=True, **items_filter),
        "testimonials": LandingTestimonial.objects.filter(is_visible=True, **items_filter),
        "faq": LandingFaqItem.objects.filter(is_visible=True, **items_filter),
    }

    serializer = LandingPublicSerializer(
        data, context={"lang": lang, "request": request}
    )
    response = Response(serializer.data)
    if preview:
        # Preview-режим: завжди свіжі дані
        response["Cache-Control"] = "no-store"
    elif request.user.is_authenticated and request.user.is_staff:
        # Staff бачить зміни одразу (без кешу), щоб після збереження не чекати
        response["Cache-Control"] = "no-store"
    else:
        # Анонімам можна закешувати на 30 секунд
        response["Cache-Control"] = "public, max-age=30"
    return response


# ============================================================================
# Singleton ViewSets
# ============================================================================


class _SingletonAdminMixin:
    permission_classes = [permissions.IsAdminUser]
    model = None
    serializer_class = None

    def list(self, request):
        instance = self.model.load()
        return Response(self.serializer_class(instance, context={"request": request}).data)

    def retrieve(self, request, pk=None):  # noqa: ARG002
        instance = self.model.load()
        return Response(self.serializer_class(instance, context={"request": request}).data)

    def update(self, request, pk=None):  # noqa: ARG002
        instance = self.model.load()
        serializer = self.serializer_class(
            instance, data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_change(instance=serializer.instance, action="updated", user=request.user)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):  # noqa: ARG002
        instance = self.model.load()
        serializer = self.serializer_class(
            instance, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_change(instance=serializer.instance, action="updated", user=request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="save-draft")
    def save_draft(self, request):
        instance = self.model.load()
        valid_fields = {f.name for f in self.model._meta.get_fields()}
        clean = {k: v for k, v in request.data.items() if k in valid_fields}
        instance.draft_data = clean
        instance.save()
        log_change(instance=instance, action="updated", user=request.user)
        return Response(
            self.serializer_class(instance, context={"request": request}).data
        )

    @action(detail=False, methods=["post"], url_path="publish-draft")
    def publish_draft(self, request):
        instance = self.model.load()
        if not instance.has_draft():
            return Response(
                {"error": "Чорновика немає"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.publish_draft()
        log_change(instance=instance, action="published_draft", user=request.user)
        return Response(
            self.serializer_class(instance, context={"request": request}).data
        )

    @action(detail=False, methods=["post"], url_path="discard-draft")
    def discard_draft(self, request):
        instance = self.model.load()
        instance.discard_draft()
        log_change(instance=instance, action="draft_discarded", user=request.user)
        return Response(
            self.serializer_class(instance, context={"request": request}).data
        )


class LandingHeroViewSet(_SingletonAdminMixin, viewsets.ViewSet):
    model = LandingHero
    serializer_class = LandingHeroSerializer


class LandingSettingsViewSet(_SingletonAdminMixin, viewsets.ViewSet):
    model = LandingSettings
    serializer_class = LandingSettingsSerializer


# ============================================================================
# Items ViewSets
# ============================================================================


class _PublishableItemsMixin:
    # JSONParser потрібен для адмінки (більшість запитів — JSON).
    # MultiPart/Form — для upload зображення в LandingIntegration.
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def perform_create(self, serializer):
        instance = serializer.save()
        log_change(instance=instance, action="created", user=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        log_change(instance=instance, action="updated", user=self.request.user)

    def perform_destroy(self, instance):
        log_change(instance=instance, action="deleted", user=self.request.user)
        instance.delete()

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request):
        order = request.data.get("order")
        if not isinstance(order, list):
            return Response(
                {"error": "Поле 'order' має бути списком pk у потрібному порядку"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        Model = self.get_queryset().model
        with transaction.atomic():
            for position, pk in enumerate(order):
                Model.objects.filter(pk=pk).update(position=position)
        return Response({"ok": True, "updated": len(order)})

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        instance = self.get_object()
        instance.is_published = True
        instance.save(update_fields=["is_published"])
        log_change(instance=instance, action="published", user=request.user)
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"], url_path="unpublish")
    def unpublish(self, request, pk=None):
        instance = self.get_object()
        instance.is_published = False
        instance.save(update_fields=["is_published"])
        log_change(instance=instance, action="unpublished", user=request.user)
        return Response(self.get_serializer(instance).data)


class LandingFeatureViewSet(_PublishableItemsMixin, viewsets.ModelViewSet):
    queryset = LandingFeature.objects.all().order_by("position")
    serializer_class = LandingFeatureSerializer
    permission_classes = [permissions.IsAdminUser]


class LandingUseCaseViewSet(_PublishableItemsMixin, viewsets.ModelViewSet):
    queryset = LandingUseCase.objects.all().order_by("position")
    serializer_class = LandingUseCaseSerializer
    permission_classes = [permissions.IsAdminUser]


class LandingIntegrationViewSet(_PublishableItemsMixin, viewsets.ModelViewSet):
    queryset = LandingIntegration.objects.all().order_by("position")
    serializer_class = LandingIntegrationSerializer
    permission_classes = [permissions.IsAdminUser]


class LandingMetricViewSet(_PublishableItemsMixin, viewsets.ModelViewSet):
    queryset = LandingMetric.objects.all().order_by("position")
    serializer_class = LandingMetricSerializer
    permission_classes = [permissions.IsAdminUser]


class LandingTestimonialViewSet(_PublishableItemsMixin, viewsets.ModelViewSet):
    queryset = LandingTestimonial.objects.all().order_by("position")
    serializer_class = LandingTestimonialSerializer
    permission_classes = [permissions.IsAdminUser]


class LandingFaqItemViewSet(_PublishableItemsMixin, viewsets.ModelViewSet):
    queryset = LandingFaqItem.objects.all().order_by("position")
    serializer_class = LandingFaqItemSerializer
    permission_classes = [permissions.IsAdminUser]


# ============================================================================
# Change log (read-only)
# ============================================================================


class LandingChangeLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only журнал змін для адмін-панелі.
    Фільтри: `?model=feature&object_id=42` — історія конкретного об'єкта.
    """

    queryset = LandingChangeLog.objects.select_related("user").all()
    serializer_class = LandingChangeLogSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if model_name := params.get("model"):
            qs = qs.filter(model_name=model_name.lower())
        if object_id := params.get("object_id"):
            qs = qs.filter(object_id=object_id)
        return qs[:200]
