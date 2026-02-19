from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()


class Project(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="owned_projects"
    )
    members = models.ManyToManyField(User, related_name="projects", blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "-created_at"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self) -> str:
        return self.name


class Label(models.Model):
    name = models.CharField(max_length=64, unique=True)
    color = models.CharField(max_length=7, default="#3b82f6")  # HEX

    def __str__(self) -> str:
        return self.name


class Issue(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "В работе"
        IN_PROGRESS = "in_progress", "В процессе"
        DONE = "done", "Готово"
        CANCELLED = "cancelled", "Отменено"

    class Priority(models.TextChoices):
        LOW = "low", "Низкий"
        MEDIUM = "medium", "Средний"
        HIGH = "high", "Высокий"

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
        return f"Комментарий к {self.issue_id} от {self.author_id}"


class Attachment(models.Model):
    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="attachments"
    )
    file = models.FileField(upload_to="attachments/%Y/%m/%d/")
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
        return self.name or f"Attachment #{self.pk}"


class ProjectMembership(models.Model):
    class Role(models.TextChoices):
        VIEWER = "viewer", "Наблюдатель"
        MEMBER = "member", "Участник"
        MANAGER = "manager", "Менеджер"
        OWNER = "owner", "Владелец"

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
        return f"Invite {self.email} to {self.project} ({self.role})"


class IssueActivity(models.Model):
    """Audit log for issue changes."""

    issue = models.ForeignKey(
        Issue, on_delete=models.CASCADE, related_name="activities"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activities")
    action = models.CharField(max_length=50)  # e.g. "status_changed", "assigned", "comment_added"
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
    """Relationships between issues."""

    class RelationType(models.TextChoices):
        BLOCKS = "blocks", "Blocks"
        BLOCKED_BY = "blocked_by", "Blocked by"
        RELATES_TO = "relates_to", "Relates to"
        DUPLICATE_OF = "duplicate_of", "Duplicate of"

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

    def __str__(self) -> str:
        return f"{self.from_issue_id} {self.relation_type} {self.to_issue_id}"


class ChecklistItem(models.Model):
    """Subtask / checklist item within an issue."""

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
    """User notification."""

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
        return f"Notification for {self.user}: {self.message[:50]}"


class StarredIssue(models.Model):
    """User's starred/favorite issues."""

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
