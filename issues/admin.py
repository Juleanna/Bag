from django.contrib import admin
from .models import Project, Issue, Comment, Label


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "owner", "created_at")
    search_fields = ("name", "description")
    autocomplete_fields = ("owner", "members")


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "color")
    search_fields = ("name",)


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "project", "status", "priority", "assignee", "reporter")
    list_filter = ("status", "priority", "project")
    search_fields = ("title", "description")
    autocomplete_fields = ("project", "assignee", "reporter", "labels")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "issue", "author", "created_at")
    search_fields = ("body",)
    autocomplete_fields = ("issue", "author")

# Register your models here.
