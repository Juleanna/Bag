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
    Region,
    SavedFilter,
    Sprint,
    StarredIssue,
    TestCase,
    TestResult,
    TestRun,
    TestSuite,
    TimeLog,
    Webhook,
    WorkflowStatus,
    Workspace,
)

User = get_user_model()


class UserShortSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "avatar_url"]

    def get_avatar_url(self, obj):
        profile = getattr(obj, "profile", None)
        if profile and profile.avatar and hasattr(profile.avatar, "url"):
            request = self.context.get("request") if hasattr(self, "context") else None
            url = profile.avatar.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ["id", "name", "color"]


class WorkflowStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowStatus
        fields = [
            "id",
            "project",
            "key",
            "label",
            "color",
            "sort_order",
            "is_default",
            "is_done",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = [
            "id",
            "code",
            "label",
            "icon",
            "sort_order",
            "is_active",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserShortSerializer(read_only=True)
    members = UserShortSerializer(many=True, read_only=True)
    projects_count = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            "id",
            "name",
            "slug",
            "color",
            "team_size",
            "industry",
            "region",
            "auto_join_domain",
            "domain",
            "owner",
            "members",
            "projects_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_projects_count(self, obj: Workspace) -> int:
        return obj.projects.count()


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserShortSerializer(read_only=True)
    members = UserShortSerializer(many=True, read_only=True)
    issues_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "key",
            "description",
            "color",
            "icon",
            "visibility",
            "workspaces",
            "owner",
            "members",
            "is_archived",
            "archived_at",
            "created_at",
            "updated_at",
            "issues_count",
        ]
        read_only_fields = ["created_at", "updated_at", "is_archived", "archived_at"]

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
    status_display = serializers.SerializerMethodField()
    status_color = serializers.SerializerMethodField()
    status_is_done = serializers.SerializerMethodField()
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    workflow_status = serializers.PrimaryKeyRelatedField(
        queryset=WorkflowStatus.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = Issue
        fields = [
            "id",
            "project",
            "title",
            "description",
            "status",
            "status_display",
            "status_color",
            "status_is_done",
            "workflow_status",
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

    # status_display / status_color / status_is_done беремо з WorkflowStatus,
    # якщо привʼязано — інакше fallback на Issue.Status.choices.
    def get_status_display(self, obj: Issue) -> str:
        ws = obj.workflow_status
        if ws:
            return ws.label
        return obj.get_status_display()

    def get_status_color(self, obj: Issue) -> str:
        ws = obj.workflow_status
        return ws.color if ws else "var(--st-open-dot)"

    def get_status_is_done(self, obj: Issue) -> bool:
        ws = obj.workflow_status
        if ws:
            return ws.is_done
        return obj.status in ("done", "cancelled")

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

    def _sync_status_fields(self, issue: Issue, validated_data: dict) -> None:
        """Синхронізує issue.status (legacy) ↔ issue.workflow_status (FK).

        Логіка:
         - Якщо передали workflow_status → копіюємо його key у status.
         - Інакше якщо передали status (key) → шукаємо WorkflowStatus у проєкті
           з цим key і привʼязуємо.
         - Якщо нічого не передали і workflow_status порожній — підставляємо
           дефолтний для проєкту (is_default=True або перший за sort_order).
        """
        ws_field = validated_data.get("workflow_status", None)
        status_key = validated_data.get("status", None)

        if ws_field is not None:
            issue.workflow_status = ws_field
            issue.status = ws_field.key
        elif status_key is not None:
            ws = WorkflowStatus.objects.filter(
                project=issue.project, key=status_key
            ).first()
            if ws is None:
                ws = WorkflowStatus.objects.create(
                    project=issue.project,
                    key=status_key,
                    label=status_key.replace("_", " ").title(),
                    sort_order=99,
                    is_done=status_key in ("done", "cancelled"),
                )
            issue.workflow_status = ws
            issue.status = ws.key
        elif issue.workflow_status is None:
            default_ws = (
                WorkflowStatus.objects.filter(project=issue.project, is_default=True)
                .first()
                or WorkflowStatus.objects.filter(project=issue.project)
                .order_by("sort_order")
                .first()
            )
            if default_ws:
                issue.workflow_status = default_ws
                issue.status = default_ws.key

    def create(self, validated_data):
        labels = validated_data.pop("labels", [])
        validated_data["reporter"] = self.context["request"].user
        # Витягуємо workflow_status / status щоб обробити після створення
        ws = validated_data.pop("workflow_status", None)
        issue = super().create(validated_data)
        # Привʼязуємо статус з урахуванням проєкту
        self._sync_status_fields(
            issue,
            {
                **({"workflow_status": ws} if ws else {}),
                "status": validated_data.get("status"),
            },
        )
        issue.save(update_fields=["status", "workflow_status"])
        if labels:
            issue.labels.set(labels)
        return issue

    def update(self, instance, validated_data):
        labels = validated_data.pop("labels", None)
        ws = validated_data.pop("workflow_status", "__missing__")
        status_key = validated_data.pop("status", "__missing__")
        # Оновлюємо інші поля стандартно
        instance = super().update(instance, validated_data)
        # Тепер обробляємо статус
        sync_data = {}
        if ws != "__missing__":
            sync_data["workflow_status"] = ws
        if status_key != "__missing__":
            sync_data["status"] = status_key
        if sync_data:
            self._sync_status_fields(instance, sync_data)
            instance.save(update_fields=["status", "workflow_status"])
        if labels is not None:
            instance.labels.set(labels)
        return instance


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
