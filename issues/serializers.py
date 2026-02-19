from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Project, Issue, Comment, Label, Attachment, ProjectMembership, Invitation,
    IssueActivity, IssueRelation, ChecklistItem, Notification, StarredIssue,
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

    def get_issues_count(self, obj: Project) -> int:
        return getattr(obj, "issues_count", obj.issues.count())


class IssueSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())
    assignee = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True, required=False
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
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        labels = validated_data.pop("labels", [])
        validated_data["reporter"] = self.context["request"].user
        issue = super().create(validated_data)
        if labels:
            issue.labels.set(labels)
        return issue


class CommentSerializer(serializers.ModelSerializer):
    author = UserShortSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "issue", "author", "body", "created_at"]

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)

class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ["id", "issue", "name", "file", "url", "uploader", "created_at"]
        read_only_fields = ["uploader", "url", "created_at"]

    def get_url(self, obj: Attachment) -> str:
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def create(self, validated_data):
        validated_data["uploader"] = self.context["request"].user
        return super().create(validated_data)


class ProjectMembershipSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source="user", queryset=User.objects.all(), write_only=True)

    class Meta:
        model = ProjectMembership
        fields = ["id", "project", "user", "user_id", "role", "created_at"]


class InvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ["id", "project", "email", "role", "token", "accepted", "created_at"]
        read_only_fields = ["token", "accepted", "created_at"]


class IssueActivitySerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)

    class Meta:
        model = IssueActivity
        fields = ["id", "issue", "user", "action", "field", "old_value", "new_value", "created_at"]


class IssueRelationSerializer(serializers.ModelSerializer):
    to_issue_title = serializers.CharField(source="to_issue.title", read_only=True)
    from_issue_title = serializers.CharField(source="from_issue.title", read_only=True)

    class Meta:
        model = IssueRelation
        fields = [
            "id", "from_issue", "to_issue", "relation_type",
            "from_issue_title", "to_issue_title", "created_at",
        ]


class ChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistItem
        fields = ["id", "issue", "text", "is_done", "position", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "user", "issue", "message", "is_read", "created_at"]
        read_only_fields = ["user", "created_at"]


class StarredIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = StarredIssue
        fields = ["id", "user", "issue", "created_at"]
        read_only_fields = ["user", "created_at"]
