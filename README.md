# 🐛 BugTracker - Полнофункциональный трекер ошибок

> Система управления проектами и отслеживания ошибок (issues) с современным фронтендом и масштабируемым бэкендом

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![Django](https://img.shields.io/badge/Django-5.2-darkgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📚 Документация (Quick Links)

### 🚀 Для новичков
- **[QUICK_START_FULL.md](QUICK_START_FULL.md)** - Запуск за 5 минут (бэкенд + фронтенд)
- **[FRONTEND_QUICK_START.md](FRONTEND_QUICK_START.md)** - Только фронтенд (если бэкенд уже запущен)

### 👨‍💻 Для разработчиков
- **[DEVELOPMENT_GUIDE_FULL.md](DEVELOPMENT_GUIDE_FULL.md)** - Полный гайд архитектуры и разработки
- **[COMPONENTS_REFERENCE_FULL.md](COMPONENTS_REFERENCE_FULL.md)** - Справочник всех 25+ UI компонентов
- **[API_REFERENCE_FULL.md](API_REFERENCE_FULL.md)** - REST API endpoints с примерами

### 🏗️ Для DevOps/Production
- **[DEPLOYMENT_GUIDE_FULL.md](DEPLOYMENT_GUIDE_FULL.md)** - Полный гайд production деплоя
- **[ARCHITECTURE_FULL.md](ARCHITECTURE_FULL.md)** - Архитектура системы с диаграммами
- **[SCALING_GUIDE_FULL.md](SCALING_GUIDE_FULL.md)** - 6-уровневое масштабирование

---

## 📊 Матрица документации - Кто читает что?

| Роль | Начало | Полезно | Углубление |
|------|--------|---------|-----------|
| **🎓 Новичок** | QUICK_START | README (этот файл) | DEVELOPMENT_GUIDE |
| **👨‍💻 Frontend** | FRONTEND_QUICK_START | COMPONENTS_REFERENCE | DEVELOPMENT_GUIDE |
| **🔙 Backend** | QUICK_START | API_REFERENCE | DEVELOPMENT_GUIDE |
| **🏗️ DevOps** | DEPLOYMENT_GUIDE | ARCHITECTURE | SCALING_GUIDE |
| **📈 Scalability** | SCALING_GUIDE | ARCHITECTURE | DEPLOYMENT_GUIDE |

---

## 🎯 Что это?

**BugTracker** — веб-приложение для управления проектами и отслеживания ошибок.

### Основные возможности

- ✅ Управление проектами (создание, редактирование, удаление)
- ✅ Управление задачами/ошибками (CRUD операции)
- ✅ Фильтрация по статусу, приоритету, дате
- ✅ Полнотекстовый поиск
- ✅ Система ролей и прав доступа
- ✅ Асинхронная обработка (email, отчёты)
- ✅ Современный интерактивный интерфейс
- ✅ REST API
- ✅ Production-ready (Docker, Nginx, PostgreSQL)

---

## 🛠️ Стек технологий

### Бэкенд

```
Django 5.2 + DRF 3.15
├── PostgreSQL 15 (База данных)
├── Redis 7 (Кэш + сессии)
├── Celery 5.4 (Асинхронные задачи)
├── Gunicorn 23.0 (WSGI сервер)
└── Nginx (Reverse proxy)
```

### Фронтенд

```
Vite 7.1 + TypeScript 5.9
├── Tailwind CSS 4.1 (Стили)
├── DaisyUI 5.3 (Pre-built компоненты)
└── h() функция (Hyperscript вместо JSX)
```

---

## 📁 Структура проекта

```
bugtracker/
├── 📄 manage.py                    # Django manage команды
├── 🔧 bugtracker/
│   ├── settings.py                # Django настройки
│   ├── urls.py                    # URL маршруты
│   ├── wsgi.py                    # WSGI приложение
│   └── asgi.py                    # ASGI приложение
├── 🎫 issues/                     # Django приложение
│   ├── models.py                  # User, Project, Issue модели
│   ├── serializers.py             # DRF сериализаторы
│   ├── views_api.py               # REST API views
│   ├── views_auth.py              # Аутентификация
│   ├── views.py                   # HTML views (опционально)
│   ├── urls.py                    # Django URLs
│   └── migrations/                # БД миграции
├── 🎨 frontend/
│   ├── index.html                 # HTML (Vite template)
│   ├── src/
│   │   ├── main.ts                # Точка входа
│   │   ├── style.css              # Глобальные стили
│   │   ├── components.ts          # UI компоненты (25+)
│   │   ├── api.ts                 # API клиент
│   │   └── pages/                 # Страницы
│   ├── vite.config.ts             # Vite конфиг
│   ├── tsconfig.json              # TypeScript конфиг
│   └── package.json               # npm зависимости
├── 📚 Документация
│   ├── README.md                  # ✨ ВЫ ЗДЕСЬ
│   ├── QUICK_START_FULL.md        # Быстрый старт (5 мин)
│   ├── FRONTEND_QUICK_START.md    # Только фронтенд
│   ├── DEVELOPMENT_GUIDE_FULL.md  # Архитектура и разработка
│   ├── COMPONENTS_REFERENCE_FULL.md # Справочник компонентов
│   ├── API_REFERENCE_FULL.md      # REST API endpoints
│   ├── DEPLOYMENT_GUIDE_FULL.md   # Production деплой
│   ├── ARCHITECTURE_FULL.md       # Архитектура системы
│   └── SCALING_GUIDE_FULL.md      # Масштабирование
└── 🐳 Docker
    ├── Dockerfile
    ├── docker-compose.yml
    ├── nginx.conf
    └── .env.example
```

---

## 🚀 Быстрый старт

### Вариант 1: Полный (бэкенд + фронтенд) - 5 минут

**На Windows с батником:**

```bash
cd c:\Bag
START_APP.bat
```

**На Linux/Mac:**

```bash
cd /path/to/bugtracker
bash START_APP.sh
```

**Вручную (Python + Node):**

```bash
# Терминал 1: Бэкенд
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate на Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Терминал 2: Фронтенд
cd frontend
npm install
npm run dev

# Открыть в браузере
http://localhost:5173
```

### Вариант 2: С Docker

```bash
docker-compose up
# http://localhost (за Nginx)
```

### Проверить работу

```bash
# API доступен
curl http://localhost:8000/api/projects/

# Админка
http://localhost:8000/admin/
# username: admin, password: admin
```

---

## 📖 Документация по разделам

### 🎓 Новичкам

Начните с **[QUICK_START_FULL.md](QUICK_START_FULL.md)** — это займёт 5 минут!

Затем прочитайте этот файл (README) для общего понимания.

### 👨‍💻 Фронтенд разработчикам

1. Запустите **[FRONTEND_QUICK_START.md](FRONTEND_QUICK_START.md)**
2. Используйте **[COMPONENTS_REFERENCE_FULL.md](COMPONENTS_REFERENCE_FULL.md)** как справочник
3. Углубитесь в **[DEVELOPMENT_GUIDE_FULL.md](DEVELOPMENT_GUIDE_FULL.md)**

**Важно:** Компоненты используют функцию `h()` вместо JSX для создания виртуального DOM.

### 🔙 Бэкенд разработчикам

1. Запустите **[QUICK_START_FULL.md](QUICK_START_FULL.md)**
2. Используйте **[API_REFERENCE_FULL.md](API_REFERENCE_FULL.md)** для API endpoints
3. Изучите **[DEVELOPMENT_GUIDE_FULL.md](DEVELOPMENT_GUIDE_FULL.md)** для архитектуры

**Архитектура:** Django MVP (Model → Serializer → ViewSet → Response)

### 🏗️ DevOps/Production

1. Прочитайте **[DEPLOYMENT_GUIDE_FULL.md](DEPLOYMENT_GUIDE_FULL.md)** (Docker, Nginx, SSL)
2. Изучите **[ARCHITECTURE_FULL.md](ARCHITECTURE_FULL.md)** (система компонентов)
3. При необходимости масштабирования → **[SCALING_GUIDE_FULL.md](SCALING_GUIDE_FULL.md)**

---

## 🔗 API Endpoints (краткая справка)

### Projects (Проекты)

```bash
GET    /api/projects/              # Список проектов
POST   /api/projects/              # Создать проект
GET    /api/projects/{id}/         # Получить проект
PUT    /api/projects/{id}/         # Обновить проект
DELETE /api/projects/{id}/         # Удалить проект
```

### Issues (Задачи)

```bash
GET    /api/issues/                # Список задач
POST   /api/issues/                # Создать задачу
GET    /api/issues/{id}/           # Получить задачу
PATCH  /api/issues/{id}/           # Обновить задачу
DELETE /api/issues/{id}/           # Удалить задачу
```

### Auth (Аутентификация)

```bash
GET    /api/auth/me/               # Текущий пользователь
POST   /api/auth/login/            # Вход
POST   /api/auth/logout/           # Выход
```

**📖 Полный справочник:** [API_REFERENCE_FULL.md](API_REFERENCE_FULL.md)

---

## 🎨 Компоненты фронтенда (краткая справка)

### Базовые компоненты

```typescript
import { Button, PrimaryButton, Card, Container, Grid } from './components'

// Кнопка
Button({ children: 'Текст', onClick: handler })

// Карточка
Card({}, 'Заголовок', h('p', {}, 'Содержимое'))

// Сетка 3 колонки
Grid({ columns: 3 }, Card({}), Card({}), Card({}))
```

### Компоненты форм

```typescript
import { Form, FormGroup, Label, Input, Textarea, Select } from './components'

// Текстовое поле
Input({ name: 'title', placeholder: 'Название' })

// Выпадающее меню
Select({ name: 'priority', options: [
  { value: 'low', label: 'Низкий' },
  { value: 'high', label: 'Высокий' }
]})

// Форма с отправкой
Form({ onSubmit: (e) => createProject(e) },
  FormGroup({}, Label({}, 'Название'), Input({ name: 'name' })),
  PrimaryButton({ children: 'Создать', type: 'submit' })
)
```

### Статус и приоритет бейджи

```typescript
import { StatusBadge, PriorityBadge } from './components'

StatusBadge('open')       // 🕐 В работе
StatusBadge('done')       // ✅ Готово

PriorityBadge('high')     // ⬆️ Высокий
PriorityBadge('low')      // ⬇️ Низкий
```

**📖 Полный справочник:** [COMPONENTS_REFERENCE_FULL.md](COMPONENTS_REFERENCE_FULL.md)

---

## 🏛️ Архитектура (краткая справка)

### Слои приложения

```
┌─────────────────────────────┐
│    Браузер (Vite + TS)      │
│  UI компоненты h() функциями│
└────────────┬────────────────┘
             │ HTTP GET/POST
             ↓
┌─────────────────────────────┐
│  Django REST Framework API  │
│  ViewSet → Serializer       │
└────────────┬────────────────┘
             │ ORM
             ↓
┌─────────────────────────────┐
│   Django ORM (Models)       │
│  User, Project, Issue       │
└────────────┬────────────────┘
             │ SQL
             ↓
┌─────────────────────────────┐
│    PostgreSQL Database      │
│  Индексы, Транзакции       │
└─────────────────────────────┘
```

### Асинхронная обработка

```
API Request → Gunicorn Worker (быстро!)
  ↓
Создать объект в БД
  ↓
Запустить Celery Task асинхронно:
  celery.send_email.delay(issue_id)
  ↓
Worker отключается, берёт следующий запрос
  ↓
Celery Worker обрабатывает email в фоне
```

**📖 Полная архитектура:** [ARCHITECTURE_FULL.md](ARCHITECTURE_FULL.md)

---

## 📈 Масштабирование

БugTracker готов к масштабированию! 6-уровневая стратегия:

1. **Оптимизация кода** (select_related, только нужные поля)
2. **Кэширование** (Redis, 5 минут TTL)
3. **Оптимизация БД** (индексы, партиционирование)
4. **Асинхронная обработка** (Celery, очереди)
5. **Распределённые системы** (Load balancing, replicas)
6. **Микросервисы** (отдельные сервисы для Projects, Issues, Notifications)

Может обслуживать **100M+ пользователей** с правильной конфигурацией.

**📖 Полный гайд:** [SCALING_GUIDE_FULL.md](SCALING_GUIDE_FULL.md)

---

## 🚀 Production деплой

### С Docker (рекомендуется)

```bash
# Скопировать и настроить
cp .env.example .env
# Отредактировать .env

# Запустить
docker-compose -f docker-compose.yml up -d

# Миграции
docker-compose exec web python manage.py migrate

# Суперпользователь
docker-compose exec web python manage.py createsuperuser

# Открыть
https://yourdomain.com
```

### Без Docker

```bash
# Python зависимости
pip install -r requirements.txt

# Миграции БД
python manage.py migrate

# Статические файлы
python manage.py collectstatic

# Gunicorn
gunicorn bugtracker.wsgi:application --bind 0.0.0.0:8000

# Nginx конфиг (см. DEPLOYMENT_GUIDE)
sudo systemctl restart nginx

# Celery
celery -A bugtracker worker

# Celery Beat
celery -A bugtracker beat
```

**📖 Полный гайд:** [DEPLOYMENT_GUIDE_FULL.md](DEPLOYMENT_GUIDE_FULL.md)

---

## 🧪 Тестирование

### API тесты

```bash
# С pytest
pytest issues/tests.py

# С Django test runner
python manage.py test issues
```

### Фронтенд тесты

```bash
cd frontend
npm test
```

### Интеграционные тесты

```bash
# Запустить приложение
docker-compose up

# Проверить API
curl http://localhost:8000/api/projects/

# Проверить фронтенд
curl http://localhost/
```

---

## 🔐 Безопасность

✅ **Включены:**
- Django CSRF protection
- SQL injection protection (ORM)
- XSS protection (автоматическое экранирование)
- Secure cookies (HttpOnly, Secure, SameSite)
- Password hashing (PBKDF2 + SHA256)
- HTTPS/TLS
- Rate limiting (на Nginx)

⚙️ **Настроить в production:**
```python
# settings.py
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com']
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

---

## 🆘 Проблемы и решения

### "disallowed host"

```python
# settings.py - добавить домен
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
```

### Статические файлы не загружаются

```bash
# Пересобрать статику
python manage.py collectstatic --noinput --clear

# Проверить Nginx логи
sudo tail -f /var/log/nginx/error.log
```

### API недоступен

```bash
# Проверить Gunicorn
curl http://localhost:8000/api/projects/

# Проверить Nginx маршруты
sudo nginx -t

# Логи
docker logs bugtracker_web
```

### Celery не отправляет email

```bash
# Проверить worker
celery -A bugtracker worker -l debug

# Проверить Redis
redis-cli ping
```

---

## 📞 Контакты / Support

- 📧 Email: support@bugtracker.dev
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

## 📄 Лицензия

MIT License - смотрите LICENSE файл

---

## 🎓 Примеры использования

### Получить все проекты пользователя

```typescript
const projects = await api.getProjects()
console.log(projects.results)
// [{id: 1, name: "Blog", issues_count: 5}, ...]
```

### Создать новую задачу

```typescript
const issue = await api.createIssue({
  title: "Fix login bug",
  description: "Users can't login with OAuth",
  project: 1,
  priority: "high"
})
console.log(issue.id)  // 42
```

### Обновить статус задачи

```typescript
const updated = await api.updateIssue(42, {
  status: "done"
})
console.log(updated.status)  // "done"
```

### Фильтровать задачи

```bash
# Все открытые задачи высокого приоритета в проекте 1
GET /api/issues/?project=1&status=open&priority=high

# Результат:
# {
#   "count": 3,
#   "results": [
#     {"id": 1, "title": "Bug 1", ...},
#     {"id": 5, "title": "Bug 2", ...},
#     ...
#   ]
# }
```

---

## 📚 Дополнительные ресурсы

- [Django документация](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [TypeScript документация](https://www.typescriptlang.org/)
- [Vite документация](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI документация](https://daisyui.com/)

---

## 🚀 Готов к работе!

Выберите с чего начать:

1. **Я новичок** → [QUICK_START_FULL.md](QUICK_START_FULL.md) (5 минут)
2. **Я фронтенд** → [FRONTEND_QUICK_START.md](FRONTEND_QUICK_START.md)
3. **Я бэкенд** → [API_REFERENCE_FULL.md](API_REFERENCE_FULL.md)
4. **Я DevOps** → [DEPLOYMENT_GUIDE_FULL.md](DEPLOYMENT_GUIDE_FULL.md)
5. **Я хочу всё** → [DEVELOPMENT_GUIDE_FULL.md](DEVELOPMENT_GUIDE_FULL.md)

---

⭐ **Если нравится проект — поставьте звёздочку!**

💪 **Happy coding!**
