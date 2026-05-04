"""
Дата-міграція 0004: заповнює лендінг дефолтним контентом українською (англ.
лишається порожній — заповнюється через адмін-панель).
Усі items створюються з is_published=True (вони — частина live-стану).
"""

from django.db import migrations


def _t(uk: str) -> dict:
    return {"uk": uk, "en": ""}


HERO_FIELDS = {
    "eyebrow_badge": "NEW",
    "eyebrow_text": _t("AI-резюме багів"),
    "eyebrow_version": "v2.0",
    "title_a": _t("Баг-трекер,"),
    "title_accent": _t("що ловить дефекти"),
    "title_b": _t("до того, як їх побачить юзер."),
    "lede": _t(
        "BugTracker об'єднує задачі, коментарі та сповіщення у єдиному робочому "
        "просторі. Без зайвого, без чату-смітника, без втрати контексту."
    ),
    "primary_cta_text": _t("Почати безкоштовно"),
    "primary_cta_link": "/register",
    "secondary_cta_text": _t("Подивитися застосунок"),
    "secondary_cta_link": "/login",
    "foot_text_1": _t("Безкоштовно для невеликих команд"),
    "foot_text_2": _t("Без картки"),
    "foot_text_3": _t("SOC 2 · GDPR"),
}

SETTINGS_FIELDS = {
    "show_features": True,
    "show_use_cases": True,
    "show_metrics": True,
    "show_integrations": True,
    "show_testimonials": True,
    "show_faq": True,
    "show_cta_strip": True,
    "features_kicker": _t("Можливості"),
    "features_title": _t("Усе, що треба команді — і нічого зайвого"),
    "features_subtitle": _t(
        "Фокус на трьох речах: фіксація задач, керування коментарями та сповіщеннями. "
        "Без overhead'у Jira і без хаосу Trello."
    ),
    "use_cases_kicker": _t("Для кого"),
    "use_cases_title": _t("Підходить вашій ролі"),
    "use_cases_subtitle": _t(
        "BugTracker приходить у команду без революцій — і одразу прибирає "
        "три-чотири інші вкладки з браузера."
    ),
    "integrations_kicker": _t("Інтеграції"),
    "integrations_title": _t("Підключається до того, що вже є"),
    "integrations_subtitle": _t(
        "30+ інтеграцій з SCM, чатами, CI/CD та observability. "
        "REST API і webhooks — для всього іншого."
    ),
    "testimonials_kicker": _t("Відгуки"),
    "testimonials_title": _t("Що кажуть команди"),
    "faq_kicker": _t("FAQ"),
    "faq_title": _t("Часті питання"),
    "cta_title": _t("Спробуйте BugTracker сьогодні"),
    "cta_subtitle": _t("Безкоштовно. Без картки. 5 хвилин на онбординг команди."),
    "cta_primary_text": _t("Створити акаунт"),
    "cta_primary_link": "/register",
    "cta_secondary_text": _t("Увійти"),
    "cta_secondary_link": "/login",
    "footer_brand_text": _t(
        "Баг-трекер з фокусом на швидкість, ясність та інтеграції з тим, "
        "що ваша команда вже використовує."
    ),
    "footer_copyright": _t("Зроблено в Україні 🇺🇦"),
}

FEATURES = [
    {
        "position": 0,
        "is_published": True,
        "is_visible": True,
        "title": _t("Структуровані задачі"),
        "description": _t(
            "Шаблон з кроками репро, очікуваним і фактичним результатом, "
            "скриншотами, середовищем."
        ),
        "icon": "Bug",
        "color_variant": "accent",
        "featured": True,
    },
    {
        "position": 1,
        "is_published": True,
        "is_visible": True,
        "title": _t("Коментарі та @mentions"),
        "description": _t(
            "Markdown-коментарі, реакції 👍❤️🚀, @mention сповіщення для учасників."
        ),
        "icon": "Comment",
        "color_variant": "resolved",
        "featured": False,
    },
    {
        "position": 2,
        "is_published": True,
        "is_visible": True,
        "title": _t("Realtime-сповіщення"),
        "description": _t("Server-Sent Events: миттєво, з fallback на polling."),
        "icon": "Bell",
        "color_variant": "progress",
        "featured": False,
    },
    {
        "position": 3,
        "is_published": True,
        "is_visible": True,
        "title": _t("Гарячі клавіші"),
        "description": _t("Cmd+K на пошук, C — нова задача, ⌘1-4 — навігація."),
        "icon": "Lightning",
        "color_variant": "accent",
        "featured": False,
    },
    {
        "position": 4,
        "is_published": True,
        "is_visible": True,
        "title": _t("Звіти, що відповідають на питання"),
        "description": _t("Вбудовані дашборди + експорт у CSV."),
        "icon": "Chart",
        "color_variant": "blocked",
        "featured": True,
    },
]

USE_CASES = [
    {
        "position": 0,
        "is_published": True,
        "is_visible": True,
        "title": _t("QA-інженерам"),
        "description": _t(
            "Швидко фіксувати, шукати дублікати, тримати задачі під контролем."
        ),
        "icon": "User",
        "color_variant": "accent",
        "bullets": _t(
            "Шаблон бага з валідацією\nЧек-листи для smoke-тестів\nRealtime сповіщення"
        ),
    },
    {
        "position": 1,
        "is_published": True,
        "is_visible": True,
        "title": _t("Розробникам"),
        "description": _t("Контекст без походів у Slack, коментарі поряд із кодом."),
        "icon": "Github",
        "color_variant": "resolved",
        "bullets": _t("Cmd+K на все\nMarkdown + code-блоки\nDrag-and-drop для вкладень"),
    },
    {
        "position": 2,
        "is_published": True,
        "is_visible": True,
        "title": _t("Тімлідам і PM"),
        "description": _t("Відповіді на «що блокує?» і «куди йдемо?»."),
        "icon": "Chart",
        "color_variant": "progress",
        "bullets": _t("Дашборд проєкту\nBulk-операції на задачах\nЕкспорт CSV"),
    },
]

INTEGRATIONS = [
    {"position": 0, "is_published": True, "is_visible": True, "name": "GitHub", "mark": "Gh", "color": "#1F1E1A"},
    {"position": 1, "is_published": True, "is_visible": True, "name": "GitLab", "mark": "Gl", "color": "#FC6D26"},
    {"position": 2, "is_published": True, "is_visible": True, "name": "Slack", "mark": "Sl", "color": "#4A154B"},
    {"position": 3, "is_published": True, "is_visible": True, "name": "Jira", "mark": "Ji", "color": "#0052CC"},
    {"position": 4, "is_published": True, "is_visible": True, "name": "Linear", "mark": "Ln", "color": "#5E6AD2"},
    {"position": 5, "is_published": True, "is_visible": True, "name": "Figma", "mark": "Fg", "color": "#A259FF"},
    {"position": 6, "is_published": True, "is_visible": True, "name": "Sentry", "mark": "Se", "color": "#362D59"},
    {"position": 7, "is_published": True, "is_visible": True, "name": "Datadog", "mark": "Dd", "color": "#632CA6"},
    {"position": 8, "is_published": True, "is_visible": True, "name": "Notion", "mark": "No", "color": "#1F1E1A"},
    {"position": 9, "is_published": True, "is_visible": True, "name": "Webhook", "mark": "Wh", "color": "#6E6C63"},
    {"position": 10, "is_published": True, "is_visible": True, "name": "Cypress", "mark": "Cy", "color": "#17202C"},
    {"position": 11, "is_published": True, "is_visible": True, "name": "Playwright", "mark": "Pw", "color": "#2EAD33"},
]

METRICS = [
    {"position": 0, "is_published": True, "is_visible": True, "value": "3.2×", "label": _t("швидше створення задачі")},
    {"position": 1, "is_published": True, "is_visible": True, "value": "−38%", "label": _t("MTTR за 90 днів")},
    {"position": 2, "is_published": True, "is_visible": True, "value": "12k+", "label": _t("задач у середньому")},
    {"position": 3, "is_published": True, "is_visible": True, "value": "99.98%", "label": _t("SLA uptime у 2025")},
]

TESTIMONIALS = [
    {
        "position": 0,
        "is_published": True,
        "is_visible": True,
        "quote": _t(
            "Ми викинули таблицю в Confluence та три плагіни до Jira. "
            "BugTracker просто роботу робить — і не плутається під ногами."
        ),
        "author_name": "Марія Коваленко",
        "author_role": _t("Head of QA, Voltway"),
        "avatar_initials": "МК",
        "avatar_color": "#5E6AD2",
        "featured": False,
    },
    {
        "position": 1,
        "is_published": True,
        "is_visible": True,
        "quote": _t(
            "Сповіщення в реалтаймі економлять команді 30+ хв на день. "
            "За квартал ми закрили на 41% більше тікетів — без додаткових людей."
        ),
        "author_name": "Олексій Перчик",
        "author_role": _t("QA Lead, Northwind"),
        "avatar_initials": "ОП",
        "avatar_color": "#9665C9",
        "featured": True,
    },
    {
        "position": 2,
        "is_published": True,
        "is_visible": True,
        "quote": _t(
            "Гарячі клавіші — справжні. Cmd+K, C, ⌘1-4. Команда перестала шукати, "
            "де «Створити» і просто пише."
        ),
        "author_name": "Анастасія Світла",
        "author_role": _t("Senior QA, Plinth"),
        "avatar_initials": "АС",
        "avatar_color": "#9665C9",
        "featured": False,
    },
]

FAQ = [
    {
        "position": 0,
        "is_published": True,
        "is_visible": True,
        "question": _t("Скільки коштує?"),
        "answer": _t("Безкоштовно для команд до 5 людей. Pro — за договором."),
    },
    {
        "position": 1,
        "is_published": True,
        "is_visible": True,
        "question": _t("Чи можна імпортувати з Jira / TestRail?"),
        "answer": _t("Поки що — через REST API. Майстер імпорту в розробці."),
    },
    {
        "position": 2,
        "is_published": True,
        "is_visible": True,
        "question": _t("Чи є on-prem версія?"),
        "answer": _t("Так. Self-hosted (Docker + PostgreSQL) — без доплат."),
    },
    {
        "position": 3,
        "is_published": True,
        "is_visible": True,
        "question": _t("Що з безпекою?"),
        "answer": _t(
            "CSRF + сесійна автентифікація, HSTS, secure cookies, rate-limiting."
        ),
    },
    {
        "position": 4,
        "is_published": True,
        "is_visible": True,
        "question": _t("Чи є API?"),
        "answer": _t(
            "REST API через DRF. Swagger UI на /api/docs/ для адміністраторів."
        ),
    },
    {
        "position": 5,
        "is_published": True,
        "is_visible": True,
        "question": _t("Як влаштована підтримка?"),
        "answer": _t("GitHub Issues + email. Pro-план — приватний канал з SLA 24 год."),
    },
]


def seed_forward(apps, schema_editor):
    Hero = apps.get_model("landing", "LandingHero")
    Settings = apps.get_model("landing", "LandingSettings")
    Feature = apps.get_model("landing", "LandingFeature")
    UseCase = apps.get_model("landing", "LandingUseCase")
    Integration = apps.get_model("landing", "LandingIntegration")
    Metric = apps.get_model("landing", "LandingMetric")
    Testimonial = apps.get_model("landing", "LandingTestimonial")
    Faq = apps.get_model("landing", "LandingFaqItem")

    if not Hero.objects.filter(pk=1).exists():
        Hero.objects.create(pk=1, **HERO_FIELDS)
    if not Settings.objects.filter(pk=1).exists():
        Settings.objects.create(pk=1, **SETTINGS_FIELDS)

    if not Feature.objects.exists():
        Feature.objects.bulk_create([Feature(**f) for f in FEATURES])
    if not UseCase.objects.exists():
        UseCase.objects.bulk_create([UseCase(**u) for u in USE_CASES])
    if not Integration.objects.exists():
        Integration.objects.bulk_create([Integration(**i) for i in INTEGRATIONS])
    if not Metric.objects.exists():
        Metric.objects.bulk_create([Metric(**m) for m in METRICS])
    if not Testimonial.objects.exists():
        Testimonial.objects.bulk_create([Testimonial(**t) for t in TESTIMONIALS])
    if not Faq.objects.exists():
        Faq.objects.bulk_create([Faq(**q) for q in FAQ])


def seed_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("landing", "0003_landingfaqitem_is_published_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_forward, seed_reverse),
    ]
