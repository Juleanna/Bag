# Інтеграції BugTracker

Цей документ описує, як підключити зовнішні сервіси до BugTracker:
**Sentry, Prometheus/Grafana, бекапи Postgres, OAuth (Google/GitHub), Slack, GitHub.**

---

## 1. Sentry — моніторинг помилок

`sentry-sdk>=2.0.0` уже в `requirements.txt`. Залишилось тільки задати DSN.

### Кроки

1. Створіть проєкт у [sentry.io](https://sentry.io) → Python / Django.
2. Скопіюйте DSN.
3. Додайте у `.env`:

   ```env
   SENTRY_DSN=https://<key>@o0.ingest.sentry.io/0
   SENTRY_ENVIRONMENT=production
   SENTRY_TRACES_SAMPLE_RATE=0.1
   ```

4. Перевірте, що `bugtracker/settings.py` ініціалізує SDK (стандартний код):

   ```python
   import sentry_sdk
   from sentry_sdk.integrations.django import DjangoIntegration

   if SENTRY_DSN := os.getenv("SENTRY_DSN"):
       sentry_sdk.init(
           dsn=SENTRY_DSN,
           integrations=[DjangoIntegration()],
           traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
           environment=os.getenv("SENTRY_ENVIRONMENT", "production"),
           send_default_pii=False,
       )
   ```

5. Restart контейнера. У Sentry зʼявляться помилки 5xx та незловлені винятки.

---

## 2. Prometheus + Grafana — метрики

Монітор-стек запускається опціонально:

```bash
docker compose --profile monitoring up -d
```

- **Prometheus** — `http://localhost:9090`
- **Grafana** — `http://localhost:3000` (admin / `GRAFANA_PASSWORD`)

### Backend-ендпоінт `/api/metrics/`

Якщо ще не встановлено, додайте `django-prometheus`:

```bash
pip install django-prometheus
```

У `INSTALLED_APPS`:

```python
INSTALLED_APPS = [..., "django_prometheus"]
```

У `urls.py`:

```python
path("api/metrics/", include("django_prometheus.urls")),
```

Конфіг скрейпу — `deploy/prometheus.yml` (target: `web:8000`).

### Готові дашборди

Імпортуйте у Grafana:
- **Django Application** — ID `9528`
- **PostgreSQL Database** — ID `9628`

---

## 3. Бекапи Postgres

Окремий profile у `docker-compose.yml`:

```bash
docker compose --profile backups up -d postgres-backup
```

Налаштовано через `prodrigestivill/postgres-backup-local`:
- daily бекап у `./backups/`
- зберігання: 7 днів, 4 тижні, 6 місяців

### Ручний бекап:

```bash
docker compose exec db pg_dump -U bugtracker bugtracker | gzip > backup-$(date +%F).sql.gz
```

### Відновлення:

```bash
gunzip < backup-2026-05-06.sql.gz | docker compose exec -T db psql -U bugtracker bugtracker
```

---

## 4. OAuth — Google / GitHub login

> **Статус:** заглушки в `issues/views_auth.py` готові — підключіть `django-allauth`
> або `social-auth-app-django` для повної функціональності.

### Швидкий шлях через `django-allauth`

```bash
pip install django-allauth
```

`settings.py`:

```python
INSTALLED_APPS += [
    "django.contrib.sites",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.github",
]
SITE_ID = 1
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]
```

### Google

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client.
2. Authorized redirect URI: `https://your-domain/accounts/google/login/callback/`.
3. У Django Admin → Sites: задайте domain.
4. Social applications → New: client_id, secret, site=ваш.

### GitHub

1. [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App.
2. Callback URL: `https://your-domain/accounts/github/login/callback/`.
3. Аналогічно у Django Admin → Social applications.

---

## 5. Slack — нотифікації через webhook

BugTracker уже має модель `Webhook` і signal-driver. Slack — це просто інший URL.

### Налаштування

1. У Slack: **Apps → Incoming Webhooks → Add to Slack**, оберіть канал, скопіюйте URL вигляду `https://hooks.slack.com/services/T.../B.../...`.
2. У BugTracker → **Webhooks** (нова сторінка):
   - URL: вставте Slack webhook URL.
   - Events: оберіть події (issue.created, issue.closed, comment.created).
3. Готово — кожна подія POST-ить JSON у Slack.

### Формат payload

Зараз backend шле плоский JSON. Для красивого форматування додайте трансформер у
`issues/signals.py::_deliver_webhook` — детектьте `slack.com` у URL і конвертуйте у Slack блоки:

```python
if "slack.com" in webhook.url:
    payload = {
        "text": f"*{event}* — {issue.title}",
        "blocks": [...],
    }
```

---

## 6. GitHub — двостороння синхронізація

> **Базовий рівень (вихідний webhook):** уже працює — створіть Webhook
> з URL вигляду `https://api.github.com/repos/...` (потрібен PAT-токен).

### Розширена інтеграція (опціонально)

Створіть **GitHub App**:
1. github.com/settings/apps → New GitHub App.
2. Permissions:
   - Issues: Read & Write
   - Metadata: Read
3. Subscribe to events: `issues`, `issue_comment`, `pull_request`.
4. Webhook URL: `https://your-domain/api/integrations/github/`.

### Синхронізація issues ↔ bugs

Додайте view-handler у `issues/views_api.py`:

```python
@api_view(["POST"])
@drf_permission_classes([AllowAny])
def github_webhook(request):
    event = request.headers.get("X-GitHub-Event")
    payload = request.data
    # 1. Перевірте HMAC підпис (X-Hub-Signature-256)
    # 2. action == "opened" → створити Issue з title, body, GH-номером
    # 3. action == "closed" → закрити повʼязаний Issue
    return Response(status=200)
```

Зворотній напрямок (BugTracker → GitHub) — через існуючу модель `IntegrationConfig`:
збережіть `github_token` і `repo_full_name`, у signal на `issue.created`
викликайте `requests.post("https://api.github.com/repos/.../issues", ...)`.

---

## 7. Чек-лист продакшн-деплою

- [ ] `SECRET_KEY` встановлено (не дефолтний)
- [ ] `DEBUG=False`, `ALLOWED_HOSTS=ваш-домен`
- [ ] HTTPS (Let's Encrypt через Certbot або Caddy)
- [ ] `SENTRY_DSN` налаштовано
- [ ] Бекапи запущено (`--profile backups`)
- [ ] Моніторинг увімкнено (`--profile monitoring`)
- [ ] CSRF_TRUSTED_ORIGINS містить домен
- [ ] Webhook-secret для GitHub задано (HMAC)
- [ ] Email backend (SMTP/SES) налаштовано для нотифікацій
- [ ] `python manage.py check --deploy` без warnings
