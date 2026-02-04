# 🏛️ ARCHITECTURE - Архитектура системы

> Полное описание архитектуры BugTracker, компонентов и их взаимодействия

---

## 📚 Содержание

1. [Обзор системы](#обзор-системы)
2. [Стек технологий](#стек-технологий)
3. [Диаграмма развёртывания](#диаграмма-развёртывания)
4. [Бэкенд архитектура](#бэкенд-архитектура)
5. [Фронтенд архитектура](#фронтенд-архитектура)
6. [Поток данных](#поток-данных)
7. [Безопасность](#безопасность)
8. [Масштабируемость](#масштабируемость)
9. [Решения архитектурных проблем](#решения-архитектурных-проблем)

---

## 🎯 Обзор системы

**BugTracker** — веб-приложение для управления проектами и отслеживания ошибок (issues).

### Основные компоненты

```
┌─────────────────────────────────────────────┐
│         БРАУЗЕР / МОБИЛЬНОЕ ПРИЛОЖЕНИЕ     │
│                                             │
│  Vite + TypeScript + Tailwind + DaisyUI    │
│            (Фронтенд с HMR)               │
└────────────────┬────────────────────────────┘
                 │ HTTP/HTTPS + WebSocket
                 ↓
┌─────────────────────────────────────────────┐
│              NGINX (Reverse Proxy)          │
│          SSL/TLS, Load Balancing            │
└─────────────┬───────────────────────────────┘
              │
    ┌─────────┴──────────┬──────────────┐
    ↓                    ↓              ↓
┌────────┐          ┌──────────┐   ┌─────────┐
│Backend │          │Backend   │   │Backend  │
│  #1    │          │  #2      │   │  #3     │
│Django  │          │Django    │   │Django   │
└─┬──────┘          └────┬─────┘   └────┬────┘
  │                      │              │
  └──────────────────────┼──────────────┘
                         │ (Shared Resources)
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   ┌──────────┐    ┌──────────┐   ┌────────────┐
   │PostgreSQL│    │  Redis   │   │   Celery   │
   │Database  │    │ (Cache)  │   │(Async Jobs)│
   └──────────┘    └──────────┘   └────────────┘
```

---

## 📦 Стек технологий

### Бэкенд

| Слой                | Технология            | Версия | Назначение         |
| ------------------- | --------------------- | ------ | ------------------ |
| **Framework**       | Django                | 5.2.7  | Web-приложение     |
| **API**             | Django REST Framework | 3.15.0 | REST API           |
| **БД**              | PostgreSQL            | 15     | Основная БД        |
| **Кэш**             | Redis                 | 7      | Кэширование        |
| **Очереди**         | Celery                | 5.4.0  | Асинхронные задачи |
| **Сервер**          | Gunicorn              | 23.0.0 | WSGI сервер        |
| **Веб-сервер**      | Nginx                 | Latest | Reverse proxy      |
| **Контейнеризация** | Docker                | Latest | Контейнеры         |

### Фронтенд

| Слой              | Технология   | Версия | Назначение           |
| ----------------- | ------------ | ------ | -------------------- |
| **Язык**          | TypeScript   | 5.9.3  | Типизированный JS    |
| **Build tool**    | Vite         | 7.1.7  | Быстрая сборка       |
| **CSS Framework** | Tailwind CSS | 4.1.16 | Стили                |
| **UI Components** | DaisyUI      | 5.3.10 | Pre-built компоненты |
| **Runtime**       | Node.js      | 18+    | Среда выполнения     |

---

## 🏗️ Диаграмма развёртывания

### Development окружение

```
┌──────────────────────────────────────────┐
│          Developer Machine               │
├──────────────────────────────────────────┤
│ ┌──────────────┐     ┌──────────────┐   │
│ │   VS Code    │     │   Terminal   │   │
│ │  + Debugger  │     │  + Git       │   │
│ └──────────────┘     └──────────────┘   │
│        │                     │            │
│ ┌──────┴────────────────────┴────────┐  │
│ │    Python 3.11 + Node.js 18        │  │
│ │                                    │  │
│ │  Vite Dev Server:5173  ←→  HMR   │  │
│ │  Django:8000           ←→  API    │  │
│ │  PostgreSQL:5432                  │  │
│ │  Redis:6379                       │  │
│ │  Celery Worker                    │  │
│ └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Production окружение

```
┌──────────────────────────────────────────────────────┐
│                    Production Server                 │
│                  (e.g., AWS EC2, VPS)               │
├──────────────────────────────────────────────────────┤
│ Port 80/443                                          │
│     ↓                                                │
│ ┌──────────────────────────────────────────────┐    │
│ │  HTTPS/TLS Certificate (Let's Encrypt)       │    │
│ │  SSL Termination                             │    │
│ └────────────┬─────────────────────────────────┘    │
│              │                                       │
│ ┌────────────▼──────────────────────────────────┐   │
│ │ Nginx (Reverse Proxy, Load Balancer)          │   │
│ │ - Static files serving                        │   │
│ │ - Request routing                             │   │
│ │ - Compression (gzip)                          │   │
│ │ - Rate limiting                               │   │
│ └────────────┬──────────────────────────────────┘   │
│              │                                       │
│    ┌─────────┼─────────┬──────────────┐            │
│    ↓         ↓         ↓              ↓            │
│  ┌────────────────────────────────────────┐        │
│  │  Gunicorn Workers x4 (Port 8000)       │        │
│  │  Django Application                    │        │
│  │  - Models, Views, Serializers          │        │
│  │  - Business Logic                      │        │
│  │  - API Endpoints                       │        │
│  └────┬───────────────────────────────────┘        │
│       │                                             │
│ ┌─────┴──────────┬──────────────┬──────────────┐   │
│ ↓                ↓              ↓              ↓   │
│ PostgreSQL    Redis Cluster   Celery         File  │
│ (Port 5432)   (Port 6379)     Workers      Storage │
│ - Data        - Cache         - Async Jobs  - S3   │
│ - Users       - Sessions      - Emails      - CDN  │
│ - Projects    - Locks         - Reports           │
│ - Issues      - Queues                            │
│ - Attachments                                     │
└──────────────────────────────────────────────────────┘
```

---

## 🔙 Бэкенд архитектура

### MVP Pattern (Model-View-Presenter)

```
┌──────────────────────────────────────────┐
│            REST API Client               │
│          (Vite Frontend/Mobile)          │
└────────────────┬─────────────────────────┘
                 │ GET /api/projects/
                 │ POST /api/issues/
                 ↓
         ┌───────────────┐
         │  URL Routing  │
         │  (urls.py)    │
         └───────┬───────┘
                 ↓
      ┌──────────────────┐
      │  API Views       │
      │ (views_api.py)   │
      │ (DRF ViewSets)   │
      └────────┬─────────┘
               │ get_object()
               │ get_queryset()
               ↓
      ┌──────────────────┐
      │  Serializers     │
      │(serializers.py)  │
      │  validate()      │
      │  create()        │
      │  update()        │
      └────────┬─────────┘
               │
               ↓
      ┌──────────────────┐
      │  Models          │
      │ (models.py)      │
      │ - User           │
      │ - Project        │
      │ - Issue          │
      │ - Attachment     │
      └────────┬─────────┘
               │
      ┌────────▼──────────┐
      │   PostgreSQL      │
      │   Database        │
      └───────────────────┘
```

### 1. Models (`models.py`)

```python
class User(AbstractUser):
    """Django встроенная модель"""
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True)

class Project(models.Model):
    """Проект (хранилище задач)"""
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['owner', '-created_at']),
        ]

class Issue(models.Model):
    """Задача/Баг"""
    STATUSES = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    )

    PRIORITIES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUSES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITIES, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['-created_at']),
        ]
```

### 2. Serializers (`serializers.py`)

```python
class ProjectSerializer(serializers.ModelSerializer):
    """Сериализация Project → JSON"""
    issues_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at', 'issues_count']

    def get_issues_count(self, obj):
        return obj.issues.count()

class IssueSerializer(serializers.ModelSerializer):
    """Сериализация Issue → JSON"""
    class Meta:
        model = Issue
        fields = ['id', 'title', 'description', 'status', 'priority', 'project']

    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters")
        return value
```

### 3. Views API (`views_api.py`)

```python
class ProjectViewSet(viewsets.ModelViewSet):
    """API для проектов"""
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Показать только проекты текущего пользователя
        return Project.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class IssueViewSet(viewsets.ModelViewSet):
    """API для задач"""
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'status', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority']

    def get_queryset(self):
        # Показать только задачи в проектах пользователя
        return Issue.objects.filter(
            project__owner=self.request.user
        ).select_related('project')
```

### 4. URLs (`urls.py`)

```python
from rest_framework.routers import DefaultRouter
from issues.views_api import ProjectViewSet, IssueViewSet

router = DefaultRouter()
router.register('projects', ProjectViewSet, basename='project')
router.register('issues', IssueViewSet, basename='issue')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/auth/', include('issues.auth_urls')),
]
```

---

## 🎨 Фронтенд архитектура

### Вайт структура (h() функция вместо JSX)

```typescript
// src/components.ts - Компоненты как функции

export const Button = (props, ...children) =>
  h("button", { class: "btn btn-ghost", ...props }, ...children);

export const Card = (props, ...children) =>
  h(
    "div",
    { class: "card bg-base-100 shadow", ...props },
    h("div", { class: "card-body" }, ...children),
  );

export const h = (tag, props, ...children) => ({
  type: tag,
  props: { ...props, children: children.flat() },
});

// Render функция
export const render = (vnode, parent) => {
  if (typeof vnode === "string") {
    parent.appendChild(document.createTextNode(vnode));
    return;
  }

  const el = document.createElement(vnode.type);
  for (const [key, value] of Object.entries(vnode.props || {})) {
    if (key === "children") {
      value.forEach((child) => render(child, el));
    } else if (typeof value === "function") {
      el.addEventListener(key.replace("on", "").toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }
  parent.appendChild(el);
};
```

### Архитектура фронтенда

```
src/
├── main.ts                 # Entry point
├── style.css              # Глобальные стили (Tailwind)
├── components.ts          # UI компоненты (25+)
├── api.ts                 # API клиент с типами
├── pages/
│   ├── dashboard.ts       # Главная страница
│   ├── projects.ts        # Список проектов
│   ├── issues.ts          # Список задач
│   └── project-detail.ts  # Детали проекта
└── types.ts               # TypeScript интерфейсы
```

### API клиент (`api.ts`)

```typescript
// Типизированный API клиент
interface Project {
  id: number;
  name: string;
  description: string;
  issues_count: number;
  created_at: string;
}

interface Issue {
  id: number;
  title: string;
  status: "open" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  project: number;
}

export const api = {
  async getProjects(): Promise<{ results: Project[] }> {
    const res = await fetch("/api/projects/");
    return res.json();
  },

  async getIssues(projectId?: number) {
    const url = projectId
      ? `/api/issues/?project=${projectId}`
      : `/api/issues/`;
    const res = await fetch(url);
    return res.json();
  },

  async createIssue(data: Partial<Issue>) {
    const res = await fetch("/api/issues/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateIssue(id: number, data: Partial<Issue>) {
    const res = await fetch(`/api/issues/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
```

---

## 🔄 Поток данных

### 1. Получение списка проектов

```
1. Пользователь открывает /projects
                ↓
2. Браузер отправляет GET /api/projects/
                ↓
3. Nginx маршрутизирует на Gunicorn:8000
                ↓
4. Django URL роутер → ProjectViewSet.list()
                ↓
5. ProjectViewSet проверяет права (IsAuthenticated)
                ↓
6. Получает queryset: Project.objects.filter(owner=user)
                ↓
7. Применяет фильтры, поиск, сортировку
                ↓
8. ProjectSerializer сериализует в JSON
                ↓
9. Response отправляется обратно (200 OK)
                ↓
10. Фронтенд получает JSON и рендерит компоненты
                ↓
11. Пользователь видит список проектов
```

### 2. Создание новой задачи

```
1. Пользователь заполняет форму и нажимает "Создать"
                ↓
2. Фронтенд валидирует локально
                ↓
3. POST /api/issues/ с телом:
   {
     "title": "...",
     "description": "...",
     "project": 1,
     "priority": "high"
   }
                ↓
4. Django проверяет CSRF токен
                ↓
5. IssueViewSet.create() обработка
                ↓
6. IssueSerializer.validate() проверка данных
                ↓
7. Если ошибки → Response 400 Bad Request
                ↓
8. Если OK → model.save() в БД
                ↓
9. Запускается асинхронная задача Celery:
   send_issue_notification.delay(issue.id)
                ↓
10. Response 201 Created с созданной задачей
                ↓
11. Фронтенд показывает success toast
                ↓
12. В фоне отправляется email уведомление (Celery)
```

### 3. Кэширование при получении проектов

```
Запрос 1:
  GET /api/projects/
  → Redis cache miss
  → PostgreSQL запрос
  → JSON ответ
  → Сохранение в Redis (TTL: 5 минут)

Запрос 2 (через 2 минуты):
  GET /api/projects/
  → Redis cache HIT ✓
  → Немедленный JSON ответ (быстро!)

Запрос 3 (через 6 минут):
  GET /api/projects/
  → Redis cache miss (истёк TTL)
  → PostgreSQL запрос
  → Сохранение в Redis заново
```

---

## 🔐 Безопасность

### Аутентификация

```
┌──────────────────────────────────────────┐
│        Пользователь логинится             │
│      (username + password)                │
└────────────────┬─────────────────────────┘
                 ↓
         ┌───────────────┐
         │  Django Auth  │
         │  - Проверка   │
         │  - Хеширование│
         └───────┬───────┘
                 ↓
    ┌────────────────────────────┐
    │ Создание Session Cookie    │
    │ - Secure flag (HTTPS)      │
    │ - HttpOnly flag            │
    │ - SameSite=Lax             │
    └────────────┬───────────────┘
                 ↓
    ┌────────────────────────────┐
    │ Хранится в Redis           │
    │ (быстрый доступ)           │
    └────────────┬───────────────┘
                 ↓
   ┌─────────────────────────────┐
   │ Последующие запросы         │
   │ - Отправляют cookie         │
   │ - Проверяется в Redis       │
   │ - Пользователь аутентичен   │
   └─────────────────────────────┘
```

### Авторизация

```python
class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Пользователь видит только свои проекты
        return Project.objects.filter(owner=self.request.user)

# Только owner проекта может его редактировать
class ProjectPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user
```

### CSRF защита

```python
# CSRF токен автоматически добавляется во все формы
{% csrf_token %}

# На фронтенде:
fetch('/api/issues/', {
  method: 'POST',
  headers: {
    'X-CSRFToken': getCookie('csrftoken')
  },
  body: JSON.stringify(data)
})
```

### SQL Injection защита

```python
# ✅ Безопасно (ORM защищает)
issues = Issue.objects.filter(title__icontains=search_term)

# ❌ Опасно (raw SQL)
issues = Issue.objects.raw(f"SELECT * FROM issues WHERE title LIKE '{search_term}'")
```

### XSS защита

```python
# Django автоматически экранирует в шаблонах
{{ issue.title }}  <!-- Автоматически экранируется -->

# На фронтенде:
h('p', {}, `User input: ${userInput}`)  // Безопасно
```

---

## 📈 Масштабируемость

### Горизонтальное масштабирование

```
Client Requests
      ↓
    Nginx (Load Balancer)
    ↙    ↓    ↘
  Web1  Web2  Web3  (Gunicorn workers)
   │     │     │
   └─────┼─────┘
        ↓
   PostgreSQL (Primary)
        │
    (Replication)
        │
   PostgreSQL (Replica) - Read-only
```

### Кэширование на разных уровнях

```
┌──────────────────────────────────┐
│  Browser Cache                   │ (30 days)
│  (Static assets, JS, CSS)        │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│  CDN Cache                       │ (1 hour)
│  (Cloudflare, CloudFront)        │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│  Application Cache (Redis)       │ (5 min)
│  (Django ORM results)            │
└────────────────┬─────────────────┘
                 ↓
┌──────────────────────────────────┐
│  Database Cache                  │ (indexes)
│  (Query optimizer)               │
└──────────────────────────────────┘
```

---

## ⚡ Решения архитектурных проблем

### Проблема 1: Медленная загрузка проектов

**Решение:** select_related + кэширование

```python
# Было
projects = Project.objects.all()  # N+1 запросы для owners

# Стало
projects = Project.objects.select_related('owner').filter(
    owner=request.user
)
cache.set(f'user_{user_id}_projects', projects_data, 300)
```

### Проблема 2: Долгие операции блокируют UI

**Решение:** Celery асинхронные задачи

```python
# Было
def create_issue(request):
    issue = Issue.objects.create(...)
    send_email(issue)  # Блокирует! 5 сек ожидания
    return Response(...)

# Стало
def create_issue(request):
    issue = Issue.objects.create(...)
    send_issue_email.delay(issue.id)  # Асинхронно!
    return Response(...)  # Быстро! (< 100ms)
```

### Проблема 3: Перегрузка БД при пиках трафика

**Решение:** Load balancing + read replicas

```
Пики трафика → Multiple app servers → Load balancing
               → Redis кэш убирает запросы в БД
               → Read replicas для analytics
```

### Проблема 4: Проблемы с памятью при большом датасете

**Решение:** Пагинация + streaming

```python
# Было
issues = Issue.objects.all()  # Может быть миллион!

# Стало
paginator = Paginator(Issue.objects.all(), 20)
page = paginator.get_page(1)
```

---

## 🎓 Диаграмма взаимодействия компонентов

```
┌─────────────────────────────────────────────────────────┐
│                        USER                             │
│                   (Browser/Mobile)                      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS Request
                     ↓
┌─────────────────────────────────────────────────────────┐
│ NGINX (Port 80/443)                                     │
│ - SSL/TLS termination                                   │
│ - Gzip compression                                      │
│ - Static file serving                                   │
│ - Load balancing                                        │
└──────────────┬──────────────────────────────────────────┘
               │
    ┌──────────┼──────────┐
    ↓          ↓          ↓
┌───────┐  ┌───────┐  ┌───────┐
│ Gunicorn  Gunicorn    Gunicorn │  (x4 workers each)
│  :8000 │  :8000 │  :8000 │
│ Django   Django    Django │
└───┬────┘  └───┬────┘  └───┬────┘
    │          │          │
    └──────────┼──────────┘
               │
    ┌──────────┼──────────────────┐
    ↓          ↓                  ↓
┌──────────┐ ┌────────┐ ┌────────────┐
│PostgreSQL│ │ Redis  │ │  Celery    │
│          │ │        │ │  Workers   │
│ - Users  │ │- Cache │ │- Send Mail │
│ - Projects─ |- Sessions- │- Generate │
│ - Issues │ │- Queues│ │  Reports   │
└──────────┘ └────────┘ └────────────┘
```

---

## 📚 Дальше

- 🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE_FULL.md) - деплой на production
- 📈 [SCALING_GUIDE.md](SCALING_GUIDE_FULL.md) - масштабирование
- 📡 [API_REFERENCE.md](API_REFERENCE_FULL.md) - справочник API

---

🏛️ **Успешной разработки!**
