from rest_framework import viewsets, permissions, pagination, filters
from .models import (
    Project,
    Issue,
    Comment,
    Label,
    Attachment,
    ProjectMembership,
    Invitation,
)
from django.db.models import Count
from .serializers import (
    ProjectSerializer,
    IssueSerializer,
    CommentSerializer,
    LabelSerializer,
    AttachmentSerializer,
    ProjectMembershipSerializer,
    InvitationSerializer,
)
from .permissions import IsOwnerOrReadOnly, IsProjectMemberOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.crypto import get_random_string
import logging

logger = logging.getLogger(__name__)


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
        queryset = (
            Project.objects.annotate(issues_count=Count("issues"))
            .select_related("owner")
            .prefetch_related("members")
        )

        if self.request.query_params.get("owner") == "me":
            queryset = queryset.filter(owner=self.request.user)

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
    ordering_fields = ["created_at", "priority", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Issue.objects.select_related(
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
        try:
            from .tasks import send_issue_notification

            send_issue_notification.delay(issue.id, "created")
        except Exception:
            pass

    def perform_update(self, serializer):
        issue = serializer.save()
        try:
            from .tasks import send_issue_notification

            send_issue_notification.delay(issue.id, "updated")
        except Exception:
            pass


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsProjectMemberOrReadOnly]

    def get_queryset(self):
        qs = Comment.objects.select_related("issue", "author").order_by("-created_at")
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs


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
