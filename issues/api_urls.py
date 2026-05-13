from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views_auth as auth
from . import views_email, views_media, views_sse
from .feeds import ChangelogFeed
from .views_api import (
    ApiTokenViewSet,
    AttachmentViewSet,
    ChecklistItemViewSet,
    CommentViewSet,
    IntegrationConfigViewSet,
    InvitationViewSet,
    IssueActivityViewSet,
    IssueRelationViewSet,
    IssueTemplateViewSet,
    IssueViewSet,
    LabelViewSet,
    LoginEventViewSet,
    NotificationViewSet,
    ProjectMembershipViewSet,
    ProjectViewSet,
    RegionViewSet,
    ChangelogEntryViewSet,
    ChangelogSubscriptionViewSet,
    changelog_subscribe,
    RoadmapItemViewSet,
    SavedFilterViewSet,
    SupportSettingsView,
    SupportTicketViewSet,
    SprintViewSet,
    StarredIssueViewSet,
    UserListView,
    TestCaseViewSet,
    TestResultViewSet,
    TestRunViewSet,
    TestSuiteViewSet,
    TimeLogViewSet,
    WebhookViewSet,
    WorkflowStatusViewSet,
    WorkspaceViewSet,
    activity_feed,
    bulk_archive_issues,
    bulk_restore_issues,
    import_issues,
    reports_summary,
    totp_disable,
    totp_enroll,
    totp_verify_and_enable,
)

router = DefaultRouter()
# Існуючі
router.register(r"workspaces", WorkspaceViewSet, basename="workspace")
router.register(r"regions", RegionViewSet, basename="region")
router.register(r"users", UserListView, basename="user")
router.register(r"workflow-statuses", WorkflowStatusViewSet, basename="workflow-status")
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
# Нові
router.register(r"sprints", SprintViewSet, basename="sprint")
router.register(r"templates", IssueTemplateViewSet, basename="template")
router.register(r"time-logs", TimeLogViewSet, basename="time-log")
router.register(r"saved-filters", SavedFilterViewSet, basename="saved-filter")
router.register(r"test-suites", TestSuiteViewSet, basename="test-suite")
router.register(r"test-cases", TestCaseViewSet, basename="test-case")
router.register(r"test-runs", TestRunViewSet, basename="test-run")
router.register(r"test-results", TestResultViewSet, basename="test-result")
router.register(r"api-tokens", ApiTokenViewSet, basename="api-token")
router.register(r"login-events", LoginEventViewSet, basename="login-event")
router.register(r"webhooks", WebhookViewSet, basename="webhook")
router.register(r"integrations", IntegrationConfigViewSet, basename="integration")
router.register(r"changelog-subscriptions", ChangelogSubscriptionViewSet, basename="changelog-subscription")
router.register(r"changelog", ChangelogEntryViewSet, basename="changelog")
router.register(r"roadmap", RoadmapItemViewSet, basename="roadmap")
router.register(r"support/tickets", SupportTicketViewSet, basename="support-ticket")

urlpatterns = [
    # Спочатку конкретні URL під /changelog/ — інакше router-в'юсет
    # перехоплює `feed.rss` як pk і повертає 404.
    path("changelog/subscribe/", changelog_subscribe, name="changelog-subscribe"),
    path("changelog/feed.rss", ChangelogFeed(), name="changelog-feed"),
    path("support/settings/", SupportSettingsView.as_view(), name="support-settings"),
    path("", include(router.urls)),
    # Сесійна автентифікація
    path("auth/csrf/", auth.csrf, name="auth-csrf"),
    path("auth/whoami/", auth.whoami, name="auth-whoami"),
    path("auth/login/", auth.login, name="auth-login"),
    path("auth/register/", auth.register, name="auth-register"),
    path("auth/logout/", auth.logout, name="auth-logout"),
    path("auth/profile/", auth.update_profile, name="auth-profile"),
    path("auth/avatar/", auth.avatar_view, name="auth-avatar"),
    path("auth/password/", auth.change_password, name="auth-password"),
    # Email confirmation / password reset
    path("auth/email/request/", views_email.request_confirm_email, name="auth-email-request"),
    path("auth/email/confirm/", views_email.confirm_email, name="auth-email-confirm"),
    path("auth/email/status/", views_email.email_verified_status, name="auth-email-status"),
    path("auth/password/forgot/", views_email.request_password_reset, name="auth-password-forgot"),
    path("auth/password/reset/", views_email.confirm_password_reset, name="auth-password-reset"),
    # 2FA TOTP
    path("auth/2fa/enroll/", totp_enroll, name="auth-2fa-enroll"),
    path("auth/2fa/verify/", totp_verify_and_enable, name="auth-2fa-verify"),
    path("auth/2fa/disable/", totp_disable, name="auth-2fa-disable"),
    # Захищене скачування вкладень + SSE
    path(
        "attachments/<int:pk>/download/",
        views_media.serve_attachment,
        name="attachment-download",
    ),
    path(
        "notifications/stream/",
        views_sse.notifications_stream,
        name="notifications-stream",
    ),
    # Reports + Activity
    path("reports/summary/", reports_summary, name="reports-summary"),
    path("activity/feed/", activity_feed, name="activity-feed"),
    # Імпорт + bulk archive
    path("issues/import/", import_issues, name="issues-import"),
    path("issues/bulk-archive/", bulk_archive_issues, name="issues-bulk-archive"),
    path("issues/bulk-restore/", bulk_restore_issues, name="issues-bulk-restore"),
]

