from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models

User = get_user_model()


# Дозволені розширення файлів для вкладень
ALLOWED_FILE_EXTENSIONS = [
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods",
    "txt", "md", "csv", "log",
    "jpg", "jpeg", "png", "gif", "webp", "svg",
    "zip", "rar", "7z", "tar", "gz",
    "mp3", "mp4", "mov", "avi", "webm",
]

# Максимальний розмір вкладення (10 МБ)
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024


def validate_file_size(value):
    """Перевіряє, що розмір файлу не перевищує MAX_ATTACHMENT_SIZE."""
    if value.size > MAX_ATTACHMENT_SIZE:
        raise ValidationError(
            f"Розмір файлу не може перевищувати {MAX_ATTACHMENT_SIZE // (1024 * 1024)} МБ."
        )


class WorkflowStatus(models.Model):
    """Кастомний статус робочого процесу проєкту.
    Дозволяє кожному проєкту задати власний набір статусів і їх кольорів.
    Якщо для проєкту немає WorkflowStatus — використовується дефолтний набір.
    """

    project = models.ForeignKey(
        "Project",
        on_delete=models.CASCADE,
        related_name="workflow_statuses",
    )
    key = models.CharField(max_length=32, db_index=True)
    label = models.CharField(max_length=64)
    color = models.CharField(max_length=24, default="var(--st-open-dot)")
    sort_order = models.IntegerField(default=0)
    is_default = models.BooleanField(default=False)
    is_done = models.BooleanField(default=False, help_text="Чи статус вважається завершеним")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]
        unique_together = ("project", "key")

    def __str__(self) -> str:
        return f"{self.project.name} · {self.label}"


class Region(models.Model):
    """Регіон зберігання даних (EU/US/AP/UA тощо). Керується адміністратором."""

    code = models.CharField(max_length=16, unique=True, db_index=True)
    label = models.CharField(max_length=120)
    # Опціональна іконка-emoji для відображення.
    icon = models.CharField(max_length=8, blank=True)
    # Опціональний порядок у списку (менше — раніше).
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "label"]

    def __str__(self) -> str:
        return f"{self.icon} {self.label}".strip()

    def save(self, *args, **kwargs):
        # Гарантуємо, що default лише один
        if self.is_default:
            Region.objects.exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class Workspace(models.Model):
    """Простір — організаційна одиниця, що містить кілька проєктів,
    учасників і власні налаштування (білінг, регіон даних тощо)."""

    name = models.CharField(max_length=200, db_index=True)
    # URL-адреса простору (app.bugforge.io/<slug>).
    slug = models.SlugField(max_length=64, unique=True, db_index=True)
    color = models.CharField(max_length=9, default="#5E6AD2")
    # Метадані з wizard'у створення.
    team_size = models.CharField(max_length=20, blank=True)
    industry = models.CharField(max_length=20, blank=True)
    region = models.CharField(max_length=10, blank=True)
    auto_join_domain = models.BooleanField(default=False)
    domain = models.CharField(max_length=100, blank=True)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="owned_workspaces"
    )
    members = models.ManyToManyField(User, related_name="workspaces", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name


class Project(models.Model):
    class Visibility(models.TextChoices):
        TEAM = "team", "Команда"
        ORG = "org", "Уся організація"
        PRIVATE = "private", "Приватний"

    name = models.CharField(max_length=200, db_index=True)
    # Префікс для людино-читних ID (наприклад "WEB" → WEB-101).
    key = models.CharField(max_length=10, blank=True, db_index=True)
    description = models.TextField(blank=True)
    # Кольор та іконка для UI (без впливу на бізнес-логіку).
    color = models.CharField(max_length=9, default="#5E6AD2")
    icon = models.CharField(max_length=32, default="Layout")
    visibility = models.CharField(
        max_length=10, choices=Visibility.choices, default=Visibility.TEAM
    )
    # Простори, до яких належить проєкт. Один проєкт може бути спільним для
    # декількох просторів (наприклад "Public API" — і у Web team, і у Mobile team).
    workspaces = models.ManyToManyField(
        Workspace,
        related_name="projects",
        blank=True,
    )
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="owned_projects"
    )
    # Учасники проєкту через explicit through-модель ProjectMembership.
    # Це усуває розсинхрон між Project.members і ProjectMembership.role
    members = models.ManyToManyField(
        User,
        related_name="projects",
        blank=True,
        through="ProjectMembership",
    )
    # Soft delete: архівований проєкт прихований у списках, але можна відновити
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "-created_at"]),
            models.Index(fields=["name"]),
            models.Index(fields=["is_archived", "-created_at"]),
        ]

    def __str__(self) -> str:
        return self.name

    def archive(self):
        """Архівує проєкт замість фізичного видалення."""
        from django.utils import timezone

        self.is_archived = True
        self.archived_at = timezone.now()
        self.save(update_fields=["is_archived", "archived_at"])

    def restore(self):
        """Відновлює проєкт з архіву."""
        self.is_archived = False
        self.archived_at = None
        self.save(update_fields=["is_archived", "archived_at"])


class Label(models.Model):
    name = models.CharField(max_length=64, unique=True)
    color = models.CharField(max_length=7, default="#3b82f6")  # HEX-колір

    def __str__(self) -> str:
        return self.name


class Issue(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Відкрито"
        IN_PROGRESS = "in_progress", "В процесі"
        DONE = "done", "Готово"
        CANCELLED = "cancelled", "Скасовано"

    class Priority(models.TextChoices):
        LOW = "low", "Низький"
        MEDIUM = "medium", "Середній"
        HIGH = "high", "Високий"
        CRITICAL = "critical", "Критичний"

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="issues", db_index=True
    )
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    # Legacy enum-поле залишене для зворотньої сумісності частини коду
    # (наприклад, signals.py і деякі тести використовують issue.status). Реальним
    # джерелом істини стало workflow_status (FK на WorkflowStatus).
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True
    )
    workflow_status = models.ForeignKey(
        "WorkflowStatus",
        on_delete=models.SET_NULL,
        related_name="issues",
        null=True,
        blank=True,
    )
    priority = models.CharField(
        max_length=20, choices=Priority.choices, default=Priority.MEDIUM, db_index=True
    )
    assignee = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_issues",
        db_index=True,
    )
    reporter = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="reported_issues"
    )
    labels = models.ManyToManyField(Label, blank=True, related_name="issues")
    due_date = models.DateField(null=True, blank=True)
    # Time tracking — фактично витрачені хвилини (накопичувально)
    time_spent_minutes = models.PositiveIntegerField(default=0)
    # Custom fields — довільний JSON {field_name: value} (Browser, OS, Env тощо)
    custom_fields = models.JSONField(default=dict, blank=True)
    # Soft delete — баг у "кошику", не показується у звичайних списках
    is_archived = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    # Sprint (iteration), якщо задача належить активному спринту
    sprint = models.ForeignKey(
        "Sprint",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="issues",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["assignee", "status"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["priority", "-created_at"]),
            models.Index(fields=["is_archived", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"[{self.project.name}] {self.title}"


class Comment(models.Model):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="comments", db_index=True
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["issue", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"Коментар до {self.issue_id} від {self.author_id}"


class Attachment(models.Model):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="attachments"
    )
    # Обмежуємо завантаження за типом і розміром (захист від XSS і великих файлів)
    file = models.FileField(
        upload_to="attachments/%Y/%m/%d/",
        validators=[
            FileExtensionValidator(allowed_extensions=ALLOWED_FILE_EXTENSIONS),
            validate_file_size,
        ],
    )
    name = models.CharField(max_length=255, blank=True)
    uploader = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="uploaded_attachments"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.name and self.file:
            self.name = getattr(self.file, "name", self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name or f"Вкладення #{self.pk}"


class ProjectMembership(models.Model):
    class Role(models.TextChoices):
        VIEWER = "viewer", "Спостерігач"
        MEMBER = "member", "Учасник"
        MANAGER = "manager", "Менеджер"
        OWNER = "owner", "Власник"

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "user")

    def __str__(self) -> str:
        return f"{self.user} → {self.project} ({self.role})"


class Invitation(models.Model):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="invitations"
    )
    email = models.EmailField()
    role = models.CharField(
        max_length=20,
        choices=ProjectMembership.Role.choices,
        default=ProjectMembership.Role.MEMBER,
    )
    token = models.CharField(max_length=64, unique=True)
    accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Запрошення {self.email} до {self.project} ({self.role})"


class IssueActivity(models.Model):
    """Журнал змін задачі (audit log)."""

    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="activities"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activities")
    # Тип дії: "status_changed", "assigned", "comment_added" тощо
    action = models.CharField(max_length=50)
    field = models.CharField(max_length=50, blank=True)
    old_value = models.CharField(max_length=255, blank=True)
    new_value = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["issue", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} {self.action} on {self.issue_id}"


class IssueRelation(models.Model):
    """Зв'язки між задачами."""

    class RelationType(models.TextChoices):
        BLOCKS = "blocks", "Блокує"
        BLOCKED_BY = "blocked_by", "Заблоковано"
        RELATES_TO = "relates_to", "Пов'язано з"
        DUPLICATE_OF = "duplicate_of", "Дублікат"

    from_issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="relations_from"
    )
    to_issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="relations_to"
    )
    relation_type = models.CharField(max_length=20, choices=RelationType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("from_issue", "to_issue", "relation_type")
        constraints = [
            # Заборона самопосилання задачі на себе
            models.CheckConstraint(
                condition=~models.Q(from_issue=models.F("to_issue")),
                name="issue_relation_no_self_reference",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.from_issue_id} {self.relation_type} {self.to_issue_id}"


class ChecklistItem(models.Model):
    """Підзадача / пункт чек-листа всередині задачі."""

    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="checklist_items"
    )
    text = models.CharField(max_length=500)
    is_done = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "created_at"]

    def __str__(self) -> str:
        mark = "[x]" if self.is_done else "[ ]"
        return f"{mark} {self.text}"


class Notification(models.Model):
    """Сповіщення для користувача."""

    class Kind(models.TextChoices):
        MENTION = "mention", "Згадка"
        ASSIGNED = "assigned", "Призначено"
        COMMENT = "comment", "Коментар"
        REVIEW = "review", "Запит на ревʼю"
        FAIL = "fail", "Невдалий тест"
        CLOSED = "closed", "Закрито"
        OTHER = "other", "Інше"

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    # Хто ініціював подію (автор коментаря, той, хто призначив тощо). Може бути null
    # для системних подій (наприклад, провал тесту).
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="actor_notifications",
    )
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True
    )
    kind = models.CharField(
        max_length=16, choices=Kind.choices, default=Kind.OTHER, db_index=True
    )
    message = models.CharField(max_length=500)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["user", "kind"]),
        ]

    def __str__(self) -> str:
        return f"Сповіщення для {self.user}: {self.message[:50]}"


class StarredIssue(models.Model):
    """Обрані / зірковані задачі користувача."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="starred_issues"
    )
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="starred_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "issue")

    def __str__(self) -> str:
        return f"{self.user} starred {self.issue_id}"


class CommentReaction(models.Model):
    """Реакція на коментар (емодзі)."""

    REACTION_CHOICES = [
        ("👍", "Подобається"),
        ("❤️", "Серце"),
        ("🚀", "Ракета"),
        ("🎉", "Святкування"),
        ("😄", "Сміх"),
        ("👀", "Очі"),
    ]

    comment = models.ForeignKey(
        Comment, on_delete=models.CASCADE, related_name="reactions"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="reactions"
    )
    emoji = models.CharField(max_length=10, choices=REACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("comment", "user", "emoji")
        indexes = [
            models.Index(fields=["comment", "emoji"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} {self.emoji} on comment {self.comment_id}"


class EmailToken(models.Model):
    """Токен для підтвердження email або скидання пароля."""

    class Purpose(models.TextChoices):
        CONFIRM_EMAIL = "confirm_email", "Підтвердження пошти"
        RESET_PASSWORD = "reset_password", "Скидання пароля"

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="email_tokens"
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "purpose"]),
        ]

    def is_valid(self) -> bool:
        """Токен валідний, якщо ще не використаний і не протермінований."""
        from django.utils import timezone

        return self.used_at is None and self.expires_at > timezone.now()

    def __str__(self) -> str:
        return f"{self.purpose} for {self.user} (used: {bool(self.used_at)})"


class UserProfile(models.Model):
    """
    Розширення моделі User. Тримаємо окремо, щоб не міняти AUTH_USER_MODEL
    (це ризиковано після старту проєкту).
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )
    email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    # 2FA — секрет TOTP (base32). Якщо None — 2FA вимкнено.
    totp_secret = models.CharField(max_length=64, blank=True, default="")
    totp_enabled = models.BooleanField(default=False)
    # Onboarding — чи пройшов початковий тур
    onboarding_done = models.BooleanField(default=False)
    # Аватарка користувача (необовʼязкова — fallback на ініціали)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    def __str__(self) -> str:
        return f"Profile of {self.user}"


# ============================================================================
# Sprint / Iteration
# ============================================================================


class Sprint(models.Model):
    """Спринт — обмежений у часі обсяг роботи в проєкті."""

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="sprints")
    name = models.CharField(max_length=120)
    goal = models.TextField(blank=True)
    starts_at = models.DateField()
    ends_at = models.DateField()
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-starts_at"]
        indexes = [
            models.Index(fields=["project", "-starts_at"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.project.name} · {self.name}"


# ============================================================================
# Issue Templates — пресети для нових задач
# ============================================================================


class IssueTemplate(models.Model):
    """Шаблон задачі: 'Bug report', 'Feature request' тощо."""

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="issue_templates",
        null=True,
        blank=True,
        help_text="Якщо null — глобальний шаблон, доступний у всіх проєктах",
    )
    name = models.CharField(max_length=120)
    description_template = models.TextField(
        help_text="Markdown-шаблон для опису задачі (наприклад з кроками репро)"
    )
    default_priority = models.CharField(
        max_length=20,
        choices=Issue.Priority.choices,
        default=Issue.Priority.MEDIUM,
    )
    default_labels = models.ManyToManyField(Label, blank=True, related_name="templates")
    custom_fields_schema = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "Список полів зі схемою [{name, label, type: text|number|select, options?}]"
        ),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


# ============================================================================
# Time tracking
# ============================================================================


class TimeLog(models.Model):
    """Запис часу, витраченого користувачем на задачу."""

    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="time_logs", db_index=True
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="time_logs")
    minutes = models.PositiveIntegerField()
    # TextField без max_length — нотатки до часу можуть бути довгі
    note = models.TextField(blank=True)
    logged_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-logged_at"]
        indexes = [
            models.Index(fields=["issue", "-logged_at"]),
            models.Index(fields=["user", "-logged_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user} · {self.minutes}m on issue {self.issue_id}"


# ============================================================================
# Saved filters
# ============================================================================


class SavedFilter(models.Model):
    """Збережений фільтр / smart view для задач."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="saved_filters"
    )
    name = models.CharField(max_length=120)
    # Query parameters as dict, e.g. {"status": "open", "assignee": "me"}
    params = models.JSONField(default=dict)
    is_pinned = models.BooleanField(default=False)
    icon = models.CharField(max_length=32, blank=True, default="Filter")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_pinned", "name"]

    def __str__(self) -> str:
        return f"{self.user} · {self.name}"


# ============================================================================
# Test management
# ============================================================================


class TestSuite(models.Model):
    """Колекція тест-кейсів за функціональністю (auth, billing, ...)."""

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="test_suites"
    )
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.project.name} · {self.name}"


class TestCase(models.Model):
    """Тест-кейс — сценарій, що перевіряє конкретний шматок функціоналу."""

    class Type(models.TextChoices):
        MANUAL = "manual", "Manual"
        AUTOMATED = "automated", "Automated"

    class Priority(models.TextChoices):
        CRITICAL = "critical", "Critical"
        HIGH = "high", "High"
        MEDIUM = "medium", "Medium"
        LOW = "low", "Low"

    suite = models.ForeignKey(
        TestSuite, on_delete=models.CASCADE, related_name="test_cases"
    )
    title = models.CharField(max_length=255, db_index=True)
    preconditions = models.TextField(blank=True)
    # Steps зберігаємо як JSON-масив [{step, expected}]
    steps = models.JSONField(default=list, blank=True)
    expected_result = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.MANUAL)
    priority = models.CharField(
        max_length=20, choices=Priority.choices, default=Priority.MEDIUM
    )
    automation_link = models.URLField(blank=True, help_text="URL до Playwright/Cypress тесту")
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_test_cases"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["suite", "-created_at"]),
            models.Index(fields=["type"]),
        ]

    def __str__(self) -> str:
        return self.title


class TestRun(models.Model):
    """Запуск підмножини тест-кейсів."""

    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        ABORTED = "aborted", "Aborted"

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="test_runs"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    environment = models.CharField(max_length=80, blank=True, help_text="Production / Staging / ...")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    test_cases = models.ManyToManyField(
        TestCase, related_name="test_runs", blank=True
    )
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_test_runs"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.project.name} · {self.name}"


class TestResult(models.Model):
    """Результат виконання конкретного тест-кейсу в run'і."""

    class Result(models.TextChoices):
        PASS = "pass", "Pass"
        FAIL = "fail", "Fail"
        BLOCKED = "blocked", "Blocked"
        SKIP = "skip", "Skip"
        PENDING = "pending", "Pending"

    run = models.ForeignKey(
        TestRun, on_delete=models.CASCADE, related_name="results", db_index=True
    )
    test_case = models.ForeignKey(
        TestCase, on_delete=models.CASCADE, related_name="results"
    )
    result = models.CharField(
        max_length=20, choices=Result.choices, default=Result.PENDING, db_index=True
    )
    note = models.TextField(blank=True)
    # Snapshot даних кейса на момент створення run-результату.
    # Дозволяє детектити drift після редагування TestCase і пропонувати
    # оновити run з кейса або кейс з ран'у.
    case_title_snapshot = models.CharField(max_length=255, blank=True)
    case_steps_snapshot = models.JSONField(default=list, blank=True)
    case_preconditions_snapshot = models.TextField(blank=True)
    related_issue = models.ForeignKey(
        Issue,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="test_failures",
        help_text="Якщо fail — пов'язаний баг",
    )
    executed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="test_executions"
    )
    executed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("run", "test_case")
        indexes = [
            models.Index(fields=["run", "result"]),
        ]

    def __str__(self) -> str:
        return f"{self.test_case.title}: {self.result}"


# ============================================================================
# API Tokens, Login Events, Webhooks (security / integrations)
# ============================================================================


class ApiToken(models.Model):
    """Persistent API token для скриптів і CI/CD."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="api_tokens")
    name = models.CharField(max_length=80, help_text="Описова назва (CI deploy, my-script)")
    key = models.CharField(max_length=64, unique=True, db_index=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user.username} · {self.name}"


class LoginEvent(models.Model):
    """Запис про вхід / спробу входу — для audit log."""

    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="login_events",
    )
    username_attempted = models.CharField(max_length=150, blank=True)
    success = models.BooleanField(default=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    method = models.CharField(
        max_length=20,
        default="password",
        help_text="password / oauth_google / oauth_github / token",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user or self.username_attempted} · {'OK' if self.success else 'FAIL'} · {self.created_at:%Y-%m-%d %H:%M}"


class Webhook(models.Model):
    """Outgoing webhook — для Slack / Discord / своїх систем."""

    EVENTS = [
        ("issue.created", "Issue created"),
        ("issue.updated", "Issue updated"),
        ("issue.closed", "Issue closed"),
        ("comment.created", "Comment created"),
        ("test_run.completed", "Test run completed"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="webhooks",
        null=True,
        blank=True,
        help_text="null — глобальний webhook на всі проєкти",
    )
    name = models.CharField(max_length=120)
    url = models.URLField()
    events = models.JSONField(default=list, help_text="Список eventів зі списку EVENTS")
    secret = models.CharField(
        max_length=128,
        blank=True,
        help_text="Опційний secret для HMAC-підпису payload",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_called_at = models.DateTimeField(null=True, blank=True)
    last_status_code = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class WebhookDelivery(models.Model):
    """Лог відправлень webhook — для дебагу і retry."""

    webhook = models.ForeignKey(
        Webhook, on_delete=models.CASCADE, related_name="deliveries", db_index=True
    )
    event = models.CharField(max_length=64)
    payload = models.JSONField(default=dict)
    status_code = models.IntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]


class IntegrationConfig(models.Model):
    """
    Конфігурація інтеграцій з GitHub / GitLab / Slack для проєкту.
    Один рядок на проєкт + тип інтеграції.
    """

    class Kind(models.TextChoices):
        GITHUB = "github", "GitHub"
        GITLAB = "gitlab", "GitLab"
        SLACK = "slack", "Slack"

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="integrations"
    )
    kind = models.CharField(max_length=20, choices=Kind.choices)
    # Налаштування у JSON: {repo: 'org/repo', token: '...', channel: '#qa'}
    config = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("project", "kind")


class RoadmapItem(models.Model):
    """Запис на дорожній карті продукту. Адмін додає/редагує; інші читають.

    Колонки за статусом (planned / in_progress / done / cancelled). Сортування
    у межах колонки — за sort_order, потім за створенням.
    """

    class Status(models.TextChoices):
        PLANNED = "planned", "Заплановано"
        IN_PROGRESS = "in_progress", "У роботі"
        DONE = "done", "Готово"
        CANCELLED = "cancelled", "Скасовано"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PLANNED, db_index=True
    )
    quarter = models.CharField(
        max_length=20, blank=True, help_text="Напр. Q3 2026"
    )
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]

    def __str__(self) -> str:
        return f"[{self.get_status_display()}] {self.title}"


class ChangelogReaction(models.Model):
    """Реакція користувача на запис Changelog (поки лише «корисно»).

    unique_together (entry, user, kind) робить кнопку ідемпотентною —
    повторний POST не множить лічильник, але endpoint штовхає toggle.
    """

    class Kind(models.TextChoices):
        HELPFUL = "helpful", "Корисно"

    entry = models.ForeignKey(
        "ChangelogEntry", on_delete=models.CASCADE, related_name="reactions"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.HELPFUL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("entry", "user", "kind")
        indexes = [models.Index(fields=["entry", "kind"])]


class ChangelogSubscription(models.Model):
    """Email-підписки на Changelog. При новому опублікованому записі
    через signal надсилається оновлення всім is_active=True підпискам."""

    email = models.EmailField(unique=True, db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email


class ChangelogEntry(models.Model):
    """Запис у Changelog продукту — версія, тег, перелік змін.

    Редагується через адмін-API лише staff-користувачами; читається всіма.
    """

    class Tag(models.TextChoices):
        MAJOR = "major", "Major"
        MINOR = "minor", "Minor"
        PATCH = "patch", "Patch"
        SECURITY = "security", "Security"

    version = models.CharField(max_length=50, help_text="Напр. 4.18.0")
    release_date = models.DateField()
    tag = models.CharField(max_length=20, choices=Tag.choices, default=Tag.MINOR)
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    # Список об'єктів {"type": "new"|"imp"|"fix"|"sec", "text": "..."}
    changes = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-release_date", "-id"]

    def __str__(self) -> str:
        return f"v{self.version} · {self.title}"

