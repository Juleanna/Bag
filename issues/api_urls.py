from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views_auth as auth
from . import views_email, views_media, views_sse
from .views_api import (
    AttachmentViewSet,
    ChecklistItemViewSet,
    CommentViewSet,
    InvitationViewSet,
    IssueActivityViewSet,
    IssueRelationViewSet,
    IssueViewSet,
    LabelViewSet,
    NotificationViewSet,
    ProjectMembershipViewSet,
    ProjectViewSet,
    StarredIssueViewSet,
)

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
    # Сесійна автентифікація
    path("auth/csrf/", auth.csrf, name="auth-csrf"),
    path("auth/whoami/", auth.whoami, name="auth-whoami"),
    path("auth/login/", auth.login, name="auth-login"),
    path("auth/register/", auth.register, name="auth-register"),
    path("auth/logout/", auth.logout, name="auth-logout"),
    path("auth/profile/", auth.update_profile, name="auth-profile"),
    path("auth/password/", auth.change_password, name="auth-password"),
    # Підтвердження email і скидання пароля
    path(
        "auth/email/request/",
        views_email.request_confirm_email,
        name="auth-email-request",
    ),
    path("auth/email/confirm/", views_email.confirm_email, name="auth-email-confirm"),
    path(
        "auth/email/status/",
        views_email.email_verified_status,
        name="auth-email-status",
    ),
    path(
        "auth/password/forgot/",
        views_email.request_password_reset,
        name="auth-password-forgot",
    ),
    path(
        "auth/password/reset/",
        views_email.confirm_password_reset,
        name="auth-password-reset",
    ),
    # Захищене скачування вкладень
    path(
        "attachments/<int:pk>/download/",
        views_media.serve_attachment,
        name="attachment-download",
    ),
    # SSE-стрім сповіщень (realtime)
    path(
        "notifications/stream/",
        views_sse.notifications_stream,
        name="notifications-stream",
    ),
]
