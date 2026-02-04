# 📡 API_REFERENCE - Справочник REST API

> Полный справочник всех REST endpoints бэкенда BugTracker

---

## 📚 Содержание

1. [Проекты (Projects)](#проекты-projects)
2. [Задачи (Issues)](#задачи-issues)
3. [Аутентификация (Auth)](#аутентификация-auth)
4. [Ошибки](#ошибки)
5. [Примеры](#примеры)
6. [Фильтрация и поиск](#фильтрация-и-поиск)

---

## 🔧 Базовая информация

**Базовый URL:** `http://localhost:8000/api/`

**Версия API:** 1.0

**Формат данных:** JSON

**CORS:** Включен для `http://localhost:5173` (Vite dev сервер)

**Content-Type:** `application/json`

---

## 🏗️ Проекты (Projects)

### GET /projects/ - Получить список проектов

**Описание:** Получить все проекты текущего пользователя

**Метод:** `GET`

**URL:** `/projects/`

**Параметры (Query):**

- `search` (строка) - поиск по названию или описанию
- `page` (число) - номер страницы (по умолчанию 1)
- `page_size` (число) - элементов на странице (по умолчанию 10)
- `ordering` (строка) - сортировка: `name`, `-name`, `-created_at`, `created_at`

**Запрос:**

```bash
GET /api/projects/
GET /api/projects/?search=Blog
GET /api/projects/?page=2&page_size=20
GET /api/projects/?ordering=-created_at
```

**Ответ (200 OK):**

```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Blog Platform",
      "description": "Система управления блогом",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T15:45:00Z",
      "issues_count": 12,
      "owner": 1
    },
    {
      "id": 2,
      "name": "E-commerce",
      "description": "Интернет-магазин",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-18T12:30:00Z",
      "issues_count": 5,
      "owner": 1
    }
  ]
}
```

---

### POST /projects/ - Создать новый проект

**Описание:** Создать новый проект

**Метод:** `POST`

**URL:** `/projects/`

**Тело запроса:**

```json
{
  "name": "Новый проект",
  "description": "Описание проекта"
}
```

**Запрос:**

```bash
curl -X POST http://localhost:8000/api/projects/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Новый проект",
    "description": "Описание"
  }'
```

**Ответ (201 Created):**

```json
{
  "id": 3,
  "name": "Новый проект",
  "description": "Описание",
  "created_at": "2024-01-21T10:00:00Z",
  "updated_at": "2024-01-21T10:00:00Z",
  "issues_count": 0,
  "owner": 1
}
```

**Ошибки:**

- `400 Bad Request` - если name пуст или очень длинный

---

### GET /projects/{id}/ - Получить проект по ID

**Описание:** Получить подробную информацию о проекте

**Метод:** `GET`

**URL:** `/projects/{id}/`

**Параметры:**

- `id` (число) - ID проекта

**Запрос:**

```bash
GET /api/projects/1/
```

**Ответ (200 OK):**

```json
{
  "id": 1,
  "name": "Blog Platform",
  "description": "Система управления блогом",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z",
  "issues_count": 12,
  "owner": 1
}
```

**Ошибки:**

- `404 Not Found` - если проект не найден

---

### PUT /projects/{id}/ - Обновить проект

**Описание:** Полное обновление проекта (требует все поля)

**Метод:** `PUT`

**URL:** `/projects/{id}/`

**Тело запроса:**

```json
{
  "name": "Новое название",
  "description": "Новое описание"
}
```

**Запрос:**

```bash
curl -X PUT http://localhost:8000/api/projects/1/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Новое название",
    "description": "Новое описание"
  }'
```

**Ответ (200 OK):**

```json
{
  "id": 1,
  "name": "Новое название",
  "description": "Новое описание",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-21T11:00:00Z",
  "issues_count": 12,
  "owner": 1
}
```

---

### PATCH /projects/{id}/ - Частичное обновление проекта

**Описание:** Частичное обновление проекта (только нужные поля)

**Метод:** `PATCH`

**URL:** `/projects/{id}/`

**Тело запроса:**

```json
{
  "name": "Новое название"
}
```

**Запрос:**

```bash
curl -X PATCH http://localhost:8000/api/projects/1/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Новое название"}'
```

**Ответ (200 OK):**

```json
{
  "id": 1,
  "name": "Новое название",
  "description": "Система управления блогом",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-21T11:05:00Z",
  "issues_count": 12,
  "owner": 1
}
```

---

### DELETE /projects/{id}/ - Удалить проект

**Описание:** Удалить проект (вместе со всеми задачами)

**Метод:** `DELETE`

**URL:** `/projects/{id}/`

**Запрос:**

```bash
curl -X DELETE http://localhost:8000/api/projects/1/
```

**Ответ (204 No Content):**
Тело ответа пусто, только статус 204

**⚠️ Внимание:** Это действие необратимо!

---

## 📝 Задачи (Issues)

### GET /issues/ - Получить список всех задач

**Описание:** Получить все задачи (опционально фильтровать по проекту)

**Метод:** `GET`

**URL:** `/issues/`

**Параметры (Query):**

- `project` (число) - фильтр по проекту (ID)
- `status` (строка) - фильтр по статусу: `open`, `in_progress`, `done`, `cancelled`
- `priority` (строка) - фильтр по приоритету: `low`, `medium`, `high`
- `search` (строка) - поиск по названию
- `page` (число) - номер страницы (по умолчанию 1)
- `page_size` (число) - элементов на странице (по умолчанию 10)
- `ordering` (строка) - сортировка: `title`, `-title`, `-created_at`, `created_at`, `-priority`

**Запрос:**

```bash
GET /api/issues/
GET /api/issues/?project=1
GET /api/issues/?status=open&priority=high
GET /api/issues/?search=login&project=1
GET /api/issues/?project=1&ordering=-created_at
```

**Ответ (200 OK):**

```json
{
  "count": 12,
  "next": "http://localhost:8000/api/issues/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Исправить багу с логином",
      "description": "Пользователи не могут войти через OAuth",
      "status": "open",
      "priority": "high",
      "project": 1,
      "created_at": "2024-01-18T14:20:00Z",
      "updated_at": "2024-01-19T10:30:00Z"
    },
    {
      "id": 2,
      "title": "Оптимизировать запросы",
      "description": "Страница загружается долго",
      "status": "in_progress",
      "priority": "medium",
      "project": 1,
      "created_at": "2024-01-17T09:15:00Z",
      "updated_at": "2024-01-20T11:45:00Z"
    }
  ]
}
```

---

### POST /issues/ - Создать новую задачу

**Описание:** Создать новую задачу в проекте

**Метод:** `POST`

**URL:** `/issues/`

**Тело запроса:**

```json
{
  "title": "Название задачи",
  "description": "Подробное описание",
  "project": 1,
  "status": "open",
  "priority": "medium"
}
```

**Запрос:**

```bash
curl -X POST http://localhost:8000/api/issues/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Исправить баг с картинками",
    "description": "Картинки не загружаются в Safari",
    "project": 1,
    "status": "open",
    "priority": "high"
  }'
```

**Ответ (201 Created):**

```json
{
  "id": 10,
  "title": "Исправить баг с картинками",
  "description": "Картинки не загружаются в Safari",
  "status": "open",
  "priority": "high",
  "project": 1,
  "created_at": "2024-01-21T09:00:00Z",
  "updated_at": "2024-01-21T09:00:00Z"
}
```

**Обязательные поля:** `title`, `project`

**Значения по умолчанию:**

- `status` = "open"
- `priority` = "medium"

---

### GET /issues/{id}/ - Получить задачу по ID

**Описание:** Получить подробную информацию о задаче

**Метод:** `GET`

**URL:** `/issues/{id}/`

**Параметры:**

- `id` (число) - ID задачи

**Запрос:**

```bash
GET /api/issues/1/
```

**Ответ (200 OK):**

```json
{
  "id": 1,
  "title": "Исправить багу с логином",
  "description": "Пользователи не могут войти через OAuth",
  "status": "open",
  "priority": "high",
  "project": 1,
  "created_at": "2024-01-18T14:20:00Z",
  "updated_at": "2024-01-19T10:30:00Z"
}
```

---

### PUT /issues/{id}/ - Полное обновление задачи

**Описание:** Полное обновление задачи

**Метод:** `PUT`

**URL:** `/issues/{id}/`

**Тело запроса:**

```json
{
  "title": "Новое название",
  "description": "Новое описание",
  "status": "in_progress",
  "priority": "high",
  "project": 1
}
```

**Запрос:**

```bash
curl -X PUT http://localhost:8000/api/issues/1/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Новое название",
    "description": "Новое описание",
    "status": "in_progress",
    "priority": "high",
    "project": 1
  }'
```

**Ответ (200 OK):**

```json
{
  "id": 1,
  "title": "Новое название",
  "description": "Новое описание",
  "status": "in_progress",
  "priority": "high",
  "project": 1,
  "created_at": "2024-01-18T14:20:00Z",
  "updated_at": "2024-01-21T10:00:00Z"
}
```

---

### PATCH /issues/{id}/ - Частичное обновление задачи

**Описание:** Частичное обновление задачи

**Метод:** `PATCH`

**URL:** `/issues/{id}/`

**Тело запроса:**

```json
{
  "status": "done",
  "priority": "low"
}
```

**Запрос:**

```bash
curl -X PATCH http://localhost:8000/api/issues/1/ \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

**Ответ (200 OK):**

```json
{
  "id": 1,
  "title": "Исправить багу с логином",
  "description": "Пользователи не могут войти через OAuth",
  "status": "done",
  "priority": "high",
  "project": 1,
  "created_at": "2024-01-18T14:20:00Z",
  "updated_at": "2024-01-21T10:05:00Z"
}
```

---

### DELETE /issues/{id}/ - Удалить задачу

**Описание:** Удалить задачу

**Метод:** `DELETE`

**URL:** `/issues/{id}/`

**Запрос:**

```bash
curl -X DELETE http://localhost:8000/api/issues/1/
```

**Ответ (204 No Content):**
Тело ответа пусто, только статус 204

---

## 🔐 Аутентификация (Auth)

### GET /auth/me/ - Получить текущего пользователя

**Описание:** Получить информацию о текущем пользователе

**Метод:** `GET`

**URL:** `/auth/me/`

**Требует:** Сессия или токен

**Запрос:**

```bash
GET /api/auth/me/
```

**Ответ (200 OK):**

```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_staff": false,
  "date_joined": "2024-01-01T10:00:00Z"
}
```

**Ошибки:**

- `401 Unauthorized` - если не авторизирован

---

### POST /auth/login/ - Вход (Django сессия)

**Описание:** Вход по username и пароль (сессионная аутентификация)

**Метод:** `POST`

**URL:** `/auth/login/`

**Тело запроса:**

```json
{
  "username": "john_doe",
  "password": "secure_password"
}
```

**Запрос:**

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "secure_password"
  }' \
  -c cookies.txt
```

**Ответ (200 OK):**

```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Примечание:** Кука сеанса автоматически сохраняется в браузере

---

### POST /auth/logout/ - Выход

**Описание:** Выход из аккаунта

**Метод:** `POST`

**URL:** `/auth/logout/`

**Запрос:**

```bash
curl -X POST http://localhost:8000/api/auth/logout/
```

**Ответ (200 OK):**

```json
{
  "detail": "Успешно вышли из системы"
}
```

---

## ❌ Ошибки

### Стандартные коды ошибок

| Код   | Описание            | Пример                                                             |
| ----- | ------------------- | ------------------------------------------------------------------ |
| `400` | Некорректный запрос | `{"name": ["This field is required."]}`                            |
| `401` | Не авторизирован    | `{"detail": "Authentication credentials were not provided."}`      |
| `403` | Доступ запрещен     | `{"detail": "You do not have permission to perform this action."}` |
| `404` | Не найдено          | `{"detail": "Not found."}`                                         |
| `500` | Ошибка сервера      | `{"detail": "Internal server error."}`                             |

### Пример ошибки валидации (400)

```json
{
  "title": ["This field is required."],
  "project": ["Invalid pk \"999\" - object does not exist."]
}
```

### Пример ошибки доступа (403)

```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

## 📂 Фильтрация и поиск

### Фильтрация по полям

```bash
# Проекты по названию
GET /api/projects/?search=Blog

# Задачи по проекту
GET /api/issues/?project=1

# Задачи по статусу
GET /api/issues/?status=open

# Задачи по приоритету
GET /api/issues/?priority=high

# Комбинированная фильтрация
GET /api/issues/?project=1&status=open&priority=high
```

### Поиск (Search)

```bash
# Поиск проектов по названию/описанию
GET /api/projects/?search=platform

# Поиск задач по названию
GET /api/issues/?search=login+fix
```

### Сортировка (Ordering)

```bash
# Сортировка по названию (A-Z)
GET /api/projects/?ordering=name

# Сортировка по названию (Z-A)
GET /api/projects/?ordering=-name

# Сортировка по дате создания (новые первыми)
GET /api/projects/?ordering=-created_at

# Сортировка по приоритету (высокий первый)
GET /api/issues/?ordering=-priority
```

### Пагинация

```bash
# 1-я страница, 10 элементов
GET /api/projects/?page=1&page_size=10

# 2-я страница, 20 элементов
GET /api/issues/?page=2&page_size=20
```

---

## 💡 Примеры использования

### Пример 1: Получить все открытые задачи высокого приоритета в проекте

```bash
curl http://localhost:8000/api/issues/?project=1&status=open&priority=high
```

**Результат:**

```json
{
  "count": 3,
  "results": [
    { "id": 1, "title": "Bug 1", "status": "open", "priority": "high" },
    { "id": 5, "title": "Bug 2", "status": "open", "priority": "high" },
    { "id": 8, "title": "Bug 3", "status": "open", "priority": "high" }
  ]
}
```

---

### Пример 2: Создать проект и добавить в него задачу

```typescript
// 1. Создать проект
const projectRes = await fetch("/api/projects/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Mobile App",
    description: "iOS and Android app",
  }),
});
const project = await projectRes.json();
console.log(project.id); // 5

// 2. Создать задачу в этом проекте
const issueRes = await fetch("/api/issues/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Setup CI/CD",
    description: "Configure GitHub Actions",
    project: project.id,
    priority: "high",
  }),
});
const issue = await issueRes.json();
console.log(issue.id); // 42
```

---

### Пример 3: Изменить статус задачи

```typescript
const issueId = 1;

// PATCH - изменить только статус
const res = await fetch(`/api/issues/${issueId}/`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "done" }),
});
const issue = await res.json();
console.log(issue.status); // "done"
```

---

### Пример 4: Поиск задач с фильтрацией

```typescript
const projectId = 1;

// Получить все открытые задачи, сортировать по приоритету
const res = await fetch(
  `/api/issues/?project=${projectId}&status=open&ordering=-priority`,
);
const data = await res.json();

data.results.forEach((issue) => {
  console.log(`[${issue.priority}] ${issue.title}`);
});
// [high] Fix login bug
// [medium] Optimize database
// [low] Update documentation
```

---

### Пример 5: Обработка ошибок

```typescript
async function createIssue(data) {
  try {
    const res = await fetch("/api/issues/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Validation errors:", error);
      // {"title": ["This field is required."]}
      return null;
    }

    const issue = await res.json();
    return issue;
  } catch (err) {
    console.error("Network error:", err);
    return null;
  }
}
```

---

## 📖 Дальше

→ Используйте `src/api.ts` для упрощённого доступа к API

```typescript
import { api } from "./api";

// Вместо fetch
const projects = await api.getProjects();
const issue = await api.updateIssue(1, { status: "done" });
```

🚀 **Happy coding!**
