from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_api import (
    ProjectViewSet,
    IssueViewSet,
    CommentViewSet,
    LabelViewSet,
    AttachmentViewSet,
    ProjectMembershipViewSet,
    InvitationViewSet,
)
from . import views_auth as auth


router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"issues", IssueViewSet, basename="issue")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"labels", LabelViewSet, basename="label")
router.register(r"attachments", AttachmentViewSet, basename="attachment")
router.register(r"memberships", ProjectMembershipViewSet, basename="membership")
router.register(r"invitations", InvitationViewSet, basename="invitation")

urlpatterns = [
    path("", include(router.urls)),
    # auth helpers for session-based login
    path("auth/csrf/", auth.csrf, name="auth-csrf"),
    path("auth/whoami/", auth.whoami, name="auth-whoami"),
    path("auth/login/", auth.login, name="auth-login"),
    path("auth/register/", auth.register, name="auth-register"),
    path("auth/logout/", auth.logout, name="auth-logout"),
]
