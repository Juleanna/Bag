from django.contrib import admin

from .models import (
    Attachment,
    ChangelogEntry,
    ChangelogReaction,
    ChangelogSubscription,
    Comment,
    Invitation,
    Issue,
    Label,
    Notification,
    Project,
    ProjectMembership,
    RoadmapItem,
    SupportAgentPermission,
    SupportComment,
    SupportSettings,
    SupportTicket,
    WorkflowStatus,
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


@admin.register(WorkflowStatus)
class WorkflowStatusAdmin(admin.ModelAdmin):
    list_display = ("project", "label", "key", "sort_order", "is_default", "is_done")
    list_filter = ("project", "is_default", "is_done")
    search_fields = ("label", "key", "project__name")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "message", "is_read", "created_at")
    list_filter = ("kind", "is_read", "created_at")
    search_fields = ("user__username", "message")
    readonly_fields = ("created_at",)


@admin.register(ChangelogEntry)
class ChangelogEntryAdmin(admin.ModelAdmin):
    list_display = ("version", "title", "tag", "release_date", "is_published")
    list_filter = ("tag", "is_published", "release_date")
    search_fields = ("version", "title", "summary")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ChangelogSubscription)
class ChangelogSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("email", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("email",)


@admin.register(ChangelogReaction)
class ChangelogReactionAdmin(admin.ModelAdmin):
    list_display = ("entry", "user", "kind", "created_at")
    list_filter = ("kind", "created_at")
    search_fields = ("entry__version", "user__username")


@admin.register(RoadmapItem)
class RoadmapItemAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "quarter", "sort_order", "updated_at")
    list_filter = ("status", "quarter")
    search_fields = ("title", "description")


@admin.register(SupportSettings)
class SupportSettingsAdmin(admin.ModelAdmin):
    list_display = ("id", "status_kind", "email", "updated_at")
    readonly_fields = ("updated_at",)


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = (
        "subject",
        "category",
        "priority",
        "status",
        "submitted_by",
        "created_at",
    )
    list_filter = ("status", "priority", "category", "created_at")
    search_fields = ("subject", "description", "submitted_email")
    readonly_fields = ("created_at", "updated_at")


@admin.register(SupportComment)
class SupportCommentAdmin(admin.ModelAdmin):
    list_display = ("ticket", "author", "is_staff_reply", "created_at")
    list_filter = ("is_staff_reply", "created_at")
    search_fields = ("body", "ticket__subject")
    readonly_fields = ("created_at",)


@admin.register(SupportAgentPermission)
class SupportAgentPermissionAdmin(admin.ModelAdmin):
    list_display = ("user", "can_view_all", "categories", "updated_at")
    list_filter = ("can_view_all",)
    search_fields = ("user__username",)
    readonly_fields = ("created_at", "updated_at")
