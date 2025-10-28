from rest_framework import viewsets, permissions
from .models import Project, Issue, Comment, Label, Attachment, ProjectMembership, Invitation
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
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.crypto import get_random_string


class IsAuthenticatedOrReadOnly(permissions.IsAuthenticatedOrReadOnly):
    pass


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.annotate(issues_count=Count("issues")).order_by("-created_at")
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        project.members.add(self.request.user)


class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.select_related("project").order_by("-created_at")
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related("issue", "author").order_by("-created_at")
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class LabelViewSet(viewsets.ModelViewSet):
    queryset = Label.objects.all().order_by("name")
    serializer_class = LabelSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.select_related("issue", "uploader").order_by("-created_at")
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
    queryset = ProjectMembership.objects.select_related("project", "user").order_by("-created_at")
    serializer_class = ProjectMembershipSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class InvitationViewSet(viewsets.ModelViewSet):
    queryset = Invitation.objects.select_related("project").order_by("-created_at")
    serializer_class = InvitationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        token = get_random_string(40)
        serializer.save(token=token)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticatedOrReadOnly])
    def accept(self, request):
        token = request.data.get("token")
        inv = Invitation.objects.filter(token=token, accepted=False).first()
        if not inv:
            return Response({"ok": False, "error": "Invite not found"}, status=400)
        ProjectMembership.objects.get_or_create(project=inv.project, user=request.user, defaults={"role": inv.role})
        inv.accepted = True
        inv.save(update_fields=["accepted"])
        return Response({"ok": True})
