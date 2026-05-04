"""
Моделі для адміністрування лендінгу головної сторінки.

Архітектура:
- Items (Feature/UseCase/Integration/Metric/Testimonial/FAQ) мають is_published
  — рядки лишаються в БД, але не показуються публічно, поки не опубліковані.
- Singletons (Hero, Settings) мають JSONField `draft_data` з накопиченими, але
  неопублікованими змінами; при публікації draft_data перетікає у live-поля.
- Усі текстові поля — TranslatableField (dict {uk, en}), доступні через
  helper `trans(value, lang)`.
- LandingChangeLog — universal audit log для всіх моделей.
"""

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import FileExtensionValidator
from django.db import models


# ============================================================================
# Translatable text — dict {uk, en}
# ============================================================================

SUPPORTED_LANGUAGES = ["uk", "en"]
DEFAULT_LANGUAGE = "uk"


def empty_translation():
    """Дефолт для TranslatableField — порожні рядки в усіх мовах."""
    return {lang: "" for lang in SUPPORTED_LANGUAGES}


class TranslatableField(models.JSONField):
    """
    JSONField з структурою {'uk': '...', 'en': '...'}.

    На відміну від звичайного JSONField, гарантує що дефолт — словник з
    усіма підтримуваними мовами. У серіалізаторі трансформується у звичайний
    рядок при ?lang=xx; при PATCH — приймає або dict, або рядок (тоді
    оновлюється DEFAULT_LANGUAGE).
    """

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("default", empty_translation)
        kwargs.setdefault("blank", True)
        super().__init__(*args, **kwargs)


def trans(value, lang: str = DEFAULT_LANGUAGE) -> str:
    """
    Витягує переклад з dict {lang: text}.
    Якщо для запитаної мови порожньо — fallback на DEFAULT_LANGUAGE.
    Якщо value — звичайний рядок (legacy / не translatable) — повертає його.
    """
    if isinstance(value, str):
        return value
    if not isinstance(value, dict):
        return ""
    text = value.get(lang) or value.get(DEFAULT_LANGUAGE) or ""
    if not text:
        for v in value.values():
            if v:
                return v
    return text


# ============================================================================
# Іконки / кольори (whitelist)
# ============================================================================

ICON_CHOICES = [
    ("Bug", "🐛 Bug"),
    ("Beaker", "🧪 Beaker"),
    ("Play", "▶ Play"),
    ("Layout", "▦ Layout"),
    ("Chart", "📊 Chart"),
    ("Comment", "💬 Comment"),
    ("Bell", "🔔 Bell"),
    ("Lightning", "⚡ Lightning"),
    ("AI", "✨ AI"),
    ("User", "👤 User"),
    ("Users", "👥 Users"),
    ("Github", "Github"),
    ("Slack", "Slack"),
    ("Spark", "✦ Spark"),
    ("Star", "★ Star"),
    ("Globe", "🌐 Globe"),
    ("Refresh", "↻ Refresh"),
    ("Settings", "⚙ Settings"),
    ("Lock", "🔒 Lock"),
    ("Activity", "📈 Activity"),
]

COLOR_VARIANT_CHOICES = [
    ("accent", "Акцент (фіолетовий)"),
    ("resolved", "Зелений"),
    ("progress", "Жовтий"),
    ("blocked", "Пурпуровий"),
    ("open", "Червоний"),
    ("closed", "Сірий"),
]


# ============================================================================
# Singleton base
# ============================================================================


class SingletonModel(models.Model):
    """Базовий клас для моделей-синглтонів (Hero, Settings)."""

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Заборона видалення синглтона
        pass

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


# ============================================================================
# Hero — singleton
# ============================================================================


class LandingHero(SingletonModel):
    """Головний hero-блок лендінгу."""

    eyebrow_badge = models.CharField(max_length=32, default="NEW")
    eyebrow_text = TranslatableField()
    eyebrow_version = models.CharField(max_length=32, blank=True, default="v2.0")

    title_a = TranslatableField()
    title_accent = TranslatableField()
    title_b = TranslatableField()
    lede = TranslatableField()

    primary_cta_text = TranslatableField()
    primary_cta_link = models.CharField(max_length=128, default="/register")
    secondary_cta_text = TranslatableField()
    secondary_cta_link = models.CharField(max_length=128, default="/login")

    foot_text_1 = TranslatableField()
    foot_text_2 = TranslatableField()
    foot_text_3 = TranslatableField()

    # Накопичені, але ще не опубліковані зміни. Структура — те ж саме як live,
    # але як вкладений dict {field: value}. Якщо None — drafts немає.
    draft_data = models.JSONField(blank=True, null=True, default=None)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hero блок"
        verbose_name_plural = "Hero блок"

    def __str__(self):
        return f"Hero: {trans(self.title_a)} {trans(self.title_accent)}"

    def has_draft(self) -> bool:
        return bool(self.draft_data)

    def publish_draft(self):
        """Переливає draft_data в live-поля."""
        if not self.draft_data:
            return
        for field, value in self.draft_data.items():
            if hasattr(self, field):
                setattr(self, field, value)
        self.draft_data = None
        self.save()

    def discard_draft(self):
        self.draft_data = None
        self.save(update_fields=["draft_data", "updated_at"])


# ============================================================================
# Items
# ============================================================================


class _PublishableItem(models.Model):
    """Базовий клас для items: position + is_visible + is_published."""

    position = models.PositiveIntegerField(default=0, db_index=True)
    is_visible = models.BooleanField(default=True)
    # Чорновики: створені, але не опубліковані. Public API їх не показує.
    is_published = models.BooleanField(default=False, db_index=True)

    class Meta:
        abstract = True


class LandingFeature(_PublishableItem):
    """Картка в секції 'Можливості'."""

    title = TranslatableField()
    description = TranslatableField()
    icon = models.CharField(max_length=32, choices=ICON_CHOICES, default="Bug")
    color_variant = models.CharField(
        max_length=20, choices=COLOR_VARIANT_CHOICES, default="accent"
    )
    featured = models.BooleanField(default=False)

    class Meta:
        ordering = ["position"]
        verbose_name = "Можливість"
        verbose_name_plural = "Можливості"

    def __str__(self):
        return trans(self.title)


class LandingUseCase(_PublishableItem):
    """Картка в секції 'Для кого'."""

    title = TranslatableField()
    description = TranslatableField()
    icon = models.CharField(max_length=32, choices=ICON_CHOICES, default="User")
    color_variant = models.CharField(
        max_length=20, choices=COLOR_VARIANT_CHOICES, default="accent"
    )
    # bullets теж перекладні: dict {uk: "...\n...", en: "...\n..."}
    bullets = TranslatableField()

    class Meta:
        ordering = ["position"]
        verbose_name = "Use Case"
        verbose_name_plural = "Use Cases"

    def __str__(self):
        return trans(self.title)


class LandingIntegration(_PublishableItem):
    """Тайл-логотип у секції 'Інтеграції'."""

    name = models.CharField(max_length=64)
    mark = models.CharField(max_length=4, default="??")
    color = models.CharField(max_length=7, default="#5E6AD2")
    # Опційний логотип, якщо є — використовуємо замість mark/color
    logo = models.ImageField(
        upload_to="landing/integrations/",
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=["png", "jpg", "jpeg", "svg", "webp"]),
        ],
    )

    class Meta:
        ordering = ["position"]
        verbose_name = "Інтеграція"
        verbose_name_plural = "Інтеграції"

    def __str__(self):
        return self.name


class LandingMetric(_PublishableItem):
    """Велике число в секції 'Метрики'."""

    value = models.CharField(max_length=32)
    label = TranslatableField()

    class Meta:
        ordering = ["position"]
        verbose_name = "Метрика"
        verbose_name_plural = "Метрики"

    def __str__(self):
        return f"{self.value} — {trans(self.label)}"


class LandingTestimonial(_PublishableItem):
    """Відгук у секції 'Що кажуть команди'."""

    quote = TranslatableField()
    author_name = models.CharField(max_length=80)
    author_role = TranslatableField()
    avatar_initials = models.CharField(max_length=4, default="??")
    avatar_color = models.CharField(max_length=7, default="#5E6AD2")
    featured = models.BooleanField(default=False)

    class Meta:
        ordering = ["position"]
        verbose_name = "Відгук"
        verbose_name_plural = "Відгуки"

    def __str__(self):
        return f"{self.author_name}: {trans(self.quote)[:50]}"


class LandingFaqItem(_PublishableItem):
    """Питання-відповідь у секції FAQ."""

    question = TranslatableField()
    answer = TranslatableField()

    class Meta:
        ordering = ["position"]
        verbose_name = "FAQ"
        verbose_name_plural = "FAQ"

    def __str__(self):
        return trans(self.question)


# ============================================================================
# Settings — singleton
# ============================================================================


class LandingSettings(SingletonModel):
    """Глобальні налаштування лендінгу."""

    show_features = models.BooleanField(default=True)
    show_use_cases = models.BooleanField(default=True)
    show_metrics = models.BooleanField(default=True)
    show_integrations = models.BooleanField(default=True)
    show_testimonials = models.BooleanField(default=True)
    show_faq = models.BooleanField(default=True)
    show_cta_strip = models.BooleanField(default=True)

    features_kicker = TranslatableField()
    features_title = TranslatableField()
    features_subtitle = TranslatableField()

    use_cases_kicker = TranslatableField()
    use_cases_title = TranslatableField()
    use_cases_subtitle = TranslatableField()

    integrations_kicker = TranslatableField()
    integrations_title = TranslatableField()
    integrations_subtitle = TranslatableField()

    testimonials_kicker = TranslatableField()
    testimonials_title = TranslatableField()

    faq_kicker = TranslatableField()
    faq_title = TranslatableField()

    cta_title = TranslatableField()
    cta_subtitle = TranslatableField()
    cta_primary_text = TranslatableField()
    cta_primary_link = models.CharField(max_length=128, default="/register")
    cta_secondary_text = TranslatableField()
    cta_secondary_link = models.CharField(max_length=128, default="/login")

    footer_brand_text = TranslatableField()
    footer_copyright = TranslatableField()

    draft_data = models.JSONField(blank=True, null=True, default=None)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Налаштування лендінгу"
        verbose_name_plural = "Налаштування лендінгу"

    def __str__(self):
        return "Налаштування лендінгу"

    def has_draft(self) -> bool:
        return bool(self.draft_data)

    def publish_draft(self):
        if not self.draft_data:
            return
        for field, value in self.draft_data.items():
            if hasattr(self, field):
                setattr(self, field, value)
        self.draft_data = None
        self.save()

    def discard_draft(self):
        self.draft_data = None
        self.save(update_fields=["draft_data", "updated_at"])


# ============================================================================
# Журнал змін (audit log)
# ============================================================================


class LandingChangeLog(models.Model):
    """
    Universal audit log для лендінгу. Прив'язується до будь-якої моделі через
    ContentType + object_id.

    Зберігає `data_snapshot` — повний знімок стану об'єкта на момент дії
    (для перегляду / відкату).
    """

    class Action(models.TextChoices):
        CREATED = "created", "Створено"
        UPDATED = "updated", "Оновлено"
        DELETED = "deleted", "Видалено"
        PUBLISHED = "published", "Опубліковано"
        UNPUBLISHED = "unpublished", "Знято з публікації"
        PUBLISHED_DRAFT = "published_draft", "Чорновик опубліковано"
        DRAFT_DISCARDED = "draft_discarded", "Чорновик скасовано"

    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    target = GenericForeignKey("content_type", "object_id")

    # Дублюємо ім'я моделі для зручної фільтрації, навіть якщо об'єкт видалено
    model_name = models.CharField(max_length=64)
    object_label = models.CharField(max_length=200, blank=True)

    action = models.CharField(max_length=20, choices=Action.choices)
    user = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    # Знімок полів об'єкта (model_to_dict). За потреби можна додати diff.
    data_snapshot = models.JSONField(blank=True, null=True, default=None)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["model_name", "-timestamp"]),
            models.Index(fields=["content_type", "object_id", "-timestamp"]),
        ]
        verbose_name = "Запис журналу"
        verbose_name_plural = "Журнал змін"

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.action} {self.model_name}#{self.object_id}"
