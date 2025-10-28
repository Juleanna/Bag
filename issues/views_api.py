from rest_framework import viewsets, permissions
from .models import Project, Issue, Comment, Label
from django.db.models import Count
from .serializers import ProjectSerializer, IssueSerializer, CommentSerializer, LabelSerializer


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
