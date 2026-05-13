import csv
import logging
from secrets import token_urlsafe

from django.db import models, transaction
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils.crypto import get_random_string
from rest_framework import filters, pagination, permissions, status, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.decorators import permission_classes as drf_permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import (
    Attachment,
    ChecklistItem,
    Comment,
    CommentReaction,
    Invitation,
    Issue,
    IssueActivity,
    IssueRelation,
    Label,
    Notification,
    Project,
    ProjectMembership,
    Region,
    StarredIssue,
    WorkflowStatus,
    Workspace,
)
from .permissions import (
    IsAuthenticatedAndMember,
    IsAuthorOrReadOnly,
    IsProjectManager,
    IsProjectOwner,
)
from .serializers import (
    AttachmentSerializer,
    ChecklistItemSerializer,
    CommentSerializer,
    InvitationSerializer,
    IssueActivitySerializer,
    IssueRelationSerializer,
    IssueSerializer,
    LabelSerializer,
    NotificationSerializer,
    ProjectMembershipSerializer,
    ProjectSerializer,
    RegionSerializer,
    StarredIssueSerializer,
    WorkflowStatusSerializer,
    WorkspaceSerializer,
)

logger = logging.getLogger(__name__)


def _user_projects_qs(user, include_archived: bool = False):
    """
    Повертає queryset проєктів, де користувач є учасником або власником.
    За замовчуванням архівовані проєкти приховані.

    Кешується per-request через `request._user_projects_cache`, щоб уникнути
    повторних SQL-запитів у одному циклі обробки запиту.
    """
    qs = Project.objects.filter(Q(owner=user) | Q(members=user)).distinct()
    if not include_archived:
        qs = qs.filter(is_archived=False)
    return qs


def _user_projects_cached(request, include_archived: bool = False):
    """
    Per-request кеш _user_projects_qs.
    Зберігає queryset на сам request, щоб decline не повторювати ідентичні запити
    у різних серіалізаторах і view-методах одного циклу.
    """
    key = "_user_projects_archived" if include_archived else "_user_projects"
    cached = getattr(request, key, None)
    if cached is None:
        cached = _user_projects_qs(request.user, include_archived=include_archived)
        setattr(request, key, cached)
    return cached


def _log_activity(issue, user, action, field="", old_value="", new_value=""):
    """Створює запис у журналі активностей задачі."""
    IssueActivity.objects.create(
        issue=issue,
        user=user,
        action=action,
        field=field,
        old_value=str(old_value)[:255],
        new_value=str(new_value)[:255],
    )


def _notify(user, issue, message, kind="other", actor=None):
    """Створює сповіщення для користувача."""
    if user:
        Notification.objects.create(
            user=user,
            issue=issue,
            actor=actor,
            kind=kind,
            message=message[:500],
        )


def _enqueue_issue_notification(issue_id, action):
    """Безпечно додає завдання Celery; помилки лише логуються, не падають у view."""
    try:
        from .tasks import send_issue_notification

        send_issue_notification.delay(issue_id, action)
    except Exception:
        logger.exception("Не вдалося поставити завдання Celery для задачі %s", issue_id)


class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class UserListView(viewsets.ReadOnlyModelViewSet):
    """Список користувачів (для invite-пікерів). Лише id/username/email/імʼя."""

    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        from .serializers import UserShortSerializer
        return UserShortSerializer

    def get_queryset(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        qs = User.objects.filter(is_active=True).order_by("username")
        # Простий пошук: ?q=foo шукає у username, email, first_name, last_name
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(username__icontains=q)
                | Q(email__icontains=q)
                | Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
            )
        # Виключаємо самого себе
        return qs.exclude(pk=self.request.user.pk)


class IsStaffOrReadOnly(permissions.BasePermission):
    """Перегляд — для будь-якого автентифікованого; зміни — лише для staff."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user.is_staff)


class RegionViewSet(viewsets.ModelViewSet):
    """Список регіонів зберігання даних. Read — усі авторизовані;
    CUD — лише адміністратори (is_staff)."""

    queryset = Region.objects.all()
    serializer_class = RegionSerializer
    permission_classes = [IsStaffOrReadOnly]
    pagination_class = None  # короткий список — без пагінації


class WorkflowStatusViewSet(viewsets.ModelViewSet):
    """CRUD статусів робочого процесу для проєкту. Дозволено учасникам проєкту."""

    serializer_class = WorkflowStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # короткий список — без пагінації

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = WorkflowStatus.objects.filter(project__in=user_projects)
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs.order_by("sort_order", "id")


class WorkspaceViewSet(viewsets.ModelViewSet):
    """Простори (workspaces) — організаційні одиниці. Доступні тільки власникам
    та учасникам конкретного простору."""

    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        return Workspace.objects.filter(
            Q(owner=user) | Q(members=user)
        ).distinct()

    def perform_create(self, serializer):
        with transaction.atomic():
            workspace = serializer.save(owner=self.request.user)
            workspace.members.add(self.request.user)

    def perform_destroy(self, instance):
        """При видаленні простору:
         - якщо проєкт належить лише цьому простору → видаляємо проєкт
         - якщо проєкт прив'язаний до інших просторів → лише знімаємо
           прив'язку до цього простору
        """
        with transaction.atomic():
            for project in instance.projects.all():
                if project.workspaces.count() <= 1:
                    project.delete()
                else:
                    project.workspaces.remove(instance)
            instance.delete()


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsProjectOwner]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # archived=true → показуємо тільки архівовані; archived=all → і живі, і архівні
        archived_filter = self.request.query_params.get("archived", "false")
        include_archived = archived_filter in ("true", "all")
        only_archived = archived_filter == "true"

        qs = _user_projects_cached(self.request, include_archived=include_archived)
        if only_archived:
            qs = qs.filter(is_archived=True)

        # Фільтр за простором (?workspace=<id>) — повертає лише проєкти, що
        # належать цьому простору (один проєкт може бути у декількох просторах).
        ws_id = self.request.query_params.get("workspace")
        if ws_id:
            qs = qs.filter(workspaces__id=ws_id)

        return (
            qs.annotate(issues_count=Count("issues", distinct=True))
            .select_related("owner")
            .prefetch_related("members", "workspaces")
        )

    def perform_create(self, serializer):
        # Створюємо проєкт у транзакції разом із записом OWNER у ProjectMembership.
        # З through-моделлю members.add() недоступний напряму — додавання учасника
        # завжди йде через ProjectMembership (єдине джерело істини про членство).
        with transaction.atomic():
            project = serializer.save(owner=self.request.user)
            ProjectMembership.objects.get_or_create(
                project=project,
                user=self.request.user,
                defaults={"role": ProjectMembership.Role.OWNER},
            )

    def perform_destroy(self, instance):
        # За замовчуванням DELETE архівує (soft delete) — реальне видалення лише
        # через ?force=true (тільки власник може це робити, перевірено permission'ом).
        force = self.request.query_params.get("force") == "true"
        if force:
            instance.delete()
        else:
            instance.archive()

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """Відновлення архівованого проєкту (тільки власник)."""
        # get_queryset за замовчуванням ховає archived; тому шукаємо явно
        project = (
            _user_projects_qs(request.user, include_archived=True)
            .filter(pk=pk, is_archived=True)
            .first()
        )
        if not project:
            return Response({"error": "Проєкт не знайдено"}, status=404)
        if project.owner_id != request.user.id:
            return Response({"error": "Тільки власник може відновлювати"}, status=403)
        project.restore()
        return Response({"ok": True})

    @action(detail=True, methods=["post"], url_path="apply_template")
    def apply_template(self, request, pk=None):
        """Застосовує шаблон (web/mobile/api) до проєкту — створює
        набір TestSuite + TestCase. Повертає кількість створеного."""
        from .project_templates import TEMPLATES, apply_template as run_template

        project = self.get_object()
        template_id = request.data.get("template")
        if template_id not in TEMPLATES:
            return Response(
                {"error": f"Невідомий шаблон: {template_id}"}, status=400
            )
        result = run_template(project, template_id, user=request.user)
        return Response({"ok": True, **result})

    @action(detail=True, methods=["post"], url_path="add_member")
    def add_member(self, request, pk=None):
        """Додає учасника до проєкту через ProjectMembership."""
        project = self.get_object()
        if project.owner_id != request.user.id:
            return Response(
                {"error": "Тільки власник може додавати учасників"}, status=403
            )
        user_id = request.data.get("user_id")
        role = request.data.get("role", "member")
        if not user_id:
            return Response({"error": "Не вказано user_id"}, status=400)
        if role not in dict(ProjectMembership.Role.choices):
            return Response({"error": "Невідома роль"}, status=400)
        ProjectMembership.objects.get_or_create(
            project=project,
            user_id=user_id,
            defaults={"role": role},
        )
        return Response({"ok": True})

    @action(detail=True, methods=["get"], url_path="export")
    def export_csv(self, request, pk=None):
        """Експорт усіх задач проєкту у CSV."""
        project = self.get_object()
        issues = (
            project.issues.select_related("reporter", "assignee")
            .prefetch_related("labels")
            .order_by("created_at")
        )
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = (
            f'attachment; filename="project_{project.id}_issues.csv"'
        )
        # BOM для коректного відкриття у Excel
        response.write("﻿")
        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Назва",
                "Опис",
                "Статус",
                "Пріоритет",
                "Автор",
                "Виконавець",
                "Мітки",
                "Дедлайн",
                "Створено",
                "Оновлено",
            ]
        )
        for i in issues:
            writer.writerow(
                [
                    i.id,
                    i.title,
                    i.description,
                    i.get_status_display(),
                    i.get_priority_display(),
                    i.reporter.username if i.reporter else "",
                    i.assignee.username if i.assignee else "",
                    ", ".join(lb.name for lb in i.labels.all()),
                    i.due_date.isoformat() if i.due_date else "",
                    i.created_at.isoformat(),
                    i.updated_at.isoformat(),
                ]
            )
        return response


class IssueViewSet(viewsets.ModelViewSet):
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticatedAndMember]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "priority", "status", "updated_at", "due_date"]
    ordering = ["-created_at"]

    def get_serializer_context(self):
        # Передаємо user_projects у серіалізатор для обмеження вибору project/assignee
        ctx = super().get_serializer_context()
        ctx["user_projects"] = _user_projects_cached(self.request)
        return ctx

    def get_queryset(self):
        user = self.request.user
        user_projects = _user_projects_cached(self.request)
        queryset = (
            Issue.objects.filter(project__in=user_projects)
            .select_related("project", "reporter", "assignee")
            .prefetch_related("labels")
        )

        params = self.request.query_params

        # Soft delete: за замовчуванням ховаємо archived;
        # archived=true → лише архівовані; archived=all → і живі, і архівовані
        archived = params.get("archived", "false")
        if archived == "true":
            queryset = queryset.filter(is_archived=True)
        elif archived == "all":
            pass
        else:
            queryset = queryset.filter(is_archived=False)

        project = params.get("project")
        if project:
            queryset = queryset.filter(project_id=project)

        status = params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        assignee = params.get("assignee")
        if assignee:
            if assignee == "me":
                queryset = queryset.filter(assignee=user)
            else:
                queryset = queryset.filter(assignee_id=assignee)

        priority = params.get("priority")
        if priority:
            queryset = queryset.filter(priority=priority)

        sprint = params.get("sprint")
        if sprint:
            queryset = queryset.filter(sprint_id=sprint)

        return queryset

    def perform_create(self, serializer):
        with transaction.atomic():
            issue = serializer.save()
            _log_activity(issue, self.request.user, "created")
            # Сповіщаємо виконавця, якщо це не сам автор
            if issue.assignee and issue.assignee != self.request.user:
                _notify(
                    issue.assignee,
                    issue,
                    f"Вас призначено на: {issue.title}",
                    kind="assigned",
                    actor=self.request.user,
                )
        # Celery поза транзакцією, щоб не задерживати commit
        _enqueue_issue_notification(issue.id, "created")

    def perform_update(self, serializer):
        # Зчитуємо старі значення під блокуванням, щоб уникнути race condition.
        # of=("self",) обов'язково для PostgreSQL: assignee — nullable FK,
        # тож select_related робить LEFT JOIN, а FOR UPDATE без of=self на
        # nullable side падає з NotSupportedError.
        with transaction.atomic():
            old = (
                Issue.objects.select_for_update(of=("self",))
                .select_related("assignee")
                .get(pk=serializer.instance.pk)
            )
            old_status = old.status
            old_priority = old.priority
            old_assignee_id = old.assignee_id
            old_assignee_name = old.assignee.username if old.assignee else "—"
            old_title = old.title
            old_due_date = old.due_date

            issue = serializer.save()
            user = self.request.user

            # Фіксуємо зміни в журналі активностей
            if old_status != issue.status:
                _log_activity(issue, user, "status_changed", "status", old_status, issue.status)
            if old_priority != issue.priority:
                _log_activity(
                    issue, user, "priority_changed", "priority", old_priority, issue.priority
                )
            if old_assignee_id != issue.assignee_id:
                new_name = issue.assignee.username if issue.assignee else "—"
                _log_activity(
                    issue, user, "assignee_changed", "assignee", old_assignee_name, new_name
                )
                if issue.assignee and issue.assignee != user:
                    _notify(
                    issue.assignee,
                    issue,
                    f"Вас призначено на: {issue.title}",
                    kind="assigned",
                    actor=self.request.user,
                )
            if old_title != issue.title:
                _log_activity(issue, user, "title_changed", "title", old_title, issue.title)
            if old_due_date != issue.due_date:
                _log_activity(
                    issue,
                    user,
                    "due_date_changed",
                    "due_date",
                    str(old_due_date or ""),
                    str(issue.due_date or ""),
                )
        _enqueue_issue_notification(issue.id, "updated")

    @action(detail=False, methods=["post"], url_path="bulk_update")
    def bulk_update(self, request):
        """
        Масово оновлює список задач.
        Body: {"ids": [1, 2, 3], "status": "done"}  (або priority/assignee)
        Поверне кількість оновлених записів.
        """
        ids = request.data.get("ids") or []
        if not isinstance(ids, list) or not ids:
            return Response({"error": "Потрібен список ids"}, status=400)

        # Дозволяємо лише поля, що мають сенс для масового оновлення
        allowed_fields = {"status", "priority", "assignee", "due_date"}
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        if not update_data:
            return Response({"error": "Немає полів для оновлення"}, status=400)

        # Валідація значень choices
        if "status" in update_data and update_data["status"] not in dict(Issue.Status.choices):
            return Response({"error": "Невірний статус"}, status=400)
        if "priority" in update_data and update_data["priority"] not in dict(
            Issue.Priority.choices
        ):
            return Response({"error": "Невірний пріоритет"}, status=400)

        # Обмежуємо коло задач лише доступними користувачу
        user_projects = _user_projects_cached(request)
        qs = Issue.objects.filter(id__in=ids, project__in=user_projects)

        # Заміна assignee на ідентифікатор поля
        if "assignee" in update_data:
            update_data["assignee_id"] = update_data.pop("assignee")

        with transaction.atomic():
            updated = qs.update(**update_data)
            # Реєструємо bulk дію в журналі для кожної задачі
            for issue in qs:
                _log_activity(
                    issue,
                    request.user,
                    "bulk_updated",
                    field=",".join(update_data.keys()),
                    old_value="",
                    new_value=str(update_data),
                )
        return Response({"updated": updated})

    @action(detail=False, methods=["get"], url_path="export")
    def export_csv(self, request):
        """Експорт відфільтрованого списку задач у CSV."""
        issues = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="issues.csv"'
        response.write("﻿")  # BOM для Excel
        writer = csv.writer(response)
        writer.writerow(
            ["ID", "Проєкт", "Назва", "Статус", "Пріоритет", "Виконавець", "Створено"]
        )
        for i in issues:
            writer.writerow(
                [
                    i.id,
                    i.project.name,
                    i.title,
                    i.get_status_display(),
                    i.get_priority_display(),
                    i.assignee.username if i.assignee else "",
                    i.created_at.isoformat(),
                ]
            )
        return response


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthorOrReadOnly]
    pagination_class = StandardResultsSetPagination

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["user_projects"] = _user_projects_cached(self.request)
        return ctx

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = (
            Comment.objects.filter(issue__project__in=user_projects)
            .select_related("issue", "author")
            .order_by("-created_at")
        )
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs

    def perform_create(self, serializer):
        import re

        with transaction.atomic():
            comment = serializer.save()
            _log_activity(comment.issue, self.request.user, "comment_added")
            issue = comment.issue
            notified_user_ids = {self.request.user.id}

            # Сповіщення для @mentions у тілі коментаря (учасників проєкту)
            mentioned = set(re.findall(r"@(\w+)", comment.body or ""))
            if mentioned:
                from django.contrib.auth import get_user_model

                UserModel = get_user_model()
                project_users = UserModel.objects.filter(
                    projects=issue.project, username__in=mentioned
                ).distinct()
                for u in project_users:
                    if u.id in notified_user_ids:
                        continue
                    _notify(
                        u,
                        issue,
                        f"@{self.request.user.username} згадав вас у: {issue.title}",
                        kind="mention",
                        actor=self.request.user,
                    )
                    notified_user_ids.add(u.id)

            # Сповіщаємо автора задачі і виконавця (окрім самого коментатора і вже згаданих)
            for target in [issue.reporter, issue.assignee]:
                if target and target.id not in notified_user_ids:
                    _notify(
                        target,
                        issue,
                        f"@{self.request.user.username} прокоментував: {issue.title}",
                        kind="comment",
                        actor=self.request.user,
                    )
                    notified_user_ids.add(target.id)

    @action(detail=True, methods=["post"], url_path="react")
    def react(self, request, pk=None):
        """
        Додає або знімає реакцію на коментар.
        Body: {"emoji": "👍"} — toggle.
        """
        comment = self.get_object()
        emoji = request.data.get("emoji")
        if not emoji or emoji not in dict(CommentReaction.REACTION_CHOICES):
            return Response({"error": "Невірний емодзі"}, status=400)

        with transaction.atomic():
            existing = (
                CommentReaction.objects.select_for_update()
                .filter(comment=comment, user=request.user, emoji=emoji)
                .first()
            )
            if existing:
                existing.delete()
                action_taken = "removed"
            else:
                CommentReaction.objects.create(
                    comment=comment, user=request.user, emoji=emoji
                )
                action_taken = "added"

        # Повертаємо актуальний стан реакцій по емодзі
        from django.db.models import Count as DjCount

        counts = (
            CommentReaction.objects.filter(comment=comment)
            .values("emoji")
            .annotate(count=DjCount("id"))
        )
        return Response({"action": action_taken, "reactions": list(counts)})


class LabelViewSet(viewsets.ModelViewSet):
    """Мітки — глобальні; запис лише для адміністраторів."""

    queryset = Label.objects.all().order_by("name")
    serializer_class = LabelSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        # Створення / зміна / видалення міток — тільки адміністратор
        return [permissions.IsAdminUser()]


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthorOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = StandardResultsSetPagination

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["user_projects"] = _user_projects_cached(self.request)
        return ctx

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        # Обмежуємо вибірку лише задачами в проєктах користувача
        qs = (
            Attachment.objects.filter(issue__project__in=user_projects)
            .select_related("issue", "uploader")
            .order_by("-created_at")
        )
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs


class ProjectMembershipViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectMembershipSerializer
    permission_classes = [IsProjectManager]
    pagination_class = StandardResultsSetPagination

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["user_projects"] = _user_projects_cached(self.request)
        return ctx

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = (
            ProjectMembership.objects.filter(project__in=user_projects)
            .select_related("project", "user")
            .order_by("-created_at")
        )
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs


class InvitationViewSet(viewsets.ModelViewSet):
    serializer_class = InvitationSerializer
    permission_classes = [IsProjectManager]
    pagination_class = StandardResultsSetPagination

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["user_projects"] = _user_projects_cached(self.request)
        return ctx

    def get_queryset(self):
        # Тільки запрошення в проєктах, де користувач є manager / owner
        user = self.request.user
        managed_project_ids = ProjectMembership.objects.filter(
            user=user, role__in=["manager", "owner"]
        ).values_list("project_id", flat=True)
        owned_project_ids = Project.objects.filter(owner=user).values_list("id", flat=True)
        allowed_ids = set(managed_project_ids) | set(owned_project_ids)

        qs = (
            Invitation.objects.filter(project_id__in=allowed_ids)
            .select_related("project")
            .order_by("-created_at")
        )
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    def perform_create(self, serializer):
        # Унікальний токен запрошення
        token = get_random_string(40)
        serializer.save(token=token)

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def accept(self, request):
        """Приймає запрошення за токеном — створює membership для поточного користувача."""
        token = request.data.get("token")
        if not token:
            return Response({"ok": False, "error": "Не вказано токен"}, status=400)

        with transaction.atomic():
            inv = (
                Invitation.objects.select_for_update()
                .filter(token=token, accepted=False)
                .first()
            )
            if not inv:
                return Response(
                    {"ok": False, "error": "Запрошення не знайдено або вже використано"},
                    status=400,
                )
            # Перевіряємо, що email запрошення збігається з email користувача
            if request.user.email and inv.email and request.user.email.lower() != inv.email.lower():
                return Response(
                    {"ok": False, "error": "Це запрошення для іншої адреси"},
                    status=403,
                )

            # Через through-модель додавання учасника = створення ProjectMembership.
            # Окремий project.members.add() більше не потрібен — рядка вище достатньо.
            ProjectMembership.objects.get_or_create(
                project=inv.project,
                user=request.user,
                defaults={"role": inv.role},
            )
            inv.accepted = True
            inv.save(update_fields=["accepted"])

        return Response({"ok": True})


class IssueActivityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IssueActivitySerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndMember]

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        # Фільтруємо за членством — інакше витік журналу інших проєктів
        qs = (
            IssueActivity.objects.filter(issue__project__in=user_projects)
            .select_related("user", "issue")
            .order_by("-created_at")
        )
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs


class IssueRelationViewSet(viewsets.ModelViewSet):
    serializer_class = IssueRelationSerializer
    permission_classes = [IsAuthenticatedAndMember]
    pagination_class = StandardResultsSetPagination

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["user_projects"] = _user_projects_cached(self.request)
        return ctx

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = (
            IssueRelation.objects.filter(from_issue__project__in=user_projects)
            .select_related("from_issue", "to_issue")
            .order_by("-created_at")
        )
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(Q(from_issue_id=issue_id) | Q(to_issue_id=issue_id))
        return qs


class ChecklistItemViewSet(viewsets.ModelViewSet):
    serializer_class = ChecklistItemSerializer
    permission_classes = [IsAuthenticatedAndMember]
    pagination_class = StandardResultsSetPagination

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["user_projects"] = _user_projects_cached(self.request)
        return ctx

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = (
            ChecklistItem.objects.filter(issue__project__in=user_projects)
            .select_related("issue")
            .order_by("position", "created_at")
        )
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Slicing прибрано — це ламало DRF пагінацію і mark_read(detail=True)
        return (
            Notification.objects.filter(user=self.request.user)
            .select_related("issue")
            .order_by("-created_at")
        )

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
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Користувач бачить лише свої зірковані задачі
        return StarredIssue.objects.filter(user=self.request.user).select_related("issue")

    def perform_create(self, serializer):
        # Перевіряємо, що задача в проєкті користувача
        issue = serializer.validated_data.get("issue")
        if issue and not _user_projects_qs(self.request.user).filter(pk=issue.project_id).exists():
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Немає доступу до цієї задачі")
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"])
    def toggle(self, request):
        """Перемикає стан 'обраного' для задачі — атомарно через транзакцію."""
        issue_id = request.data.get("issue")
        if not issue_id:
            return Response({"error": "Не вказано задачу"}, status=400)

        # Перевіряємо доступ користувача до задачі
        if not Issue.objects.filter(
            pk=issue_id, project__in=_user_projects_qs(request.user)
        ).exists():
            return Response({"error": "Задачу не знайдено"}, status=404)

        with transaction.atomic():
            existing = (
                StarredIssue.objects.select_for_update()
                .filter(user=request.user, issue_id=issue_id)
                .first()
            )
            if existing:
                existing.delete()
                return Response({"starred": False})
            StarredIssue.objects.create(user=request.user, issue_id=issue_id)
            return Response({"starred": True})


# ============================================================================
# Imports for new ViewSets
# ============================================================================

from .models import (  # noqa: E402
    ApiToken,
    ChangelogEntry,
    ChangelogReaction,
    ChangelogSubscription,
    IntegrationConfig,
    IssueTemplate,
    LoginEvent,
    RoadmapItem,
    SavedFilter,
    Sprint,
    TestCase,
    TestResult,
    TestRun,
    TestSuite,
    TimeLog,
    Webhook,
)
from .serializers import (  # noqa: E402
    ApiTokenSerializer,
    ChangelogEntrySerializer,
    ChangelogSubscriptionSerializer,
    IntegrationConfigSerializer,
    IssueTemplateSerializer,
    LoginEventSerializer,
    RoadmapItemSerializer,
    SavedFilterSerializer,
    SprintSerializer,
    TestCaseSerializer,
    TestResultSerializer,
    TestRunSerializer,
    TestSuiteSerializer,
    TimeLogSerializer,
    WebhookSerializer,
)


# ============================================================================
# Sprint
# ============================================================================


class SprintViewSet(viewsets.ModelViewSet):
    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticatedAndMember]
    pagination_class = StandardResultsSetPagination
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = Sprint.objects.filter(project__in=user_projects).select_related("project")
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs


# ============================================================================
# Issue templates / Time tracking / Saved filters
# ============================================================================


class IssueTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = IssueTemplateSerializer
    permission_classes = [IsAuthenticatedAndMember]
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        return IssueTemplate.objects.filter(
            Q(project__isnull=True) | Q(project__in=user_projects)
        ).distinct()


class TimeLogViewSet(viewsets.ModelViewSet):
    serializer_class = TimeLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = TimeLog.objects.filter(issue__project__in=user_projects).select_related(
            "user", "issue"
        )
        issue_id = self.request.query_params.get("issue")
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs

    def perform_create(self, serializer):
        with transaction.atomic():
            log = serializer.save(user=self.request.user)
            Issue.objects.filter(pk=log.issue_id).update(
                time_spent_minutes=models.F("time_spent_minutes") + log.minutes
            )

    def perform_destroy(self, instance):
        with transaction.atomic():
            Issue.objects.filter(pk=instance.issue_id).update(
                time_spent_minutes=models.F("time_spent_minutes") - instance.minutes
            )
            instance.delete()


class SavedFilterViewSet(viewsets.ModelViewSet):
    serializer_class = SavedFilterSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        return SavedFilter.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChangelogEntryViewSet(viewsets.ModelViewSet):
    """Changelog продукту. Читати може будь-який автентифікований користувач,
    редагувати/створювати/видаляти — лише staff (адміністратор)."""

    serializer_class = ChangelogEntrySerializer
    parser_classes = [JSONParser, FormParser]
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        qs = ChangelogEntry.objects.all()
        # Звичайні користувачі бачать лише опубліковані; staff бачить усе.
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        return qs

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAdminUser],
    )
    def notify_subscribers(self, request, pk=None):
        """Ручна розсилка цього запису всім активним підпискам. Корисно
        для повторної розсилки відредагованого запису або якщо автоматична
        не пройшла (наприклад, SMTP не був налаштований при створенні)."""
        entry = self.get_object()
        from .changelog_notify import send_release_email

        try:
            sent = send_release_email(entry)
        except Exception as exc:
            # Повертаємо 502 (Bad Gateway) — наш сервер ок, але email-провайдер впав.
            # У фронта буде конкретний текст у toast'і замість загального "Помилка".
            return Response(
                {"detail": f"Не вдалося надіслати email: {exc}"},
                status=502,
            )
        return Response({"sent": sent})

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def helpful(self, request, pk=None):
        """Toggle реакції «корисно» для запису. Ідемпотентний: повторний
        виклик знімає реакцію. Повертає актуальне число лайків і прапор
        is_helpful_by_me."""
        entry = self.get_object()
        existing = ChangelogReaction.objects.filter(
            entry=entry, user=request.user, kind=ChangelogReaction.Kind.HELPFUL
        ).first()
        if existing:
            existing.delete()
            is_now = False
        else:
            ChangelogReaction.objects.create(
                entry=entry, user=request.user, kind=ChangelogReaction.Kind.HELPFUL
            )
            is_now = True
        count = entry.reactions.filter(kind="helpful").count()
        return Response({"helpful_count": count, "is_helpful_by_me": is_now})


class ChangelogSubscriptionViewSet(viewsets.ModelViewSet):
    """Адмін-керування підписками на Changelog. Звичайні юзери підписуються
    через окремий публічний endpoint /api/changelog/subscribe/."""

    serializer_class = ChangelogSubscriptionSerializer
    queryset = ChangelogSubscription.objects.all()
    permission_classes = [permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination


class RoadmapItemViewSet(viewsets.ModelViewSet):
    """Дорожня карта. Будь-який залогований може читати, лише staff — писати."""

    serializer_class = RoadmapItemSerializer
    queryset = RoadmapItem.objects.all()
    parser_classes = [JSONParser, FormParser]
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


@api_view(["POST"])
@drf_permission_classes([permissions.AllowAny])
def changelog_subscribe(request):
    """Публічна підписка на оновлення Changelog. Якщо email вже існує —
    реактивуємо (is_active=True), не створюємо дубль."""
    email = str(request.data.get("email", "")).strip().lower()
    if not email:
        return Response({"detail": "email обовʼязковий"}, status=400)
    serializer = ChangelogSubscriptionSerializer(data={"email": email})
    serializer.is_valid()  # викликаємо лише для валідації формату email
    if "email" in serializer.errors:
        return Response({"email": serializer.errors["email"]}, status=400)
    sub, created = ChangelogSubscription.objects.get_or_create(
        email=email, defaults={"is_active": True}
    )
    if not created and not sub.is_active:
        sub.is_active = True
        sub.save(update_fields=["is_active"])
    return Response(
        {"ok": True, "created": created, "email": email}, status=201 if created else 200
    )


# ============================================================================
# Test management
# ============================================================================


class TestSuiteViewSet(viewsets.ModelViewSet):
    serializer_class = TestSuiteSerializer
    permission_classes = [IsAuthenticatedAndMember]
    pagination_class = StandardResultsSetPagination
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = TestSuite.objects.filter(project__in=user_projects)
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs


class TestCaseViewSet(viewsets.ModelViewSet):
    serializer_class = TestCaseSerializer
    permission_classes = [IsAuthenticatedAndMember]
    pagination_class = StandardResultsSetPagination
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = TestCase.objects.filter(suite__project__in=user_projects).select_related(
            "suite", "created_by"
        )
        suite_id = self.request.query_params.get("suite")
        if suite_id:
            qs = qs.filter(suite_id=suite_id)
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(suite__project_id=project_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TestRunViewSet(viewsets.ModelViewSet):
    serializer_class = TestRunSerializer
    permission_classes = [IsAuthenticatedAndMember]
    pagination_class = StandardResultsSetPagination
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = TestRun.objects.filter(project__in=user_projects).prefetch_related(
            "test_cases", "results"
        )
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        from django.utils import timezone as tz

        run = self.get_object()
        run.status = TestRun.Status.IN_PROGRESS
        run.started_at = tz.now()
        run.save(update_fields=["status", "started_at"])
        # Зберігаємо snapshot даних кейса для подальшого drift-detection
        TestResult.objects.bulk_create(
            [
                TestResult(
                    run=run,
                    test_case=tc,
                    result=TestResult.Result.PENDING,
                    case_title_snapshot=tc.title,
                    case_steps_snapshot=tc.steps or [],
                    case_preconditions_snapshot=tc.preconditions or "",
                )
                for tc in run.test_cases.all()
            ],
            ignore_conflicts=True,
        )
        return Response(self.get_serializer(run).data)

    @action(detail=True, methods=["post"])
    def finish(self, request, pk=None):
        from django.utils import timezone as tz

        run = self.get_object()
        run.status = TestRun.Status.COMPLETED
        run.finished_at = tz.now()
        run.save(update_fields=["status", "finished_at"])
        return Response(self.get_serializer(run).data)


class TestResultViewSet(viewsets.ModelViewSet):
    serializer_class = TestResultSerializer
    permission_classes = [IsAuthenticatedAndMember]
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        qs = TestResult.objects.filter(
            run__project__in=user_projects
        ).select_related("test_case", "executed_by", "run")
        run_id = self.request.query_params.get("run")
        if run_id:
            qs = qs.filter(run_id=run_id)
        tc_id = self.request.query_params.get("test_case")
        if tc_id:
            qs = qs.filter(test_case_id=tc_id)
        return qs.order_by("-id")

    def perform_update(self, serializer):
        from django.utils import timezone as tz

        serializer.save(executed_by=self.request.user, executed_at=tz.now())

    @action(detail=True, methods=["post"], url_path="sync_from_case")
    def sync_from_case(self, request, pk=None):
        """Оновити snapshot result-а з актуальних даних TestCase."""
        result = self.get_object()
        tc = result.test_case
        result.case_title_snapshot = tc.title
        result.case_steps_snapshot = tc.steps or []
        result.case_preconditions_snapshot = tc.preconditions or ""
        result.save(
            update_fields=[
                "case_title_snapshot",
                "case_steps_snapshot",
                "case_preconditions_snapshot",
            ]
        )
        return Response(self.get_serializer(result).data)

    @action(detail=True, methods=["post"], url_path="sync_to_case")
    def sync_to_case(self, request, pk=None):
        """Зворотний напрям: вставити snapshot result-а у TestCase
        (тобто прийняти стару версію з рану як актуальну)."""
        result = self.get_object()
        tc = result.test_case
        if result.case_title_snapshot:
            tc.title = result.case_title_snapshot
        if result.case_steps_snapshot is not None:
            tc.steps = result.case_steps_snapshot
        if result.case_preconditions_snapshot:
            tc.preconditions = result.case_preconditions_snapshot
        tc.save(update_fields=["title", "steps", "preconditions"])
        return Response(self.get_serializer(result).data)


# ============================================================================
# API tokens / Login history / Webhooks / Integrations
# ============================================================================


class ApiTokenViewSet(viewsets.ModelViewSet):
    serializer_class = ApiTokenSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        return ApiToken.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, key=token_urlsafe(40))

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        from django.utils import timezone as tz

        token = self.get_object()
        token.revoked_at = tz.now()
        token.save(update_fields=["revoked_at"])
        return Response(self.get_serializer(token).data)


class LoginEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LoginEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        if self.request.user.is_staff:
            return LoginEvent.objects.all().order_by("-created_at")[:500]
        return LoginEvent.objects.filter(user=self.request.user).order_by("-created_at")[:200]


class WebhookViewSet(viewsets.ModelViewSet):
    serializer_class = WebhookSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        return Webhook.objects.all().order_by("-created_at")


class IntegrationConfigViewSet(viewsets.ModelViewSet):
    serializer_class = IntegrationConfigSerializer
    permission_classes = [IsAuthenticatedAndMember]
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        user_projects = _user_projects_cached(self.request)
        return IntegrationConfig.objects.filter(project__in=user_projects)


# ============================================================================
# Reports + Activity feed (function-based)
# ============================================================================


@api_view(["GET"])
@drf_permission_classes([permissions.IsAuthenticated])
def reports_summary(request):
    """Агреговані метрики для Reports: created/closed/days, MTTR, top assignees."""
    from datetime import timedelta

    from django.utils import timezone as tz

    user_projects = _user_projects_cached(request)
    project_id = request.query_params.get("project")
    issues_qs = Issue.objects.filter(project__in=user_projects)
    if project_id:
        issues_qs = issues_qs.filter(project_id=project_id)

    now = tz.now()
    days = []
    for i in range(29, -1, -1):
        day = now - timedelta(days=i)
        day_iso = day.date().isoformat()
        created = issues_qs.filter(created_at__date=day.date()).count()
        closed = issues_qs.filter(
            status__in=["done", "cancelled"], updated_at__date=day.date()
        ).count()
        days.append({"day": day_iso, "created": created, "closed": closed})

    closed_issues = list(issues_qs.filter(status="done")[:200])
    durations = [
        (it.updated_at - it.created_at).total_seconds() / 3600 for it in closed_issues
    ]
    mttr_hours = round(sum(durations) / len(durations), 1) if durations else 0

    by_status = list(
        issues_qs.values("status").annotate(n=Count("id")).order_by("-n")
    )
    top_assignees = list(
        issues_qs.filter(status="done", assignee__isnull=False)
        .values("assignee", "assignee__username")
        .annotate(n=Count("id"))
        .order_by("-n")[:5]
    )

    return Response(
        {
            "days": days,
            "mttr_hours": mttr_hours,
            "by_status": by_status,
            "top_assignees": top_assignees,
        }
    )


@api_view(["GET"])
@drf_permission_classes([permissions.IsAuthenticated])
def activity_feed(request):
    user_projects = _user_projects_cached(request)
    qs = (
        IssueActivity.objects.filter(issue__project__in=user_projects)
        .select_related("user", "issue", "issue__project")
        .order_by("-created_at")[:20]
    )
    return Response(IssueActivitySerializer(qs, many=True).data)


# ============================================================================
# 2FA TOTP (потребує `pip install pyotp`)
# ============================================================================


@api_view(["POST"])
@drf_permission_classes([permissions.IsAuthenticated])
def totp_enroll(request):
    try:
        import pyotp
    except ImportError:
        return Response(
            {"error": "Встановіть pyotp: pip install pyotp"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    from .models import UserProfile

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    secret = pyotp.random_base32()
    profile.totp_secret = secret
    profile.totp_enabled = False
    profile.save(update_fields=["totp_secret", "totp_enabled"])
    issuer = "BugTracker"
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=request.user.email or request.user.username, issuer_name=issuer
    )
    return Response({"secret": secret, "otpauth_uri": uri, "issuer": issuer})


@api_view(["POST"])
@drf_permission_classes([permissions.IsAuthenticated])
def totp_verify_and_enable(request):
    try:
        import pyotp
    except ImportError:
        return Response({"error": "pyotp not installed"}, status=500)
    from .models import UserProfile

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    code = request.data.get("code", "")
    if not profile.totp_secret:
        return Response({"error": "Спершу викличте /enroll"}, status=400)
    if not pyotp.TOTP(profile.totp_secret).verify(code):
        return Response({"error": "Невірний код"}, status=400)
    profile.totp_enabled = True
    profile.save(update_fields=["totp_enabled"])
    return Response({"ok": True, "enabled": True})


@api_view(["POST"])
@drf_permission_classes([permissions.IsAuthenticated])
def totp_disable(request):
    try:
        import pyotp
    except ImportError:
        return Response({"error": "pyotp not installed"}, status=500)
    from .models import UserProfile

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    code = request.data.get("code", "")
    if profile.totp_enabled and not pyotp.TOTP(profile.totp_secret or "").verify(code):
        return Response({"error": "Невірний код"}, status=400)
    profile.totp_secret = ""
    profile.totp_enabled = False
    profile.save(update_fields=["totp_secret", "totp_enabled"])
    return Response({"ok": True, "enabled": False})


# ============================================================================
# CSV/JSON import
# ============================================================================


@api_view(["POST"])
@drf_permission_classes([IsAuthenticatedAndMember])
def import_issues(request):
    """
    Body: {project: id, items: [{title, description, status, priority}]}
    Імпортує задачі з зовнішніх систем (JIRA / Linear / GitHub Issues, попередньо
    конвертованих у простий JSON).
    """
    project_id = request.data.get("project")
    items = request.data.get("items") or []
    if not project_id or not isinstance(items, list):
        return Response({"error": "project та items обов'язкові"}, status=400)
    if not _user_projects_cached(request).filter(pk=project_id).exists():
        return Response({"error": "Немає доступу до проєкту"}, status=403)

    created = []
    with transaction.atomic():
        for it in items:
            try:
                issue = Issue.objects.create(
                    project_id=project_id,
                    title=str(it.get("title", ""))[:255] or "Untitled",
                    description=str(it.get("description", "")),
                    status=it.get("status", "open"),
                    priority=it.get("priority", "medium"),
                    reporter=request.user,
                )
                created.append(issue.id)
            except Exception:
                logger.exception("import_issues: failed for %s", it)
    return Response({"created": len(created), "ids": created})


# ============================================================================
# Bulk archive / restore для Issue (soft delete)
# ============================================================================


@api_view(["POST"])
@drf_permission_classes([permissions.IsAuthenticated])
def bulk_archive_issues(request):
    """Body: {ids: [pk]} — архівує (soft delete) задачі."""
    from django.utils import timezone as tz

    ids = request.data.get("ids") or []
    if not isinstance(ids, list):
        return Response({"error": "ids must be list"}, status=400)
    user_projects = _user_projects_cached(request)
    qs = Issue.objects.filter(id__in=ids, project__in=user_projects, is_archived=False)
    updated = qs.update(is_archived=True, archived_at=tz.now())
    return Response({"archived": updated})


@api_view(["POST"])
@drf_permission_classes([permissions.IsAuthenticated])
def bulk_restore_issues(request):
    ids = request.data.get("ids") or []
    if not isinstance(ids, list):
        return Response({"error": "ids must be list"}, status=400)
    user_projects = _user_projects_cached(request)
    qs = Issue.objects.filter(id__in=ids, project__in=user_projects, is_archived=True)
    updated = qs.update(is_archived=False, archived_at=None)
    return Response({"restored": updated})
