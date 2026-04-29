import csv
import logging

from django.db import transaction
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils.crypto import get_random_string
from rest_framework import filters, pagination, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
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
    StarredIssue,
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
    StarredIssueSerializer,
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


def _notify(user, issue, message):
    """Створює сповіщення для користувача."""
    if user:
        Notification.objects.create(user=user, issue=issue, message=message[:500])


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
        return (
            qs.annotate(issues_count=Count("issues", distinct=True))
            .select_related("owner")
            .prefetch_related("members")
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

        return queryset

    def perform_create(self, serializer):
        with transaction.atomic():
            issue = serializer.save()
            _log_activity(issue, self.request.user, "created")
            # Сповіщаємо виконавця, якщо це не сам автор
            if issue.assignee and issue.assignee != self.request.user:
                _notify(issue.assignee, issue, f"Вас призначено на: {issue.title}")
        # Celery поза транзакцією, щоб не задерживати commit
        _enqueue_issue_notification(issue.id, "created")

    def perform_update(self, serializer):
        # Зчитуємо старі значення під блокуванням, щоб уникнути race condition
        with transaction.atomic():
            old = (
                Issue.objects.select_for_update()
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
                    _notify(issue.assignee, issue, f"Вас призначено на: {issue.title}")
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
                    )
                    notified_user_ids.add(u.id)

            # Сповіщаємо автора задачі і виконавця (окрім самого коментатора і вже згаданих)
            for target in [issue.reporter, issue.assignee]:
                if target and target.id not in notified_user_ids:
                    _notify(
                        target,
                        issue,
                        f"@{self.request.user.username} прокоментував: {issue.title}",
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
