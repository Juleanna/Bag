# 📈 SCALING_GUIDE - Гайд масштабирования

> Полное руководство по масштабированию BugTracker на миллионы пользователей

---

## 📚 Содержание

1. [6-уровневая стратегия масштабирования](#6-уровневая-стратегия-масштабирования)
2. [Уровень 1: Оптимизация кода](#уровень-1-оптимизация-кода)
3. [Уровень 2: Кэширование](#уровень-2-кэширование)
4. [Уровень 3: База данных](#уровень-3-база-данных)
5. [Уровень 4: Асинхронная обработка](#уровень-4-асинхронная-обработка)
6. [Уровень 5: Распределённые системы](#уровень-5-распределённые-системы)
7. [Уровень 6: Микросервисы](#уровень-6-микросервисы)
8. [Мониторинг производительности](#мониторинг-производительности)
9. [Чеклист масштабирования](#чеклист-масштабирования)

---

## 🎯 6-уровневая стратегия масштабирования

### Дорожная карта

```
Уровень 1: Оптимизация кода
    ↓ (100K пользователей)
Уровень 2: Кэширование (Redis)
    ↓ (500K пользователей)
Уровень 3: Оптимизация БД
    ↓ (1M пользователей)
Уровень 4: Асинхронная обработка
    ↓ (5M пользователей)
Уровень 5: Распределённые системы
    ↓ (10M+ пользователей)
Уровень 6: Микросервисы
    ↓ (100M+ пользователей)
```

---

## 🔧 Уровень 1: Оптимизация кода

### 1.1 Проблема: N+1 запросы

**Плохо:**

```python
# Каждый project требует отдельный запрос за owner
projects = Project.objects.all()
for project in projects:
    print(project.owner.name)  # N запросов!
```

**Хорошо:**

```python
# Один запрос с JOIN
projects = Project.objects.select_related('owner').all()
for project in projects:
    print(project.owner.name)  # Уже загружено!
```

### 1.2 Проблема: Большие запросы

**Плохо:**

```python
# Загружает всё
issues = Issue.objects.all()
for issue in issues[:10]:  # Но используем только 10
    print(issue.title)
```

**Хорошо:**

```python
# Загружает только нужное
issues = Issue.objects.all()[:10]
for issue in issues:
    print(issue.title)
```

### 1.3 Проблема: Медленные view функции

**Плохо:**

```python
@api_view(['GET'])
def get_issues(request):
    # Процесс идёт синхронно - блокирует других пользователей
    issues = []
    for project_id in range(1000):
        issues.extend(Issue.objects.filter(project_id=project_id))
    return Response(issues)
```

**Хорошо:**

```python
@api_view(['GET'])
def get_issues(request):
    # Используем select_related и фильтруем
    issues = Issue.objects.select_related('project').filter(
        project__owner=request.user
    )[:100]
    return Response(IssueSerializer(issues, many=True).data)
```

### 1.4 Оптимизация Django ORM

```python
# ✅ Правила оптимизации:

# 1. Используйте select_related для ForeignKey
issues = Issue.objects.select_related('project')

# 2. Используйте prefetch_related для ManyToMany
projects = Project.objects.prefetch_related('issues')

# 3. Используйте only() для выбора нужных полей
issues = Issue.objects.only('id', 'title', 'status')

# 4. Используйте values() для простых случаев
issues = Issue.objects.values('id', 'title')

# 5. Группируйте запросы
issues = Issue.objects.filter(status='open').aggregate(
    total=Count('id'),
    avg_priority=Avg('priority')
)

# 6. Используйте exists() вместо count()
if Issue.objects.filter(status='open').exists():
    print("Есть открытые задачи")
```

### 1.5 Оптимизация фронтенда

```typescript
// ❌ Плохо - загружает весь список, даже если не видимо
const issues = await fetch("/api/issues/").then((r) => r.json());

// ✅ Хорошо - пагинация
const issues = await fetch("/api/issues/?page=1&page_size=20").then((r) =>
  r.json(),
);

// ✅ Хорошо - ленивая загрузка
const [page, setPage] = useState(1);
const more = async () => {
  const res = await fetch(`/api/issues/?page=${page + 1}`);
  setIssues([...issues, ...(await res.json())]);
  setPage(page + 1);
};
```

---

## 💾 Уровень 2: Кэширование (Redis)

### 2.1 Кэширование запросов

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# views.py или views_api.py
from django.views.decorators.cache import cache_page
from django.core.cache import cache

# Кэшировать на 5 минут
@cache_page(60 * 5)
@api_view(['GET'])
def get_projects(request):
    projects = Project.objects.all()[:100]
    return Response(ProjectSerializer(projects, many=True).data)

# Или вручную
@api_view(['GET'])
def get_projects(request):
    cache_key = f'projects_{request.user.id}'

    # Проверить кэш
    projects_data = cache.get(cache_key)

    if projects_data is None:
        # Если нет в кэше - получить из БД
        projects = Project.objects.filter(owner=request.user)[:100]
        projects_data = ProjectSerializer(projects, many=True).data

        # Сохранить в кэш на 5 минут
        cache.set(cache_key, projects_data, 60 * 5)

    return Response(projects_data)
```

### 2.2 Кэширование на фронтенде

```typescript
// Простой кэш
const cache = new Map();

async function getIssues(projectId) {
  const key = `issues_${projectId}`;

  if (cache.has(key)) {
    return cache.get(key); // Вернуть из кэша
  }

  const res = await fetch(`/api/issues/?project=${projectId}`);
  const data = await res.json();

  cache.set(key, data); // Сохранить в кэш
  return data;
}

// С истечением времени
function cacheWithTTL(key, value, ttlMs = 5 * 60 * 1000) {
  cache.set(key, value);
  setTimeout(() => cache.delete(key), ttlMs);
}
```

### 2.3 Кэширование сессий

```python
# settings.py
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

### 2.4 Инвалидация кэша

```python
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete

# При создании/обновлении проекта - очистить кэш
@receiver(post_save, sender=Project)
def clear_projects_cache(sender, instance, **kwargs):
    cache_key = f'projects_{instance.owner_id}'
    cache.delete(cache_key)

@receiver(post_delete, sender=Project)
def clear_projects_cache_delete(sender, instance, **kwargs):
    cache_key = f'projects_{instance.owner_id}'
    cache.delete(cache_key)
```

---

## 🗄️ Уровень 3: Оптимизация БД

### 3.1 Индексы БД

```sql
-- Быстрые поиски по owner
CREATE INDEX idx_project_owner ON issues_project(owner_id);
CREATE INDEX idx_issue_project ON issues_issue(project_id);

-- Быстрые фильтры по статусу
CREATE INDEX idx_issue_status ON issues_issue(status);

-- Быстрые поиски по тексту
CREATE INDEX idx_issue_title
  ON issues_issue
  USING GIN(to_tsvector('english', title));

-- Составной индекс для сложных фильтров
CREATE INDEX idx_issue_project_status
  ON issues_issue(project_id, status);
```

```python
# Django миграция для индексов
from django.db import models

class Issue(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    class Meta:
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['-created_at']),
        ]
```

### 3.2 Партиционирование БД

```sql
-- Партицировать задачи по дате
CREATE TABLE issues_2024_q1 PARTITION OF issues
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE issues_2024_q2 PARTITION OF issues
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Партицировать по project_id
CREATE TABLE issues_project_1 PARTITION OF issues
  FOR VALUES IN (1, 2, 3, 4, 5);
```

### 3.3 Денормализация

```python
# Добавить поле в Project для быстрого счёта
class Project(models.Model):
    name = models.CharField(max_length=100)
    issues_count = models.IntegerField(default=0, db_index=True)

    def refresh_issues_count(self):
        self.issues_count = self.issues.count()
        self.save()

# При создании/удалении задачи - обновить счётчик
@receiver(post_save, sender=Issue)
def update_project_count(sender, instance, created, **kwargs):
    if created:
        instance.project.issues_count += 1
    instance.project.save()

@receiver(post_delete, sender=Issue)
def update_project_count_delete(sender, instance, **kwargs):
    instance.project.issues_count -= 1
    instance.project.save()
```

### 3.4 Арх

ивирование старых данных

```python
# Переместить старые задачи в архив таблицу
from datetime import timedelta
from django.utils import timezone

old_date = timezone.now() - timedelta(days=365)
archived = Issue.objects.filter(
    updated_at__lt=old_date,
    status='done'
).delete()
```

---

## ⚡ Уровень 4: Асинхронная обработка

### 4.1 Celery для длительных операций

```python
# celery.py
from celery import Celery

app = Celery('bugtracker')

# tasks.py
@app.task
def send_issue_notification(issue_id):
    """Отправить уведомление о новой задаче"""
    issue = Issue.objects.get(id=issue_id)

    # Долгая операция - отправка email
    send_email(
        to=issue.project.owner.email,
        subject=f'New issue: {issue.title}',
        body=issue.description
    )

# views.py
@api_view(['POST'])
def create_issue(request):
    serializer = IssueSerializer(data=request.data)
    if serializer.is_valid():
        issue = serializer.save()

        # Запустить асинхронную задачу
        send_issue_notification.delay(issue.id)

        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)
```

### 4.2 Celery beat для периодических задач

```python
# settings.py
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'cleanup-old-issues': {
        'task': 'issues.tasks.cleanup_old_issues',
        'schedule': crontab(hour=2, minute=0),  # Каждый день в 2:00
    },
    'send-weekly-report': {
        'task': 'issues.tasks.send_weekly_report',
        'schedule': crontab(day_of_week=1, hour=9),  # Каждый понедельник в 9:00
    },
    'refresh-cache': {
        'task': 'issues.tasks.refresh_cache',
        'schedule': 300,  # Каждые 5 минут
    },
}

# tasks.py
@app.task
def cleanup_old_issues():
    """Удалить старые завершённые задачи"""
    old_date = timezone.now() - timedelta(days=365)
    Issue.objects.filter(
        updated_at__lt=old_date,
        status='done'
    ).delete()

@app.task
def send_weekly_report():
    """Отправить еженедельный отчёт"""
    for user in User.objects.filter(is_active=True):
        issue_count = Issue.objects.filter(
            project__owner=user,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()

        send_email(
            to=user.email,
            subject='Weekly Report',
            body=f'This week you created {issue_count} issues'
        )
```

### 4.3 Очереди задач

```python
# Приоритизировать задачи
@app.task(queue='critical')
def send_alert(issue_id):
    # Высокий приоритет
    pass

@app.task(queue='default')
def send_notification(issue_id):
    # Средний приоритет
    pass

@app.task(queue='low')
def generate_report(project_id):
    # Низкий приоритет
    pass

# celery.py
app.conf.task_routes = {
    'issues.tasks.send_alert': {'queue': 'critical'},
    'issues.tasks.send_notification': {'queue': 'default'},
    'issues.tasks.generate_report': {'queue': 'low'},
}

# Запустить несколько workers
# celery -A bugtracker worker -Q critical,default
# celery -A bugtracker worker -Q low
# celery -A bugtracker worker -Q default
```

---

## 🔀 Уровень 5: Распределённые системы

### 5.1 Load Balancing с Nginx

```nginx
# /etc/nginx/nginx.conf
upstream backend {
    least_conn;  # Отправлять запросы на сервер с меньше подключений

    server 192.168.1.10:8000 weight=1 max_fails=2 fail_timeout=30s;
    server 192.168.1.11:8000 weight=1 max_fails=2 fail_timeout=30s;
    server 192.168.1.12:8000 weight=1 max_fails=2 fail_timeout=30s;

    keepalive 32;  # Переиспользовать соединения
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Таймауты
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
```

### 5.2 Горизонтальное масштабирование

```bash
# Запустить несколько экземпляров Gunicorn
gunicorn bugtracker.wsgi:application --bind 192.168.1.10:8000 --workers 4
gunicorn bugtracker.wsgi:application --bind 192.168.1.11:8000 --workers 4
gunicorn bugtracker.wsgi:application --bind 192.168.1.12:8000 --workers 4

# Или с Docker
docker-compose up -d --scale web=3  # Запустить 3 контейнера web
```

### 5.3 Распределённый кэш

```python
# Использовать Redis Cluster
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': [
            'redis://192.168.1.10:6379/1',
            'redis://192.168.1.11:6379/1',
            'redis://192.168.1.12:6379/1',
        ],
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.ShardClient',
        }
    }
}
```

### 5.4 Сессии в распределённой системе

```python
# settings.py
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Это автоматически работает с Redis Cluster
```

---

## 🔧 Уровень 6: Микросервисы

### 6.1 Разделение приложения

```
bugtracker/
├── api-gateway/        # API Gateway (FastAPI)
├── projects-service/   # Сервис проектов (Django)
├── issues-service/     # Сервис задач (Django)
├── notifications-service/ # Сервис уведомлений (Node.js)
├── analytics-service/  # Аналитика (Python)
└── common/             # Общая библиотека
```

### 6.2 API Gateway

```python
# api_gateway/main.py (FastAPI)
from fastapi import FastAPI
import httpx

app = FastAPI()

@app.get("/api/projects/")
async def get_projects():
    async with httpx.AsyncClient() as client:
        res = await client.get("http://projects-service:8001/api/projects/")
        return res.json()

@app.get("/api/issues/")
async def get_issues():
    async with httpx.AsyncClient() as client:
        res = await client.get("http://issues-service:8002/api/issues/")
        return res.json()
```

### 6.3 Межсервисная коммуникация

```python
# RabbitMQ для асинхронных сообщений
import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
channel = connection.channel()

# Publisher (Issues Service)
channel.basic_publish(
    exchange='',
    routing_key='issue_created',
    body=json.dumps({'issue_id': 123})
)

# Subscriber (Notifications Service)
def on_issue_created(ch, method, properties, body):
    issue = json.loads(body)
    send_notification(issue['issue_id'])

channel.basic_consume(
    queue='issue_created',
    on_message_callback=on_issue_created
)
```

---

## 📊 Мониторинг производительности

### Метрики для отслеживания

```python
# Установить prometheus-client
pip install prometheus-client django-prometheus

# settings.py
INSTALLED_APPS = [
    'django_prometheus',
    # ...
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    # ... другие middleware ...
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]

# urls.py
from django_prometheus import urls as prom_urls

urlpatterns = [
    # ...
    path('metrics/', include(prom_urls)),
]
```

### Инструменты мониторинга

```bash
# Prometheus
docker run -d -p 9090:9090 prom/prometheus

# Grafana
docker run -d -p 3000:3000 grafana/grafana

# New Relic
pip install newrelic
NEW_RELIC_CONFIG_FILE=newrelic.ini newrelic-admin run-program gunicorn ...

# DataDog
pip install datadog
dd-trace-run python manage.py runserver
```

---

## ✅ Чеклист масштабирования

### Уровень 1 ✓

- [ ] Оптимизированы запросы (select_related, prefetch_related)
- [ ] Используются индексы БД
- [ ] Фронтенд использует пагинацию
- [ ] Удалены N+1 запросы

### Уровень 2 ✓

- [ ] Redis установлен и работает
- [ ] Кэширование включено
- [ ] TTL для кэша установлены
- [ ] Инвалидация кэша работает

### Уровень 3 ✓

- [ ] Индексы БД созданы
- [ ] Статистика БД актуальна
- [ ] Партиционирование настроено (если нужно)
- [ ] Денормализация применена (если нужно)

### Уровень 4 ✓

- [ ] Celery запущен
- [ ] Асинхронные задачи работают
- [ ] Celery beat настроен
- [ ] Очереди приоритизированы

### Уровень 5 ✓

- [ ] Load balancer настроен
- [ ] Несколько экземпляров приложения
- [ ] Распределённый кэш работает
- [ ] Health checks работают

### Уровень 6 ✓

- [ ] Микросервисная архитектура
- [ ] API Gateway работает
- [ ] Межсервисная коммуникация
- [ ] Отказоустойчивость

### Мониторинг ✓

- [ ] Prometheus собирает метрики
- [ ] Grafana визуализирует данные
- [ ] Алерты настроены
- [ ] Логи централизованы

---

## 📚 Дальше

- 🏛️ [ARCHITECTURE.md](ARCHITECTURE_FULL.md) - архитектура системы
- 📡 [API_REFERENCE.md](API_REFERENCE_FULL.md) - справочник API
- 🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE_FULL.md) - деплой

---

🚀 **Успешного масштабирования!**
