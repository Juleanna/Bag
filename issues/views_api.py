from rest_framework import viewsets, permissions, pagination, filters
from .models import (
    Project,
    Issue,
    Comment,
    Label,
    Attachment,
    ProjectMembership,
    Invitation,
    IssueActivity,
    IssueRelation,
    ChecklistItem,
    Notification,
    StarredIssue,
)
from django.db.models import Count, Q
from .serializers import (
    ProjectSerializer,
    IssueSerializer,
    CommentSerializer,
    LabelSerializer,
    AttachmentSerializer,
    ProjectMembershipSerializer,
    InvitationSerializer,
    IssueActivitySerializer,
    IssueRelationSerializer,
    ChecklistItemSerializer,
    NotificationSerializer,
    StarredIssueSerializer,
)
from .permissions import IsOwnerOrReadOnly, IsProjectMemberOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.crypto import get_random_string
import logging

logger = logging.getLogger(__name__)


def _log_activity(issue, user, action, field="", old_value="", new_value=""):
    IssueActivity.objects.create(
        issue=issue, user=user, action=action,
        field=field, old_value=str(old_value)[:255], new_value=str(new_value)[:255],
    )


def _notify(user, issue, message):
    if user:
        Notification.objects.create(user=user, issue=issue, message=message[:500])


class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsProjectMemberOrReadOnly, IsOwnerOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        queryset = (
            Project.objects.filter(
                Q(owner=user) | Q(members=user)
            )
            .annotate(issues_count=Count("issues"))
            .select_related("owner")
            .prefetch_related("members")
            .distinct()
        )
        return queryset

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        project.members.add(self.request.user)


class IssueViewSet(viewsets.ModelViewSet):
    serializer_class = IssueSerializer
    permission_classes = [IsProjectMemberOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "priority", "status", "updated_at", "due_date"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        user_projects = Project.objects.filter(
            Q(owner=user) | Q(members=user)
        )
        queryset = Issue.objects.filter(
            project__in=user_projects
        ).select_related(
            "project", "reporter", "assignee"
        ).prefetch_related("labels", "comments")

        project = self.request.query_params.get("project")
        if project:
            queryset = queryset.filter(project_id=project)

        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        assignee = self.request.query_params.get("assignee")
        if assignee:
            if assignee == "me":
                queryset = queryset.filter(assignee=self.request.user)
            else:
                queryset = queryset.filter(assignee_id=assignee)

        priority = self.request.query_params.get("priority")
        if priority:
            queryset = queryset.filter(priority=priority)

        return queryset

    def perform_create(self, serializer):
        issue = serializer.save()
        _log_activity(issue, self.request.user, "created")
        # Notify assignee
        if issue.assignee and issue.assignee != self.request.user:
            _notify(issue.assignee, issue, f"You were assigned to: {issue.title}")
        try:
            from .tasks import send_issue_notification
            send_issue_notification.delay(issue.id, "created")
        except Exception:
            pass

    def perform_update(self, serializer):
        old = Issue.objects.get(pk=serializer.instance.pk)
        issue = serializer.save()
        user = self.request.user
        # Track changes
        if old.status != issue.status:
            _log_activity(issue, user, "status_changed", "status", old.status, issue.status)
        if old.priority != issue.priority:
            _log_activity(issue, user, "priority_changed", "priority", old.priority, issue.priority)
        if old.assignee_id != issue.assignee_id:
            old_name = old.assignee.username if old.assignee else "none"
            new_name = issue.assignee.username if issue.assignee else "none"
            _log_activity(issue, user, "assignee_changed", "assignee", old_name, new_name)
            if issue.assignee and issue.assignee != user:
                _notify(issue.assignee, issue, f"You were assigned to: {issue.title}")
        if old.title != issue.title:
            _log_activity(issue, user, "title_changed", "title", old.title, issue.title)
        if old.due_date != issue.due_date:
            _log_activity(issue, user, "due_date_changed", "due_date", str(old.due_date or ""), str(issue.due_date or ""))
        try:
            from .tasks import send_issue_notification
            send_issue_notification.delay(issue.id, "updated")
        except Exception:
            pass


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsProjectMemberOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        user_projects = Project.objects.filter(
            Q(owner=user) | Q(members=user)
        )
        qs = Comment.objects.filter(
            issue__project__in=user_projects
        ).select_related("issue", "author").order_by("-created_at")
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs

    def perform_create(self, serializer):
        comment = serializer.save()
        _log_activity(comment.issue, self.request.user, "comment_added")
        # Notify issue reporter and assignee
        issue = comment.issue
        for target in [issue.reporter, issue.assignee]:
            if target and target != self.request.user:
                _notify(target, issue, f"@{self.request.user.username} commented on: {issue.title}")


class LabelViewSet(viewsets.ModelViewSet):
    queryset = Label.objects.all().order_by("name")
    serializer_class = LabelSerializer
    permission_classes = [IsProjectMemberOrReadOnly]


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer
    permission_classes = [IsProjectMemberOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = Attachment.objects.select_related("issue", "uploader").order_by(
            "-created_at"
        )
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs


class ProjectMembershipViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectMembershipSerializer
    permission_classes = [IsProjectMemberOrReadOnly]

    def get_queryset(self):
        qs = ProjectMembership.objects.select_related("project", "user").order_by(
            "-created_at"
        )
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs


class InvitationViewSet(viewsets.ModelViewSet):
    serializer_class = InvitationSerializer
    permission_classes = [IsProjectMemberOrReadOnly]

    def get_queryset(self):
        qs = Invitation.objects.select_related("project").order_by("-created_at")
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    def perform_create(self, serializer):
        token = get_random_string(40)
        serializer.save(token=token)

    @action(
        detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def accept(self, request):
        token = request.data.get("token")
        inv = Invitation.objects.filter(token=token, accepted=False).first()
        if not inv:
            return Response({"ok": False, "error": "Invite not found"}, status=400)
        ProjectMembership.objects.get_or_create(
            project=inv.project, user=request.user, defaults={"role": inv.role}
        )
        inv.accepted = True
        inv.save(update_fields=["accepted"])
        return Response({"ok": True})


class IssueActivityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IssueActivitySerializer
    permission_classes = [IsProjectMemberOrReadOnly]

    def get_queryset(self):
        qs = IssueActivity.objects.select_related("user").order_by("-created_at")
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs


class IssueRelationViewSet(viewsets.ModelViewSet):
    serializer_class = IssueRelationSerializer
    permission_classes = [IsProjectMemberOrReadOnly]

    def get_queryset(self):
        qs = IssueRelation.objects.select_related("from_issue", "to_issue")
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(Q(from_issue_id=issue_id) | Q(to_issue_id=issue_id))
        return qs


class ChecklistItemViewSet(viewsets.ModelViewSet):
    serializer_class = ChecklistItemSerializer
    permission_classes = [IsProjectMemberOrReadOnly]

    def get_queryset(self):
        qs = ChecklistItem.objects.order_by("position", "created_at")
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")[:50]

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"ok": True})

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response({"ok": True})


class StarredIssueViewSet(viewsets.ModelViewSet):
    serializer_class = StarredIssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StarredIssue.objects.filter(user=self.request.user).select_related("issue")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"])
    def toggle(self, request):
        issue_id = request.data.get("issue")
        if not issue_id:
            return Response({"error": "issue is required"}, status=400)
        existing = StarredIssue.objects.filter(user=request.user, issue_id=issue_id).first()
        if existing:
            existing.delete()
            return Response({"starred": False})
        StarredIssue.objects.create(user=request.user, issue_id=issue_id)
        return Response({"starred": True})
