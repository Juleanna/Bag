"""Серіалізатори для адмін-панелі лендінгу."""

from rest_framework import serializers

from .models import (
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    LandingChangeLog,
    LandingFaqItem,
    LandingFeature,
    LandingHero,
    LandingIntegration,
    LandingMetric,
    LandingSettings,
    LandingTestimonial,
    LandingUseCase,
    trans,
)


class TranslatableTextSerializerField(serializers.Field):
    """
    Серіалізатор для TranslatableField.

    - Public режим (lang передано): на вихід ВІДДАЄ простий рядок (зручно для
      фронту лендінгу), на вхід приймає або dict, або рядок (тоді оновлює
      DEFAULT_LANGUAGE, не зачіпаючи інші мови).
    - Admin режим (lang=None): на вихід ВІДДАЄ повний dict з усіма мовами,
      приймає dict.

    Mode керується через context['lang'] серіалізатора.
    """

    def to_representation(self, value):
        lang = self.context.get("lang") if self.context else None
        if not isinstance(value, dict):
            value = {DEFAULT_LANGUAGE: str(value or ""), "en": ""}
        if lang:
            return trans(value, lang)
        # Гарантуємо що всі підтримувані мови присутні
        out = dict(value)
        for k in SUPPORTED_LANGUAGES:
            out.setdefault(k, "")
        return out

    def to_internal_value(self, data):
        if isinstance(data, str):
            # Адмінка зазвичай надсилає dict; якщо рядок — мерджимо в DEFAULT
            return {DEFAULT_LANGUAGE: data}
        if isinstance(data, dict):
            # Залишаємо лише підтримувані мови
            return {k: str(v or "") for k, v in data.items() if k in SUPPORTED_LANGUAGES}
        raise serializers.ValidationError(
            "TranslatableField має бути dict {uk: ..., en: ...} або string"
        )


# ============================================================================
# Singletons
# ============================================================================


class LandingHeroSerializer(serializers.ModelSerializer):
    eyebrow_text = TranslatableTextSerializerField()
    title_a = TranslatableTextSerializerField()
    title_accent = TranslatableTextSerializerField()
    title_b = TranslatableTextSerializerField()
    lede = TranslatableTextSerializerField()
    primary_cta_text = TranslatableTextSerializerField()
    secondary_cta_text = TranslatableTextSerializerField()
    foot_text_1 = TranslatableTextSerializerField()
    foot_text_2 = TranslatableTextSerializerField()
    foot_text_3 = TranslatableTextSerializerField()
    has_draft = serializers.SerializerMethodField()

    class Meta:
        model = LandingHero
        exclude = ("id",)
        read_only_fields = ("updated_at",)

    def get_has_draft(self, obj):
        return obj.has_draft()


class LandingSettingsSerializer(serializers.ModelSerializer):
    features_kicker = TranslatableTextSerializerField()
    features_title = TranslatableTextSerializerField()
    features_subtitle = TranslatableTextSerializerField()
    use_cases_kicker = TranslatableTextSerializerField()
    use_cases_title = TranslatableTextSerializerField()
    use_cases_subtitle = TranslatableTextSerializerField()
    integrations_kicker = TranslatableTextSerializerField()
    integrations_title = TranslatableTextSerializerField()
    integrations_subtitle = TranslatableTextSerializerField()
    testimonials_kicker = TranslatableTextSerializerField()
    testimonials_title = TranslatableTextSerializerField()
    faq_kicker = TranslatableTextSerializerField()
    faq_title = TranslatableTextSerializerField()
    cta_title = TranslatableTextSerializerField()
    cta_subtitle = TranslatableTextSerializerField()
    cta_primary_text = TranslatableTextSerializerField()
    cta_secondary_text = TranslatableTextSerializerField()
    footer_brand_text = TranslatableTextSerializerField()
    footer_copyright = TranslatableTextSerializerField()
    has_draft = serializers.SerializerMethodField()

    class Meta:
        model = LandingSettings
        exclude = ("id",)
        read_only_fields = ("updated_at",)

    def get_has_draft(self, obj):
        return obj.has_draft()


# ============================================================================
# Items
# ============================================================================


class LandingFeatureSerializer(serializers.ModelSerializer):
    title = TranslatableTextSerializerField()
    description = TranslatableTextSerializerField()

    class Meta:
        model = LandingFeature
        fields = "__all__"


class LandingUseCaseSerializer(serializers.ModelSerializer):
    title = TranslatableTextSerializerField()
    description = TranslatableTextSerializerField()
    bullets = TranslatableTextSerializerField()
    bullets_list = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LandingUseCase
        fields = "__all__"

    def get_bullets_list(self, obj: LandingUseCase) -> list[str]:
        lang = self.context.get("lang") if self.context else None
        text = trans(obj.bullets, lang or "uk") if lang else trans(obj.bullets)
        return [line.strip() for line in (text or "").splitlines() if line.strip()]


class LandingIntegrationSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LandingIntegration
        fields = "__all__"
        extra_kwargs = {"logo": {"required": False, "allow_null": True}}

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get("request") if self.context else None
        url = obj.logo.url
        return request.build_absolute_uri(url) if request else url


class LandingMetricSerializer(serializers.ModelSerializer):
    label = TranslatableTextSerializerField()

    class Meta:
        model = LandingMetric
        fields = "__all__"


class LandingTestimonialSerializer(serializers.ModelSerializer):
    quote = TranslatableTextSerializerField()
    author_role = TranslatableTextSerializerField()

    class Meta:
        model = LandingTestimonial
        fields = "__all__"


class LandingFaqItemSerializer(serializers.ModelSerializer):
    question = TranslatableTextSerializerField()
    answer = TranslatableTextSerializerField()

    class Meta:
        model = LandingFaqItem
        fields = "__all__"


# ============================================================================
# Public aggregated
# ============================================================================


class LandingPublicSerializer(serializers.Serializer):
    hero = LandingHeroSerializer(read_only=True)
    settings = LandingSettingsSerializer(read_only=True)
    features = LandingFeatureSerializer(many=True, read_only=True)
    use_cases = LandingUseCaseSerializer(many=True, read_only=True)
    integrations = LandingIntegrationSerializer(many=True, read_only=True)
    metrics = LandingMetricSerializer(many=True, read_only=True)
    testimonials = LandingTestimonialSerializer(many=True, read_only=True)
    faq = LandingFaqItemSerializer(many=True, read_only=True)


# ============================================================================
# Change log
# ============================================================================


class LandingChangeLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = LandingChangeLog
        fields = (
            "id",
            "model_name",
            "object_id",
            "object_label",
            "action",
            "user",
            "user_name",
            "timestamp",
            "data_snapshot",
        )

    def get_user_name(self, obj):
        return obj.user.username if obj.user else None
