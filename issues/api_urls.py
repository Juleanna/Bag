from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_api import ProjectViewSet, IssueViewSet, CommentViewSet, LabelViewSet
from . import views_auth as auth


router = DefaultRouter()
router.register(r"projects", ProjectViewSet)
router.register(r"issues", IssueViewSet)
router.register(r"comments", CommentViewSet)
router.register(r"labels", LabelViewSet)

urlpatterns = [
    path("", include(router.urls)),
    # auth helpers for session-based login
    path("auth/csrf/", auth.csrf, name="auth-csrf"),
    path("auth/whoami/", auth.whoami, name="auth-whoami"),
    path("auth/login/", auth.login, name="auth-login"),
    path("auth/logout/", auth.logout, name="auth-logout"),
]
