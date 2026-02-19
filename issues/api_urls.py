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
    IssueActivityViewSet,
    IssueRelationViewSet,
    ChecklistItemViewSet,
    NotificationViewSet,
    StarredIssueViewSet,
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
router.register(r"activities", IssueActivityViewSet, basename="activity")
router.register(r"relations", IssueRelationViewSet, basename="relation")
router.register(r"checklist", ChecklistItemViewSet, basename="checklist")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"starred", StarredIssueViewSet, basename="starred")

urlpatterns = [
    path("", include(router.urls)),
    # auth helpers for session-based login
    path("auth/csrf/", auth.csrf, name="auth-csrf"),
    path("auth/whoami/", auth.whoami, name="auth-whoami"),
    path("auth/login/", auth.login, name="auth-login"),
    path("auth/register/", auth.register, name="auth-register"),
    path("auth/logout/", auth.logout, name="auth-logout"),
    path("auth/profile/", auth.update_profile, name="auth-profile"),
    path("auth/password/", auth.change_password, name="auth-password"),
]
