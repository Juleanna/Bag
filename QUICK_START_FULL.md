# 🚀 QUICK START - Запуск за 5 минут

> **Включает:** Django бэкенд + Vite фронтенд + полную интеграцию

---

## ✅ Требования (проверьте перед началом)

```bash
# Проверить Python (нужен 3.10+)
python --version

# Проверить Node.js (нужен 18+)
node --version

# Проверить npm (должен быть установлен с Node.js)
npm --version
```

Если что-то не установлено: [Python](https://python.org) | [Node.js](https://nodejs.org)

---

## 📋 Вариант А: Быстрый старт на Windows (автоматический)

### ✨ Самый простой способ

**Просто запустите:**

```bash
c:\Bag\START_APP.bat
```

Выберите опцию в меню → приложение запустится автоматически!

---

## 🛠️ Вариант Б: Ручной запуск (все ОС)

### 📝 Этап 1: Настройка бэкенда (Django) - 2 минуты

**Шаг 1.1: Перейти в корневую папку**

```bash
cd c:\Bag
# Или: cd /path/to/Bag (на Mac/Linux)
```

**Шаг 1.2: Создать виртуальное окружение**

Windows PowerShell:

```powershell
py -3 -m venv venv
.\venv\Scripts\Activate
```

Mac/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

Вы должны увидеть `(venv)` слева в приглашении терминала.

**Шаг 1.3: Установить зависимости**

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Это установит Django, Django REST Framework, Tailwind, Celery и другие пакеты.

**Шаг 1.4: Применить миграции БД**

```bash
python manage.py migrate
```

Это создаст таблицы в базе данных SQLite.

**Шаг 1.5: Создать администратора (опционально)**

```bash
python manage.py createsuperuser
```

Введите логин и пароль для доступа к админ-панели на `http://localhost:8000/admin`.

**Шаг 1.6: Запустить бэкенд**

```bash
python manage.py runserver
```

Вы должны увидеть:

```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

✅ **Бэкенд запущен!** Оставьте этот терминал открытым.

---

### 🎨 Этап 2: Настройка фронтенда (Vite) - 3 минуты

**Откройте НОВЫЙ терминал** (не закрывайте предыдущий!) и выполните:

**Шаг 2.1: Перейти в папку фронтенда**

```bash
cd c:\Bag\frontend
# Или: cd /path/to/Bag/frontend (на Mac/Linux)
```

**Шаг 2.2: Установить зависимости**

```bash
npm install
```

Это установит Vite, Tailwind, TypeScript, DaisyUI и другие npm пакеты.

**Шаг 2.3: Запустить dev сервер**

```bash
npm run dev
```

Вы должны увидеть:

```
➜  Local:   http://localhost:5173/
➜  press h to show help
```

✅ **Фронтенд запущен!** Браузер откроется автоматически на `http://localhost:5173`.

---

## 🎉 Проверка: Приложение готово!

| Компонент      | URL                                 | Статус                            |
| -------------- | ----------------------------------- | --------------------------------- |
| **Приложение** | http://localhost:5173               | ✅ Должно открыться автоматически |
| **API**        | http://localhost:8000/api/projects/ | ✅ Должен быть JSON               |
| **Admin**      | http://localhost:8000/admin         | ✅ Форма входа                    |

Если видите приложение в браузере → **Всё работает!** 🎊

---

## 🧪 Быстрая проверка функций

### Создать проект

1. Нажмите **"➕ Новый проект"**
2. Введите название: `"Тестовый проект"`
3. Описание: `"Первая задача"`
4. Нажмите **"Создать"**
5. Проект появится в списке ✅

### Открыть проект и создать задачу

1. Кликните на карточку проекта
2. Нажмите **"➕ Новая задача"**
3. Название: `"Исправить баг №1"`
4. Приоритет: `"Высокий"`
5. Нажмите **"Создать"**
6. Задача появится в списке ✅

### Вернуться назад

Нажмите **"← Назад к проектам"** → вернётесь к списку ✅

---

## ⚡ Важные команды

### Разработка (во время работы)

```bash
# В любом терминале проверить логи Django
# (если запустили без --verbosity flag)
python manage.py runserver --verbosity 2

# В отдельном терминале: проверить все endpoints
curl http://localhost:8000/api/projects/

# В браузере: DevTools (F12)
# → Console tab для логов
# → Network tab для API запросов
# → Elements tab для инспекции HTML
```

### Сборка для production

```bash
# Фронтенд
cd c:\Bag\frontend
npm run build
# → dist/ готов к деплою

# Бэкенд (подготовка)
cd c:\Bag
python manage.py collectstatic --noinput
```

### Остановка

```bash
# Бэкенд: Ctrl+C в терминале
# Фронтенд: Ctrl+C в терминале
```

---

## 🐛 Типичные проблемы

### ❌ "Port 5173 already in use"

```bash
# Решение 1: Использовать другой порт
npm run dev -- --port 3000

# Решение 2: Убить процесс на порте 5173
# Windows PowerShell:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### ❌ "ModuleNotFoundError: No module named 'django'"

```bash
# Решение: Активировать виртуальное окружение
# Windows:
.\venv\Scripts\Activate

# Mac/Linux:
source venv/bin/activate
```

### ❌ "Cannot GET /api/projects/"

```bash
# Решение: Убедиться, что Django запущен
# В одном терминале должен быть:
python manage.py runserver
# → Starting development server at http://127.0.0.1:8000/
```

### ❌ Приложение грузит, но пусто

```bash
# Решение: Очистить кэш браузера
# Ctrl+Shift+Delete → очистить кэш/cookies → перезагрузить
```

### ❌ "Cannot find module 'vite'"

```bash
# Решение: Переустановить npm зависимости
cd c:\Bag\frontend
rm -r node_modules package-lock.json
npm install
npm run dev
```

### ❌ 404 на http://localhost:8000/api/

```bash
# Решение: Проверить, что Django запущен и миграции применены
python manage.py migrate
python manage.py runserver
```

---

## 📊 Что дальше?

### Для разработчика фронтенда

1. Прочитайте **COMPONENTS_REFERENCE.md** - как использовать компоненты
2. Откройте `frontend/src/components.ts` - изучите компоненты
3. Начните менять `frontend/src/main.ts` - добавьте новые страницы

### Для разработчика бэкенда

1. Прочитайте **API_REFERENCE.md** - endpoints и параметры
2. Откройте `issues/models.py` - структура данных
3. Откройте `issues/views_api.py` - логика API
4. Добавьте новые endpoints в `issues/api_urls.py`

### Для DevOps

1. Прочитайте **DEPLOYMENT_GUIDE.md** - как деплоить
2. Прочитайте **SCALING_GUIDE.md** - как масштабировать
3. Используйте `docker-compose.yml` для production

---

## 🔍 Полезные инструменты

### DevTools браузера (F12)

```
Console → логи приложения
Network → API запросы
Elements → инспекция HTML/CSS
Application → localStorage/cookies
```

### Django Shell (интерактивный Python)

```bash
python manage.py shell
>>> from issues.models import Project
>>> Project.objects.all()
[<Project: Project 1>, ...]
>>> exit()
```

### API тестирование (curl или Postman)

```bash
# Получить все проекты
curl http://localhost:8000/api/projects/

# Создать проект (нужен CSRF token)
curl -X POST http://localhost:8000/api/projects/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Desc"}'
```

---

## 📝 Конфигурация

### Django (.env файл)

```bash
# c:\Bag\.env (или .env.example как шаблон)

SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
DATABASE_URL=sqlite:///db.sqlite3
```

### Vite (vite.config.ts)

```typescript
// c:\Bag\frontend\vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8000',  // Django адрес
    changeOrigin: true,
  }
}
```

---

## ✅ Чек-лист готовности

- [ ] Python 3.10+ установлен
- [ ] Node.js 18+ установлен
- [ ] `cd c:\Bag` и `python manage.py runserver` работает
- [ ] `cd c:\Bag\frontend` и `npm run dev` работает
- [ ] `http://localhost:5173` открывается в браузере
- [ ] `http://localhost:8000/admin` доступен
- [ ] Можно создать проект через UI
- [ ] Можно создать задачу через UI

Если все галочки → **Готовы к разработке! 🚀**

---

## 🎓 Дополнительное обучение

После успешного запуска прочитайте (в порядке):

1. **QUICK_REFERENCE.md** (5 мин) - частые команды и примеры
2. **DEVELOPMENT_GUIDE.md** (30 мин) - полная архитектура
3. **COMPONENTS_REFERENCE.md** (20 мин) - компоненты фронтенда
4. **API_REFERENCE.md** (20 мин) - endpoints бэкенда

---

## 🚨 SOS: Что-то не работает?

### Шаг 1: Проверить логи

```bash
# Django логи видны в терминале где вы запустили runserver
# Фронтенд логи видны в терминале где вы запустили npm run dev
# Браузер логи: F12 → Console
```

### Шаг 2: Проверить требования

```bash
python --version      # Должен быть 3.10+
node --version        # Должен быть 18+
npm --version         # Должен быть установлен
```

### Шаг 3: Переустановить

```bash
# Бэкенд
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# Фронтенд
rm -rf node_modules package-lock.json
npm install --no-optional
```

### Шаг 4: Прочитать TROUBLESHOOTING.md

→ Там подробная инструкция для каждой проблемы

---

## 🎉 Поздравляем!

Вы успешно запустили **BugTracker**!

**Теперь вы можете:**

- ✅ Использовать приложение
- ✅ Разрабатывать новые функции
- ✅ Экспериментировать с кодом
- ✅ Понимать архитектуру

---

## 📞 Быстрые ссылки

| Документ                                           | Для кого     | Время  |
| -------------------------------------------------- | ------------ | ------ |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md)           | Все          | 5 мин  |
| [COMPONENTS_REFERENCE.md](COMPONENTS_REFERENCE.md) | Frontend dev | 20 мин |
| [API_REFERENCE.md](API_REFERENCE.md)               | Backend dev  | 20 мин |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)         | DevOps       | 30 мин |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)       | Все          | 45 мин |

---

**Успешной разработки! 💻✨**

Если нужна помощь → Откройте [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
