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
from django.db.models import Count, Prefetch
from .serializers import (
    ProjectSerializer,
    IssueSerializer,
    CommentSerializer,
    LabelSerializer,
    AttachmentSerializer,
    ProjectMembershipSerializer,
    InvitationSerializer,
)
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.crypto import get_random_string
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class IsAuthenticatedOrReadOnly(permissions.IsAuthenticatedOrReadOnly):
    pass


class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class UserThrottle(UserRateThrottle):
    scope = "user"


class AnonThrottle(AnonRateThrottle):
    scope = "anon"


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]
    throttle_classes = [UserThrottle, AnonThrottle]

    def get_queryset(self):
        # Optimize with annotations and prefetch
        queryset = (
            Project.objects.annotate(issues_count=Count("issues"))
            .select_related("owner")
            .prefetch_related("members")
        )

        # Filter by owner if specified
        if self.request.query_params.get("owner"):
            queryset = queryset.filter(owner=self.request.user)

        return queryset

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        project.members.add(self.request.user)


class IssueViewSet(viewsets.ModelViewSet):
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "priority", "status"]
    ordering = ["-created_at"]
    throttle_classes = [UserThrottle, AnonThrottle]

    def get_queryset(self):
        # Heavy optimization for large datasets
        queryset = Issue.objects.select_related(
            "project", "reporter", "assignee"
        ).prefetch_related("labels", "comments")

        # Filter by project if specified
        if self.request.query_params.get("project"):
            queryset = queryset.filter(
                project_id=self.request.query_params.get("project")
            )

        # Filter by status
        if self.request.query_params.get("status"):
            queryset = queryset.filter(status=self.request.query_params.get("status"))

        # Filter by assignee
        if self.request.query_params.get("assignee"):
            queryset = queryset.filter(
                assignee_id=self.request.query_params.get("assignee")
            )

        return queryset


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("issue", "author").order_by("-created_at")
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class LabelViewSet(viewsets.ModelViewSet):
    queryset = Label.objects.all().order_by("name")
    serializer_class = LabelSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.select_related("issue", "uploader").order_by(
        "-created_at"
    )
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = super().get_queryset()
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs


class ProjectMembershipViewSet(viewsets.ModelViewSet):
    queryset = ProjectMembership.objects.select_related("project", "user").order_by(
        "-created_at"
    )
    serializer_class = ProjectMembershipSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.select_related("project").order_by("-created_at")
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        token = get_random_string(40)
        serializer.save(token=token)

    @action(
        detail=False, methods=["post"], permission_classes=[IsAuthenticatedOrReadOnly]
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
