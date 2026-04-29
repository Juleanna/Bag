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


class Project(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
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

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="issues", db_index=True
    )
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True
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
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["assignee", "status"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["priority", "-created_at"]),
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

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True
    )
    message = models.CharField(max_length=500)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "is_read"]),
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

    def __str__(self) -> str:
        return f"Profile of {self.user}"
