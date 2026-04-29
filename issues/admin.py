from django.contrib import admin

from .models import (
    Attachment,
    Comment,
    Invitation,
    Issue,
    Label,
    Project,
    ProjectMembership,
)


class ProjectMembershipInline(admin.TabularInline):
    """Управління учасниками — через through-модель ProjectMembership."""

    model = ProjectMembership
    extra = 0
    autocomplete_fields = ("user",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "created_at")
    list_filter = ("created_at", "updated_at")
    search_fields = ("name", "description")
    # filter_horizontal для members неможливий з through-моделлю — використовуємо inline
    inlines = [ProjectMembershipInline]
    readonly_fields = ("created_at", "updated_at")


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "color")
    search_fields = ("name",)


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "status", "priority", "assignee", "created_at")
    list_filter = ("status", "priority", "created_at")
    search_fields = ("title", "description")
    filter_horizontal = ("labels",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("author", "issue", "created_at")
    list_filter = ("created_at",)
    search_fields = ("body", "issue__title")
    readonly_fields = ("created_at",)


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("name", "issue", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "issue__title")
    readonly_fields = ("created_at",)


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ("email", "project", "accepted", "created_at")
    list_filter = ("accepted", "created_at")
    search_fields = ("email", "project__name")
    readonly_fields = ("token", "created_at")


@admin.register(ProjectMembership)
class ProjectMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "project", "role", "created_at")
    list_filter = ("role", "created_at")
    search_fields = ("user__username", "project__name")
    readonly_fields = ("created_at",)
