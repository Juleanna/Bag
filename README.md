# 🐞 BugTracker — Django + Vite + Tailwind

Современный баг‑трекер: Django + DRF на бэкенде, Vite + TypeScript + Tailwind + DaisyUI на фронтенде, интеграция через django‑vite. Ниже — подробная инструкция по установке, запуску (dev/prod) и использованию.

## 📚 Содержание
- [⚙️ Требования](#️-требования)
- [📦 Установка](#-установка)
- [🚀 Запуск в разработке](#-запуск-в-разработке)
- [🔑 Создание суперпользователя](#-создание-суперпользователя)
- [🧭 Первичное использование](#-первичное-использование)
- [🔌 REST API (кратко)](#-rest-api-кратко)
- [🏗️ Сборка и запуск в продакшене](#️-сборка-и-запуск-в-продакшене)
- [🩹 Частые проблемы](#-частые-проблемы)
- [🗂️ Полезные файлы проекта](#️-полезные-файлы-проекта)

## ⚙️ Требования
- Python 3.10+
- Node.js 18+ (рекомендуется 20/22) и npm
- Git (по желанию)
- ОС: Windows/macOS/Linux (инструкции для всех)

## 📦 Установка
1) Клонирование/переход в папку проекта
- Git: `git clone <repo-url> bugtracker && cd bugtracker`
- Либо просто откройте эту папку в терминале

2) Виртуальное окружение Python
- Windows PowerShell:
  - `py -3 -m venv .venv`
  - `.\\.venv\\Scripts\\Activate`
- macOS/Linux:
  - `python3 -m venv .venv`
  - `source .venv/bin/activate`

3) Установка бэкенд‑зависимостей
```
pip install django djangorestframework django-cors-headers django-environ django-vite whitenoise
```

4) Настройка переменных окружения
- Создайте файл `.env` в корне (рядом с `manage.py`):
```
SECRET_KEY=dev-secret-change-me
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
VITE_HOST=localhost
VITE_PORT=5173
```

5) Миграции базы данных
```
python manage.py migrate
```

6) Фронтенд‑зависимости
```
cd frontend
npm install
```

## 🚀 Запуск в разработке
- Терминал 1 (бэкенд):
```
python manage.py runserver
```
Откроется на http://127.0.0.1:8000

- Терминал 2 (фронтенд):
```
cd frontend
npm run dev
```
Dev‑сервер на http://127.0.0.1:5173

Примечания dev‑режима:
- Шаблон `templates/index.html` подключает `{% vite_hmr_client %}` и `{% vite_asset 'src/main.ts' %}`.
- Прокси `/api` → `http://localhost:8000` задан в `frontend/vite.config.ts`.

## 🔑 Создание суперпользователя
```
python manage.py createsuperuser
```
- Введите e‑mail/пароль. Запомните их для входа в админку.

## 🧭 Первичное использование
1) Войдите в админку: http://127.0.0.1:8000/admin/
2) Создайте Проект (и по желанию Лейблы).
3) Вернитесь на главную: http://127.0.0.1:8000/
4) Справа создайте Задачу (выберите проект, введите заголовок/описание).

Интерфейс:
- Слева — карточки проектов (с количеством задач), справа — форма создания и список задач.
- Стили: Tailwind + DaisyUI (аккуратные карточки/кнопки/бейджи).

Примечание безопасности:
- Создание задач требует сессию/CSRF. Если POST даёт 403/401 — авторизуйтесь в админке в той же вкладке браузера.

## 🔌 REST API (кратко)
База: `/api/`
- Проекты: `GET/POST /api/projects/`, `GET/PUT/PATCH/DELETE /api/projects/{id}/`
- Задачи: `GET/POST /api/issues/`, `GET/PUT/PATCH/DELETE /api/issues/{id}/`
- Комментарии: `GET/POST /api/comments/`, `GET/PUT/PATCH/DELETE /api/comments/{id}/`
- Лейблы: `GET/POST /api/labels/`, `GET/PUT/PATCH/DELETE /api/labels/{id}/`

Создание задач/комментариев использует текущего пользователя (`reporter/author`).

## 🏗️ Сборка и запуск в продакшене
1) Сборка фронтенда
```
cd frontend
npm run build
```
Артефакты появятся в `frontend/dist`.

2) Переменные окружения для продакшена (в `.env`):
```
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,127.0.0.1
SECRET_KEY=<надёжный_случайный_ключ>
```

3) Статика
- В проекте уже подключён WhiteNoise. В большинстве случаев достаточно сборки фронтенда и манифеста `frontend/dist/manifest.json`, с которым работает django‑vite.
- При необходимости можно собрать общую статику командой:
```
python manage.py collectstatic
```

4) Запуск сервера
- Простой вариант: `python manage.py runserver 0.0.0.0:8000`
- Боевой вариант: запустить через gunicorn/uvicorn за обратным прокси (nginx/traefik и т.п.).

## 🩹 Частые проблемы
- 🔒 403 CSRF при POST: войдите в `/admin/` (куки + CSRF окажутся в сессии), повторите действие.
- 🌐 CORS в dev: включен `CORS_ALLOW_ALL_ORIGINS=True`. В prod настройте дозволенные источники выборочно.
- 🛣️ Порт `5173` занят: поменяйте порт в `frontend/vite.config.ts` и `.env` (`VITE_PORT`), перезапустите Vite.
- 🖼️ Статика не грузится в prod: проверьте сборку фронта (`npm run build`), наличие `manifest.json` в `frontend/dist` и корректные пути в `settings.py` для django‑vite.

## 🗂️ Полезные файлы проекта
- Настройки Django: `bugtracker/settings.py`
- URL’ы (админка, API, главная): `bugtracker/urls.py`
- Шаблон с Vite: `templates/index.html`
- Модели: `issues/models.py`
- Сериализаторы: `issues/serializers.py`
- ViewSet’ы: `issues/views_api.py`
- Маршруты API: `issues/api_urls.py`
- Вход фронтенда: `frontend/src/main.ts`
- Стили (Tailwind/DaisyUI): `frontend/src/style.css`
- Конфиг Vite: `frontend/vite.config.ts`

---
💡 Идеи развития: канбан‑доска с drag&drop, фильтры/поиск, вложения, уведомления, роли и приглашения, тёмная тема через DaisyUI и переключатель.
