# BugTracker Frontend 🎨

Современный фронтенд для системы управления задачами, построенный на **Vite 7 + TypeScript 5 + Tailwind CSS 4 + DaisyUI 5**.

## 🚀 Быстрый старт

### 1️⃣ Установка зависимостей

```bash
npm install
```

### 2️⃣ Разработка

```bash
npm run dev
```

Откроется на `http://localhost:5173` с автоматической перезагрузкой.

### 3️⃣ Построение для продакшена

```bash
npm run build
```

### 4️⃣ Просмотр собранного приложения

```bash
npm run preview
```

---

## 📁 Структура проекта

```
src/
├── main.ts          # 🎯 Главное приложение (UI + навигация)
├── components.ts    # 🧩 Библиотека UI компонентов (25+)
├── api.ts          # 🔗 Типобезопасный API клиент
├── style.css       # 🎨 Tailwind + DaisyUI + кастомные стили
└── index.html      # 📄 HTML шаблон
```

---

## 🎨 Особенности

### ✨ Компоненты

- **Базовые**: `Button`, `PrimaryButton`, `Card`, `Container`, `Grid`
- **Формы**: `Input`, `Textarea`, `Select`, `Label`, `Form`, `FormGroup`
- **Данные**: `Table`, `Badge`, `StatusBadge`, `PriorityBadge`, `Breadcrumb`
- **Обратная связь**: `Alert`, `Modal`, `Loader`, `Toast`, `EmptyState`
- **Макет**: `Navbar`, `PageHeader`, `Divider`, `Tab`

### 🎯 Функциональность

- ✅ Список проектов с картами
- ✅ Управление задачами (CRUD)
- ✅ Фильтрация по статусу и приоритету
- ✅ Модальные окна для создания
- ✅ Красивые бейджи статусов
- ✅ Полная локализация на русский
- ✅ API интеграция с Django

### 🎨 Темы

По умолчанию используется **DaisyUI corporate theme**. Доступны другие темы:

- `corporate` (текущая)
- `business`
- И множество других из DaisyUI

---

## 📝 Примеры использования

### Создание кнопки

```typescript
import { PrimaryButton } from "./components";

PrimaryButton({ children: "Нажми меня!" }, () => {
  console.log("Клик!");
});
```

### Создание карточки

```typescript
import { h, Card, Badge } from "./components";

Card(
  {},
  "Заголовок",
  h("p", {}, "Содержимое"),
  Badge({ variant: "primary" }, "5 задач"),
);
```

### API запрос

```typescript
import { api, Project } from "./api";

const projects = await api.get<Project[]>("/projects/");
const newProject = await api.post("/projects/", {
  name: "Новый проект",
  description: "Описание",
});
```

---

## 🔧 Конфигурация

### Vite (`vite.config.ts`)

- ✅ HMR для горячей перезагрузки
- ✅ Proxy для /api запросов к Django
- ✅ Оптимизированная сборка (terser, manual chunks)
- ✅ Auto-open браузера

### Tailwind (`postcss.config.cjs`)

- ✅ @tailwindcss/postcss для v4
- ✅ DaisyUI плагин с corporate темой
- ✅ Все утилиты доступны

### TypeScript (`tsconfig.json`)

- ✅ Strict mode
- ✅ DOM lib
- ✅ ESNext target

---

## 🔗 API Интеграция

Vite автоматически проксирует запросы с `/api` на `http://localhost:8000/api` (Django).

```typescript
// Эти запросы будут перенаправлены:
api.get('/projects/')      // → http://localhost:8000/api/projects/
api.post('/issues/', {...})  // → http://localhost:8000/api/issues/
api.put('/issues/1/', {...})  // → http://localhost:8000/api/issues/1/
api.delete('/issues/1/')      // → http://localhost:8000/api/issues/1/
```

---

## 🐛 Отладка

### Консоль браузера

Все ошибки логируются в консоль браузера (F12 → Console).

### Network вкладка

Проверьте сетевые запросы в Dev Tools → Network.

### TypeScript ошибки

```bash
npm run build
```

Покажет все ошибки типов перед сборкой.

---

## 📦 Зависимости

| Пакет         | Версия | Назначение           |
| ------------- | ------ | -------------------- |
| `vite`        | 7.1.7  | Сборщик и dev сервер |
| `tailwindcss` | 4.1.16 | CSS фреймворк        |
| `daisyui`     | 5.3.10 | Компоненты UI        |
| `typescript`  | 5.9.3  | Типизация            |
| `postcss`     | 8.5.6  | CSS обработка        |

---

## 🚀 Деплой

### Построение

```bash
npm run build
```

Создаст папку `dist/` с готовым приложением.

### Размер

- **HTML**: ~2KB
- **CSS**: ~50KB (Tailwind скрепка)
- **JS**: ~30KB (с компонентами)

---

## 💡 Советы

1. **Используйте компоненты**: Вместо прямого HTML используйте функции из `components.ts`
2. **Типизируйте API**: Используйте `api.get<MyType>()` для автодополнения
3. **Toast уведомления**: `showToast('Успешно!', 'success')` для всплывающих сообщений
4. **DaisyUI классы**: Все классы DaisyUI доступны в шаблонах (`.btn`, `.card`, `.badge`, и т.д.)

---

## 📚 Документация

- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)
- [TypeScript](https://www.typescriptlang.org/)

---

## 💬 Поддержка

Если у вас есть вопросы:

1. Проверьте консоль браузера на ошибки
2. Убедитесь, что Django API запущен на `localhost:8000`
3. Запустите `npm install` заново если были изменения в зависимостях

**Приятной разработки! 🎉**
