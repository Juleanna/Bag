"""Реєстрація моделей лендінгу в Django admin."""

from django.contrib import admin

from .models import (
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


class _SingletonAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not self.model.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(LandingHero)
class LandingHeroAdmin(_SingletonAdmin):
    list_display = ("__str__", "updated_at")
    readonly_fields = ("updated_at",)


@admin.register(LandingSettings)
class LandingSettingsAdmin(_SingletonAdmin):
    list_display = ("__str__", "updated_at")
    readonly_fields = ("updated_at",)


@admin.register(LandingFeature)
class LandingFeatureAdmin(admin.ModelAdmin):
    list_display = ("__str__", "icon", "color_variant", "featured", "is_published", "is_visible", "position")
    list_editable = ("is_published", "is_visible", "position", "featured")
    list_filter = ("is_published", "is_visible", "featured", "color_variant")
    ordering = ("position",)


@admin.register(LandingUseCase)
class LandingUseCaseAdmin(admin.ModelAdmin):
    list_display = ("__str__", "icon", "color_variant", "is_published", "is_visible", "position")
    list_editable = ("is_published", "is_visible", "position")
    list_filter = ("is_published", "is_visible", "color_variant")
    ordering = ("position",)


@admin.register(LandingIntegration)
class LandingIntegrationAdmin(admin.ModelAdmin):
    list_display = ("name", "mark", "color", "logo", "is_published", "is_visible", "position")
    list_editable = ("is_published", "is_visible", "position")
    list_filter = ("is_published", "is_visible")
    search_fields = ("name",)
    ordering = ("position",)


@admin.register(LandingMetric)
class LandingMetricAdmin(admin.ModelAdmin):
    list_display = ("value", "__str__", "is_published", "is_visible", "position")
    list_editable = ("is_published", "is_visible", "position")
    ordering = ("position",)


@admin.register(LandingTestimonial)
class LandingTestimonialAdmin(admin.ModelAdmin):
    list_display = ("author_name", "__str__", "featured", "is_published", "is_visible", "position")
    list_editable = ("is_published", "is_visible", "position", "featured")
    list_filter = ("is_published", "is_visible", "featured")
    ordering = ("position",)


@admin.register(LandingFaqItem)
class LandingFaqItemAdmin(admin.ModelAdmin):
    list_display = ("__str__", "is_published", "is_visible", "position")
    list_editable = ("is_published", "is_visible", "position")
    list_filter = ("is_published", "is_visible")
    ordering = ("position",)


@admin.register(LandingChangeLog)
class LandingChangeLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "action", "model_name", "object_id", "object_label")
    list_filter = ("action", "model_name")
    readonly_fields = (
        "timestamp",
        "user",
        "action",
        "model_name",
        "object_id",
        "object_label",
        "data_snapshot",
    )

    def has_add_permission(self, request):
        return False
