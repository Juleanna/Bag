from rest_framework import permissions


def _get_project_for_obj(obj):
    """Повертає проєкт, до якого належить об'єкт (або None)."""
    # Сам об'єкт є проєктом
    if hasattr(obj, "members") and hasattr(obj, "owner"):
        return obj
    # Об'єкт прив'язаний прямо до проєкту (Issue, Membership, Invitation,
    # TestSuite, TestRun, Sprint, Webhook тощо)
    project = getattr(obj, "project", None)
    if project is not None:
        return project
    # TestCase — через suite -> project
    suite = getattr(obj, "suite", None)
    if suite is not None:
        return getattr(suite, "project", None)
    # TestResult — через run -> project (або через test_case -> suite -> project)
    run = getattr(obj, "run", None)
    if run is not None:
        return getattr(run, "project", None)
    test_case = getattr(obj, "test_case", None)
    if test_case is not None:
        tc_suite = getattr(test_case, "suite", None)
        if tc_suite is not None:
            return getattr(tc_suite, "project", None)
    # Об'єкт прив'язаний через issue (Comment, Attachment, ChecklistItem, IssueActivity, Notification)
    issue = getattr(obj, "issue", None)
    if issue is not None:
        return getattr(issue, "project", None)
    # Зв'язок між задачами — беремо проєкт першої
    from_issue = getattr(obj, "from_issue", None)
    if from_issue is not None:
        return getattr(from_issue, "project", None)
    return None


def _is_project_member(user, project):
    """Перевіряє, чи є користувач учасником або власником проєкту."""
    if project is None or not user or not user.is_authenticated:
        return False
    if project.owner_id == user.id:
        return True
    return project.members.filter(pk=user.pk).exists()


def _is_project_owner_or_manager(user, project):
    """Перевіряє, чи має користувач адміністративні права в проєкті."""
    if project is None or not user or not user.is_authenticated:
        return False
    if project.owner_id == user.id:
        return True
    return project.memberships.filter(
        user=user, role__in=["manager", "owner"]
    ).exists()


class IsAuthenticatedAndMember(permissions.BasePermission):
    """
    Дозволяє доступ лише автентифікованим користувачам.
    На рівні об'єкта перевіряє членство в проєкті власника об'єкта.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        project = _get_project_for_obj(obj)
        return _is_project_member(request.user, project)


class IsProjectOwner(permissions.BasePermission):
    """
    Дозволяє читати членам проєкту, а змінювати — тільки власнику.
    Використовується для самого Project'у.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        project = _get_project_for_obj(obj)
        if request.method in permissions.SAFE_METHODS:
            return _is_project_member(request.user, project)
        # Зміна / видалення проєкту — тільки власник
        return project is not None and project.owner_id == request.user.id


class IsProjectManager(permissions.BasePermission):
    """
    SAFE-методи дозволені будь-якому учаснику проєкту.
    Запис / зміна / видалення — лише manager / owner.
    Використовується для membership / invitation.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        project = _get_project_for_obj(obj)
        if request.method in permissions.SAFE_METHODS:
            return _is_project_member(request.user, project)
        return _is_project_owner_or_manager(request.user, project)


class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Дозволяє читати членам проєкту, а змінювати/видаляти — тільки автору об'єкта.
    Використовується для коментарів, вкладень тощо.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        project = _get_project_for_obj(obj)
        if not _is_project_member(request.user, project):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        # Перевірка автора в залежності від типу об'єкта
        for attr in ("author", "uploader", "user", "reporter"):
            if hasattr(obj, attr):
                return getattr(obj, attr) == request.user
        return False
