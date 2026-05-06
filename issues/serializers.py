from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import (
    ApiToken,
    Attachment,
    ChecklistItem,
    Comment,
    IntegrationConfig,
    Invitation,
    Issue,
    IssueActivity,
    IssueRelation,
    IssueTemplate,
    Label,
    LoginEvent,
    Notification,
    Project,
    ProjectMembership,
    SavedFilter,
    Sprint,
    StarredIssue,
    TestCase,
    TestResult,
    TestRun,
    TestSuite,
    TimeLog,
    Webhook,
)

User = get_user_model()


class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ["id", "name", "color"]


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserShortSerializer(read_only=True)
    members = UserShortSerializer(many=True, read_only=True)
    issues_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "owner",
            "members",
            "created_at",
            "updated_at",
            "issues_count",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_issues_count(self, obj: Project) -> int:
        # Якщо annotate додав значення — використовуємо його, інакше fallback
        # (getattr з default обчислює fallback ЗАВЖДИ — це викликало N+1)
        val = getattr(obj, "issues_count", None)
        if val is not None:
            return val
        return obj.issues.count()


class IssueSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.none())
    assignee = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(), allow_null=True, required=False
    )
    reporter = UserShortSerializer(read_only=True)
    labels = serializers.PrimaryKeyRelatedField(
        queryset=Label.objects.all(), many=True, required=False
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)

    class Meta:
        model = Issue
        fields = [
            "id",
            "project",
            "title",
            "description",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "assignee",
            "reporter",
            "labels",
            "due_date",
            "time_spent_minutes",
            "custom_fields",
            "is_archived",
            "archived_at",
            "sprint",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["reporter", "archived_at", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Обмежуємо доступні проєкти / виконавців членством користувача
        user_projects = self.context.get("user_projects")
        if user_projects is not None:
            self.fields["project"].queryset = user_projects
            # Виконавець — тільки серед учасників доступних проєктів
            self.fields["assignee"].queryset = User.objects.filter(
                projects__in=user_projects
            ).distinct()

    def validate_project(self, value):
        # Додатковий захист: при PATCH забороняємо переносити issue в чужий проєкт
        if self.instance and self.instance.project_id != value.id:
            raise serializers.ValidationError("Переносити задачу в інший проєкт заборонено")
        return value

    def create(self, validated_data):
        labels = validated_data.pop("labels", [])
        validated_data["reporter"] = self.context["request"].user
        issue = super().create(validated_data)
        if labels:
            issue.labels.set(labels)
        return issue


class CommentSerializer(serializers.ModelSerializer):
    author = UserShortSerializer(read_only=True)
    issue = serializers.PrimaryKeyRelatedField(queryset=Issue.objects.none())

    class Meta:
        model = Comment
        fields = ["id", "issue", "author", "body", "created_at"]
        read_only_fields = ["author", "created_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user_projects = self.context.get("user_projects")
        if user_projects is not None:
            # Дозволяємо створювати коментар лише в задачах доступних проєктів
            self.fields["issue"].queryset = Issue.objects.filter(project__in=user_projects)

    def validate_issue(self, value):
        # Заборона перенесення коментаря в інший issue через PATCH
        if self.instance and self.instance.issue_id != value.id:
            raise serializers.ValidationError("Переносити коментар заборонено")
        return value

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    issue = serializers.PrimaryKeyRelatedField(queryset=Issue.objects.none())

    class Meta:
        model = Attachment
        fields = ["id", "issue", "name", "file", "url", "uploader", "created_at"]
        read_only_fields = ["uploader", "url", "created_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user_projects = self.context.get("user_projects")
        if user_projects is not None:
            self.fields["issue"].queryset = Issue.objects.filter(project__in=user_projects)

    def get_url(self, obj: Attachment) -> str:
        # Повертаємо захищений URL, що проходить через перевірку членства
        # (а не прямий MEDIA_URL — інакше будь-хто з посиланням скачає файл)
        request = self.context.get("request")
        protected_path = f"/api/attachments/{obj.pk}/download/"
        if request:
            return request.build_absolute_uri(protected_path)
        return protected_path

    def validate_issue(self, value):
        if self.instance and self.instance.issue_id != value.id:
            raise serializers.ValidationError("Переносити вкладення заборонено")
        return value

    def create(self, validated_data):
        validated_data["uploader"] = self.context["request"].user
        return super().create(validated_data)


class ProjectMembershipSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source="user", queryset=User.objects.all(), write_only=True
    )

    class Meta:
        model = ProjectMembership
        fields = ["id", "project", "user", "user_id", "role", "created_at"]
        read_only_fields = ["created_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user_projects = self.context.get("user_projects")
        if user_projects is not None:
            self.fields["project"].queryset = user_projects


class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ["id", "project", "email", "role", "token", "accepted", "created_at"]
        # Токен — write_only, щоб не витікав через GET-список
        read_only_fields = ["accepted", "created_at"]
        extra_kwargs = {
            "token": {"write_only": True, "required": False},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user_projects = self.context.get("user_projects")
        if user_projects is not None:
            self.fields["project"].queryset = user_projects


class IssueActivitySerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)

    class Meta:
        model = IssueActivity
        fields = [
            "id",
            "issue",
            "user",
            "action",
            "field",
            "old_value",
            "new_value",
            "created_at",
        ]
        read_only_fields = fields  # Журнал — повністю read-only через API


class IssueRelationSerializer(serializers.ModelSerializer):
    to_issue_title = serializers.CharField(source="to_issue.title", read_only=True)
    from_issue_title = serializers.CharField(source="from_issue.title", read_only=True)
    from_issue = serializers.PrimaryKeyRelatedField(queryset=Issue.objects.none())
    to_issue = serializers.PrimaryKeyRelatedField(queryset=Issue.objects.none())

    class Meta:
        model = IssueRelation
        fields = [
            "id",
            "from_issue",
            "to_issue",
            "relation_type",
            "from_issue_title",
            "to_issue_title",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user_projects = self.context.get("user_projects")
        if user_projects is not None:
            qs = Issue.objects.filter(project__in=user_projects)
            self.fields["from_issue"].queryset = qs
            self.fields["to_issue"].queryset = qs

    def validate(self, attrs):
        # Заборона самопосилання — додатково до DB-constraint
        from_issue = attrs.get("from_issue") or getattr(self.instance, "from_issue", None)
        to_issue = attrs.get("to_issue") or getattr(self.instance, "to_issue", None)
        if from_issue and to_issue and from_issue.id == to_issue.id:
            raise serializers.ValidationError("Задача не може посилатись сама на себе")
        return attrs


class ChecklistItemSerializer(serializers.ModelSerializer):
    issue = serializers.PrimaryKeyRelatedField(queryset=Issue.objects.none())

    class Meta:
        model = ChecklistItem
        fields = ["id", "issue", "text", "is_done", "position", "created_at"]
        read_only_fields = ["created_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user_projects = self.context.get("user_projects")
        if user_projects is not None:
            self.fields["issue"].queryset = Issue.objects.filter(project__in=user_projects)

    def validate_issue(self, value):
        if self.instance and self.instance.issue_id != value.id:
            raise serializers.ValidationError("Переносити пункт чек-листа заборонено")
        return value


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "user", "issue", "message", "is_read", "created_at"]
        read_only_fields = ["user", "issue", "message", "created_at"]


class StarredIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = StarredIssue
        fields = ["id", "user", "issue", "created_at"]
        read_only_fields = ["user", "created_at"]


# ============================================================================
# Sprint
# ============================================================================


class SprintSerializer(serializers.ModelSerializer):
    issues_count = serializers.SerializerMethodField()

    class Meta:
        model = Sprint
        fields = "__all__"
        read_only_fields = ("created_at",)

    def get_issues_count(self, obj):
        return obj.issues.count()


# ============================================================================
# Issue templates
# ============================================================================


class IssueTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueTemplate
        fields = "__all__"
        read_only_fields = ("created_at",)


# ============================================================================
# Time tracking
# ============================================================================


class TimeLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = TimeLog
        fields = ("id", "issue", "user", "user_name", "minutes", "note", "logged_at")
        read_only_fields = ("user", "user_name", "logged_at")


# ============================================================================
# Saved filters
# ============================================================================


class SavedFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedFilter
        fields = "__all__"
        read_only_fields = ("user", "created_at")


# ============================================================================
# Test management
# ============================================================================


class TestSuiteSerializer(serializers.ModelSerializer):
    cases_count = serializers.SerializerMethodField()

    class Meta:
        model = TestSuite
        fields = "__all__"
        read_only_fields = ("created_at",)

    def get_cases_count(self, obj):
        return obj.test_cases.count()


class TestCaseSerializer(serializers.ModelSerializer):
    suite_name = serializers.CharField(source="suite.name", read_only=True)
    project = serializers.IntegerField(source="suite.project_id", read_only=True)

    class Meta:
        model = TestCase
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at")


class TestResultSerializer(serializers.ModelSerializer):
    case_title = serializers.CharField(source="test_case.title", read_only=True)
    executed_by_name = serializers.CharField(
        source="executed_by.username", read_only=True
    )

    class Meta:
        model = TestResult
        fields = "__all__"


class TestRunSerializer(serializers.ModelSerializer):
    cases_total = serializers.SerializerMethodField()
    pass_count = serializers.SerializerMethodField()
    fail_count = serializers.SerializerMethodField()

    class Meta:
        model = TestRun
        fields = "__all__"
        read_only_fields = ("created_by", "created_at")

    def get_cases_total(self, obj):
        return obj.test_cases.count()

    def get_pass_count(self, obj):
        return obj.results.filter(result="pass").count()

    def get_fail_count(self, obj):
        return obj.results.filter(result="fail").count()


# ============================================================================
# API tokens (security)
# ============================================================================


class ApiTokenSerializer(serializers.ModelSerializer):
    """key — write-only при list, повертається лише ОДИН РАЗ при create."""

    class Meta:
        model = ApiToken
        fields = ("id", "name", "key", "last_used_at", "revoked_at", "created_at")
        read_only_fields = ("key", "last_used_at", "revoked_at", "created_at")


class LoginEventSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = LoginEvent
        fields = (
            "id",
            "user",
            "user_name",
            "username_attempted",
            "success",
            "ip_address",
            "user_agent",
            "method",
            "created_at",
        )
        read_only_fields = fields


# ============================================================================
# Webhooks / Integrations
# ============================================================================


class WebhookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Webhook
        fields = "__all__"
        read_only_fields = ("created_at", "last_called_at", "last_status_code")


class IntegrationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationConfig
        fields = "__all__"
        read_only_fields = ("created_at",)
