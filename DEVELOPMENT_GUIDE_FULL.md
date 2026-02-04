# 📖 DEVELOPMENT_GUIDE - Полный гайд разработчика

> Полное руководство по структуре, архитектуре и разработке на BugTracker

---

## 📚 Содержание

1. [Проект структура](#проект-структура)
2. [Бэкенд архитектура](#бэкенд-архитектура)
3. [Фронтенд архитектура](#фронтенд-архитектура)
4. [Разработка бэкенда](#разработка-бэкенда)
5. [Разработка фронтенда](#разработка-фронтенда)
6. [API интеграция](#api-интеграция)
7. [Тестирование](#тестирование)
8. [Best practices](#best-practices)

---

## 🗂️ Проект структура

### Полное дерево

```
BugTracker/
│
├── 📚 ДОКУМЕНТАЦИЯ
│   ├── README.md ...................... Главный индекс
│   ├── QUICK_START.md ................. Запуск за 5 мин
│   ├── QUICK_REFERENCE.md ............. Быстрые команды
│   ├── DEVELOPMENT_GUIDE.md ........... Этот файл
│   ├── COMPONENTS_REFERENCE.md ........ Компоненты
│   ├── API_REFERENCE.md ............... REST API
│   ├── DEPLOYMENT_GUIDE.md ............ Деплой
│   ├── SCALING_GUIDE.md ............... Масштабирование
│   ├── ARCHITECTURE.md ................ Архитектура
│   └── TROUBLESHOOTING.md ............. Решение проблем
│
├── 🔧 БЭКЕНД (Django)
│   ├── manage.py ...................... Django CLI
│   ├── requirements.txt ............... Python зависимости
│   ├── .env ........................... Переменные окружения
│   ├── db.sqlite3 ..................... База данных (dev)
│   │
│   ├── bugtracker/ (конфиг Django)
│   │   ├── __init__.py
│   │   ├── settings.py ................ Конфиг Django
│   │   ├── urls.py .................... Главные routes
│   │   ├── wsgi.py .................... Production entry
│   │   └── asgi.py .................... ASGI entry
│   │
│   ├── issues/ (главное приложение)
│   │   ├── models.py .................. Структура данных
│   │   ├── views.py ................... Обычные views
│   │   ├── views_api.py ............... REST API views
│   │   ├── serializers.py ............. Валидация/сериализация
│   │   ├── api_urls.py ................ API routes
│   │   ├── admin.py ................... Django admin
│   │   ├── apps.py
│   │   ├── tests.py ................... Тесты
│   │   └── migrations/ ................ История БД
│   │       ├── 0001_initial.py
│   │       ├── 0002_alter_issue_status.py
│   │       └── ...
│   │
│   └── static/ ........................ Статические файлы
│       └── admin/ (Django admin CSS/JS)
│
├── 🎨 ФРОНТЕНД (Vite)
│   ├── package.json ................... npm зависимости
│   ├── package-lock.json .............. Lock файл
│   ├── vite.config.ts ................. Vite конфиг
│   ├── tsconfig.json .................. TypeScript конфиг
│   ├── postcss.config.cjs ............. Tailwind конфиг
│   ├── index.html ..................... HTML точка входа
│   │
│   ├── src/
│   │   ├── main.ts .................... Главное приложение
│   │   ├── components.ts .............. 25+ компонентов
│   │   ├── api.ts ..................... API клиент
│   │   ├── style.css .................. Tailwind + DaisyUI
│   │   ├── counter.ts ................. Пример компонента
│   │   ├── typescript.svg ............. Иконка
│   │   └── [другие файлы]
│   │
│   ├── public/ ........................ Статические assets
│   ├── dist/ .......................... Собранное приложение
│   │
│   ├── node_modules/ .................. npm зависимости
│   └── README_FE.md ................... Фронтенд документация
│
├── 🐳 ИНФРАСТРУКТУРА
│   ├── docker-compose.yml ............. Контейнеры (Django, Nginx, Redis)
│   ├── Dockerfile ..................... Образ Django контейнера
│   ├── nginx.conf ..................... Web сервер конфиг
│   ├── deploy.sh ...................... Скрипт деплоя
│   │
│   └── venv/ .......................... Python виртуальное окружение
│       ├── Scripts/ (Windows) или bin/ (Mac/Linux)
│       ├── Lib/ (Windows) или lib/ (Mac/Linux)
│       └── ...
│
├── 📦 КОНФИГУРАЦИЯ
│   ├── .env ........................... Переменные (НЕ коммитить!)
│   ├── .env.example ................... Шаблон .env
│   ├── .gitignore ..................... Git игнор правила
│   │
│   └── .git/ .......................... Git история
│
└── 📄 ОСТАЛЬНОЕ
    ├── README.md ...................... Этот файл проекта
    ├── START_APP.bat .................. Скрипт запуска (Windows)
    └── START_APP.sh ................... Скрипт запуска (Unix)
```

---

## 🔧 Бэкенд архитектура

### Django MVP паттерн

```
HTTP Request
    ↓
urls.py (маршруты)
    ↓
views_api.py (логика)
    ↓
models.py (данные)
    ↓
serializers.py (валидация)
    ↓
models.py (сохранение)
    ↓
serializers.py (сериализация)
    ↓
HTTP Response (JSON)
```

### Основные компоненты

#### 1. Models (моделиБД)

**Файл:** `issues/models.py`

```python
# Структура таблиц
class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    owner = models.ForeignKey(User, ...)
    created_at = models.DateTimeField(auto_now_add=True)

class Issue(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    project = models.ForeignKey(Project, ...)
    status = models.CharField(choices=STATUS_CHOICES)
    priority = models.CharField(choices=PRIORITY_CHOICES)
    # ... и другие поля
```

#### 2. Serializers (валидация)

**Файл:** `issues/serializers.py`

```python
class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', ...]

class IssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['id', 'title', 'description', ...]
```

Сериализаторы:

- Валидируют входящие данные
- Преобразуют модели в JSON
- Проверяют типы и ограничения

#### 3. Views (логика)

**Файл:** `issues/views_api.py`

```python
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # GET /api/projects/ → список

    def create(self, request):
        # POST /api/projects/ → создать

    def retrieve(self, request, pk=None):
        # GET /api/projects/{id}/ → одна

    def update(self, request, pk=None):
        # PUT /api/projects/{id}/ → обновить

    def destroy(self, request, pk=None):
        # DELETE /api/projects/{id}/ → удалить
```

#### 4. URLs (маршруты)

**Файл:** `issues/api_urls.py`

```python
router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'issues', IssueViewSet)

urlpatterns = router.urls
# Автоматически создаёт:
# GET    /api/projects/
# POST   /api/projects/
# GET    /api/projects/{id}/
# PUT    /api/projects/{id}/
# DELETE /api/projects/{id}/
# И то же самое для issues
```

### Поток данных (пример создания проекта)

```
1. Браузер отправляет:
   POST /api/projects/
   Body: {"name": "Мой проект", "description": "..."}

2. Django маршрутизирует:
   → api_urls.py видит /api/projects/
   → ProjectViewSet.create() вызывается

3. View обрабатывает:
   → ProjectSerializer валидирует данные
   → Project.objects.create() сохраняет в БД
   → serializer.data преобразует в JSON

4. Браузер получает:
   Response 201 Created:
   {"id": 1, "name": "Мой проект", "description": "..."}
```

---

## 🎨 Фронтенд архитектура

### Компонентный подход

```
App (main.ts)
├── Navbar (навигация)
├── ProjectsPage
│   ├── PageHeader
│   ├── Grid
│   │   └── Card x N (проекты)
│   └── Modal (создание)
│       └── Form
└── IssuesPage
    ├── PageHeader
    ├── Grid
    │   └── Card x N (задачи)
    └── Modal (создание)
        └── Form
```

### Основные компоненты

#### 1. h() функция (JSX-подобно)

**Файл:** `src/components.ts`

```typescript
// JSX-подобный синтаксис без React
const button = h(
  "button",
  { class: "btn btn-primary", onClick: handler },
  "Текст кнопки",
);

// Результат: <button class="btn btn-primary">Текст кнопки</button>
```

#### 2. Компоненты (функции)

**Файл:** `src/components.ts`

```typescript
// Пример компонента Button
export function Button(props: ElementProps, ...children) {
  return h('button', {
    class: 'btn btn-ghost',
    ...props
  }, ...children)
}

// Использование
Button({ onClick: () => {...} }, 'Нажми меня')
```

#### 3. API клиент (типизированный)

**Файл:** `src/api.ts`

```typescript
class ApiClient {
  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`/api${endpoint}`);
    return res.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const res = await fetch(`/api${endpoint}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.json();
  }
}

// Использование
const projects = await api.get<Project[]>("/projects/");
```

#### 4. Главное приложение (логика)

**Файл:** `src/main.ts`

```typescript
// Состояние приложения
let projects: Project[] = [];
let issues: Issue[] = [];
let currentPage = "projects";

// Загрузка данных
async function loadProjects() {
  projects = await api.get<Project[]>("/projects/");
  render();
}

// Отрисовка UI
function render() {
  if (currentPage === "projects") {
    renderProjects();
  } else {
    renderIssues();
  }
}

// Инициализация
loadProjects();
```

### Поток данных (пример создания проекта)

```
1. Пользователь нажимает "Новый проект"
   ↓
2. Модальное окно открывается
   Form component показывается
   ↓
3. Пользователь заполняет и нажимает "Создать"
   ↓
4. createProject() вызывается
   api.post('/projects/', {name, description})
   ↓
5. Django обрабатывает запрос
   ↓
6. Ответ приходит в браузер
   showToast('Успешно!', 'success')
   loadProjects() перезагружает список
   ↓
7. render() обновляет UI
   Новый проект появляется в списке
```

---

## 🛠️ Разработка бэкенда

### Добавить новый endpoint

#### Шаг 1: Добавить модель (если нужна)

```python
# issues/models.py
class Comment(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

#### Шаг 2: Создать миграцию

```bash
python manage.py makemigrations
python manage.py migrate
```

#### Шаг 3: Добавить сериализатор

```python
# issues/serializers.py
class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'text', 'created_at']
```

#### Шаг 4: Добавить view

```python
# issues/views_api.py
class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
```

#### Шаг 5: Зарегистрировать route

```python
# issues/api_urls.py
router.register(r'comments', CommentViewSet)
```

### Результат:

```
GET    /api/comments/
POST   /api/comments/
GET    /api/comments/{id}/
PUT    /api/comments/{id}/
DELETE /api/comments/{id}/
```

### Полезные команды

```bash
# Создать новое приложение Django
python manage.py startapp app_name

# Создать superuser
python manage.py createsuperuser

# Запустить тесты
python manage.py test

# Включить SQL логирование
python manage.py runserver --sql-logging

# Django shell (интерактивный Python)
python manage.py shell
>>> from issues.models import Project
>>> Project.objects.all()
```

---

## 🎨 Разработка фронтенда

### Добавить новый компонент

```typescript
// src/components.ts

export function MyComponent(props: ElementProps, ...children) {
  return h(
    "div",
    { class: "my-component" },
    h("h2", {}, "Заголовок"),
    h("p", {}, "Содержимое"),
    ...children,
  );
}
```

### Использовать компонент

```typescript
// src/main.ts
import { MyComponent } from "./components";

const el = MyComponent({}, "Текст дочерний");
document.body.appendChild(el);
```

### Добавить стили

```css
/* src/style.css */
.my-component {
  @apply p-4 border rounded-lg shadow;
}

.my-component h2 {
  @apply font-bold text-lg mb-2;
}
```

### Полезные команды

```bash
cd frontend

# Разработка
npm run dev

# Сборка
npm run build

# Просмотр собранного
npm run preview

# Проверка кода
npm run lint

# Обновить зависимости
npm outdated
npm install [name]@latest
```

---

## 🔗 API интеграция

### Типобезопасные запросы

```typescript
// Определить тип
interface Project {
  id: number;
  name: string;
  description: string;
}

// Использовать с типом
const projects = await api.get<Project[]>("/projects/");

// IDE будет подсказывать поля:
projects.forEach((p) => {
  console.log(p.name); // ✅ OK
  console.log(p.unknown); // ❌ Ошибка типа!
});
```

### Обработка ошибок

```typescript
try {
  const project = await api.post('/projects/', {...})
  showToast('Успешно!', 'success')
} catch (error) {
  showToast('Ошибка!', 'error')
  console.error(error)
}
```

### Примеры запросов

```typescript
// Получить все проекты
const projects = await api.get("/projects/");

// Получить один проект
const project = await api.get("/projects/1/");

// Создать проект
const created = await api.post("/projects/", {
  name: "Новый проект",
  description: "Описание",
});

// Обновить проект
const updated = await api.put("/projects/1/", {
  name: "Обновлённое имя",
});

// Удалить проект
await api.delete("/projects/1/");
```

---

## 🧪 Тестирование

### Бэкенд (Django)

```bash
# Запустить все тесты
python manage.py test

# Запустить конкретный тест
python manage.py test issues.tests.ProjectTestCase

# С покрытием
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Пример теста

```python
# issues/tests.py
from django.test import TestCase
from .models import Project

class ProjectTestCase(TestCase):
    def setUp(self):
        Project.objects.create(
            name="Test Project",
            description="Desc"
        )

    def test_project_name(self):
        project = Project.objects.get(name="Test Project")
        self.assertEqual(project.description, "Desc")
```

### Фронтенд (ручное)

```typescript
// Открыть DevTools (F12) → Console
// Можно вводить команды:

// Проверить состояние
console.log(projects);
console.log(currentPage);

// Вызвать функцию
loadProjects();
render();

// Проверить API
fetch("/api/projects/")
  .then((r) => r.json())
  .then(console.log);
```

---

## ✅ Best practices

### Бэкенд

1. **Используйте миграции** - всегда через `makemigrations`
2. **Валидируйте в сериализаторе** - проверяйте данные
3. **Используйте permissions** - ограничивайте доступ
4. **Кэшируйте часто запрашиваемое** - Redis
5. **Логируйте ошибки** - для отладки production
6. **Пишите тесты** - каждый endpoint должен быть протестирован
7. **Документируйте API** - используйте docstrings

### Фронтенд

1. **Используйте TypeScript типы** - для безопасности
2. **Компонентизируйте код** - переиспользуйте компоненты
3. **Обрабатывайте ошибки** - всегда try/catch на API
4. **Показывайте loading state** - пока грузятся данные
5. **Используйте Toast для feedback** - уведомления пользователю
6. **Минимизируйте re-renders** - оптимизируйте производительность
7. **Тестируйте в DevTools** - Network, Console, Elements

---

## 🎓 Что изучать дальше?

### После этого гайда

1. Читайте **COMPONENTS_REFERENCE.md** - все компоненты
2. Читайте **API_REFERENCE.md** - все endpoints
3. Смотрите `issues/models.py` - структура данных
4. Смотрите `src/main.ts` - логика приложения

### Углубленное изучение

- Django документация: https://docs.djangoproject.com/
- DRF документация: https://www.django-rest-framework.org/
- Vite документация: https://vitejs.dev/
- TypeScript документация: https://www.typescriptlang.org/

---

## 📝 Конец гайда

Вы готовы разрабатывать полнофункциональное приложение!

**Дальше:**

- Начните добавлять функции
- Читайте исходный код
- Пишите тесты
- Деплойте на production!

🚀 **Happy coding!**
