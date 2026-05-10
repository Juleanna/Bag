"""
Project templates — preset наборів TestSuite/TestCase для нових проєктів.

Шаблони:
  - blank: нічого не створюємо
  - web:    Smoke / Regression / Cross-browser  (24 кейси, 3 suite)
  - mobile: Smoke / Crash detection / Offline   (~18 кейсів)
  - api:    Contract / Load / Security          (~15 кейсів)
  - import: з JIRA / Linear — поки що заглушка

Кожен шаблон — список suite-описів, кожен suite має список TestCase.
"""

WEB_TEMPLATE = [
    {
        "name": "Smoke",
        "description": "Базові сценарії — мають проходити при кожній зміні",
        "cases": [
            {"title": "Головна сторінка відкривається без помилок", "priority": "critical"},
            {"title": "Користувач може зареєструватися", "priority": "high"},
            {"title": "Користувач може увійти у акаунт", "priority": "critical"},
            {"title": "Користувач може вийти з акаунту", "priority": "high"},
            {"title": "Меню навігації працює коректно", "priority": "high"},
            {"title": "Search показує релевантні результати", "priority": "medium"},
            {"title": "Пагінація працює на списках", "priority": "medium"},
            {"title": "Пошта надсилається після підтвердження", "priority": "high"},
        ],
    },
    {
        "name": "Regression",
        "description": "Перевірки після кожного релізу — щоб уникнути регресій",
        "cases": [
            {"title": "Створення/редагування/видалення сутності", "priority": "high"},
            {"title": "Завантаження файлів обмежене 25 MB", "priority": "medium"},
            {"title": "Сесія закінчується через 30 днів", "priority": "medium"},
            {"title": "Email-сповіщення приходять у real-time", "priority": "medium"},
            {"title": "Скидання пароля через лист", "priority": "high"},
            {"title": "Зміна email вимагає підтвердження", "priority": "high"},
            {"title": "Експорт CSV містить усі поля", "priority": "low"},
            {"title": "Сортування таблиць зберігається у URL", "priority": "low"},
        ],
    },
    {
        "name": "Cross-browser",
        "description": "Перевірка коректної роботи у різних браузерах",
        "cases": [
            {"title": "Chrome 120+ — повна підтримка", "priority": "high"},
            {"title": "Safari 17+ — повна підтримка", "priority": "high"},
            {"title": "Firefox 121+ — повна підтримка", "priority": "high"},
            {"title": "Edge 120+ — повна підтримка", "priority": "medium"},
            {"title": "Mobile Safari (iOS 17) — responsive", "priority": "high"},
            {"title": "Chrome Android — responsive і touch-події", "priority": "high"},
            {"title": "Темна тема працює в усіх браузерах", "priority": "low"},
            {"title": "Друк PDF/CSV з браузера працює", "priority": "low"},
        ],
    },
]

MOBILE_TEMPLATE = [
    {
        "name": "Smoke (iOS + Android)",
        "description": "Критичні сценарії при кожному релізі",
        "cases": [
            {"title": "Застосунок запускається без крашу", "priority": "critical"},
            {"title": "Логін / реєстрація через email", "priority": "critical"},
            {"title": "Push-нотифікації приходять", "priority": "high"},
            {"title": "Deep links відкривають правильні екрани", "priority": "high"},
            {"title": "Біометрія (Face ID / Fingerprint)", "priority": "high"},
            {"title": "App switching зберігає стан", "priority": "medium"},
        ],
    },
    {
        "name": "Crash detection",
        "description": "Сценарії, що раніше викликали краши",
        "cases": [
            {"title": "Швидке перемикання між екранами не крашить", "priority": "high"},
            {"title": "Велике зображення (>10 MB) не крашить", "priority": "high"},
            {"title": "Bluetooth/Camera permission denied — graceful", "priority": "medium"},
            {"title": "Ротація екрана на формах не втрачає дані", "priority": "medium"},
            {"title": "Нестабільна мережа — retry логіка", "priority": "high"},
            {"title": "Оновлення з нескінченної версії — без даних не пропадає", "priority": "high"},
        ],
    },
    {
        "name": "Offline",
        "description": "Поведінка без інтернет-зʼєднання",
        "cases": [
            {"title": "Кешовані екрани відкриваються offline", "priority": "high"},
            {"title": "Створені offline записи синхронізуються при поверненні", "priority": "high"},
            {"title": "Помилки офлайн зрозумілі користувачу", "priority": "medium"},
            {"title": "Завантаження файлів продовжується після reconnect", "priority": "medium"},
        ],
    },
]

API_TEMPLATE = [
    {
        "name": "Contract tests",
        "description": "Перевірка незмінності API-контракту",
        "cases": [
            {"title": "GET /api/<entity> — schema відповідає OpenAPI", "priority": "critical"},
            {"title": "POST /api/<entity> — обовʼязкові поля валідуються", "priority": "high"},
            {"title": "PATCH повертає оновлений обʼєкт", "priority": "high"},
            {"title": "DELETE повертає 204 без тіла", "priority": "high"},
            {"title": "Pagination метадані (count, next, previous)", "priority": "medium"},
            {"title": "Filtering і ordering query-параметри", "priority": "medium"},
        ],
    },
    {
        "name": "Load",
        "description": "Перевірка під навантаженням",
        "cases": [
            {"title": "100 RPS на /api/list — p95 < 200 ms", "priority": "high"},
            {"title": "1000 одночасних з'єднань — без 502", "priority": "high"},
            {"title": "Великий payload (5 MB) приймається", "priority": "medium"},
            {"title": "Database pool не вичерпується при 50 одночасних запитах", "priority": "high"},
        ],
    },
    {
        "name": "Security",
        "description": "Базові перевірки безпеки",
        "cases": [
            {"title": "Без токену — 401", "priority": "critical"},
            {"title": "Чужий токен (інший user) — 403", "priority": "critical"},
            {"title": "SQL injection у параметрах фільтра", "priority": "critical"},
            {"title": "XSS у text-полях через API", "priority": "high"},
            {"title": "Rate limit на /auth/login (max 10/min)", "priority": "high"},
        ],
    },
]


TEMPLATES = {
    "web": WEB_TEMPLATE,
    "mobile": MOBILE_TEMPLATE,
    "api": API_TEMPLATE,
    "blank": [],
    "import": [],  # Імпорт з JIRA/Linear — окремий wizard, не сидить даними
}


def apply_template(project, template_id: str, user=None):
    """Створює TestSuite + TestCase для проєкту згідно з обраним шаблоном.

    Повертає dict з кількістю створеного: {suites: N, cases: M}.
    """
    from .models import TestCase, TestSuite

    suites_data = TEMPLATES.get(template_id, [])
    if not suites_data:
        return {"suites": 0, "cases": 0}

    suites_count = 0
    cases_count = 0
    for suite_data in suites_data:
        suite = TestSuite.objects.create(
            project=project,
            name=suite_data["name"],
            description=suite_data.get("description", ""),
        )
        suites_count += 1
        for case_data in suite_data.get("cases", []):
            TestCase.objects.create(
                suite=suite,
                title=case_data["title"],
                priority=case_data.get("priority", "medium"),
                type=case_data.get("type", "manual"),
                created_by=user,
            )
            cases_count += 1

    return {"suites": suites_count, "cases": cases_count}
