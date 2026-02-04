# 🧩 COMPONENTS_REFERENCE - Справочник компонентов

> Полный справочник всех 25+ компонентов фронтенда

---

## 📚 Содержание

1. [Импорт компонентов](#импорт-компонентов)
2. [Базовые компоненты](#базовые-компоненты)
3. [Компоненты форм](#компоненты-форм)
4. [Компоненты макета](#компоненты-макета)
5. [Компоненты данных](#компоненты-данных)
6. [Компоненты обратной связи](#компоненты-обратной-связи)
7. [CSS классы Tailwind](#css-классы-tailwind)
8. [Примеры](#примеры)

---

## 📥 Импорт компонентов

```typescript
// src/main.ts
import {
  h, // JSX-подобная функция
  Button,
  PrimaryButton, // Кнопки
  Card,
  Container, // Контейнеры
  Grid, // Сетка
  Input,
  Select,
  Textarea,
  Label,
  Form,
  FormGroup, // Формы
  Badge,
  StatusBadge,
  PriorityBadge, // Бейджи
  Table,
  Tab, // Таблицы и табы
  Navbar,
  NavbarItem,
  PageHeader, // Навигация
  Alert,
  Modal,
  Loader,
  showToast,
  EmptyState, // Обратная связь
  Divider,
  Breadcrumb, // Разделители
} from "./components";

import { api, Project, Issue } from "./api"; // API
```

---

## 🔘 Базовые компоненты

### Button - Обычная кнопка

```typescript
Button({ children: "Текст", onClick: handler });
Button({ children: "Ghost", class: "btn-ghost" });
Button({ children: "Small", class: "btn-sm" });
Button({ children: "Disabled", disabled: true });
```

**Результат:**

```html
<button class="btn btn-ghost">Текст</button>
<button class="btn btn-ghost btn-ghost">Ghost</button>
<button class="btn btn-ghost btn-sm">Small</button>
<button class="btn btn-ghost" disabled>Disabled</button>
```

**Props:**

- `children` - текст кнопки
- `onClick` - функция при клике
- `class` - доп. классы (btn-sm, btn-ghost, и т.д.)
- `disabled` - отключить кнопку
- Все остальные свойства HTML button

---

### PrimaryButton - Основная кнопка

```typescript
PrimaryButton({ children: "Сохранить", onClick: save });
PrimaryButton({ children: "Создать", type: "submit" });
PrimaryButton({ children: "Удалить", class: "btn-error" });
```

**Результат:**

```html
<button class="btn btn-primary">Сохранить</button>
<button class="btn btn-primary" type="submit">Создать</button>
<button class="btn btn-primary btn-error">Удалить</button>
```

**Props:**

- Все то же, что Button
- Автоматически добавляет `btn btn-primary`

---

### Card - Карточка

```typescript
Card(
  {},
  "Заголовок карточки",
  h("p", {}, "Содержимое"),
  Badge({}, "5 заданий"),
);
```

**Результат:**

```html
<div class="card bg-base-100 shadow">
  <div class="card-body">
    <h2 class="card-title">Заголовок карточки</h2>
    <p>Содержимое</p>
    <span class="badge">5 заданий</span>
  </div>
</div>
```

**Props:**

- `props` - объект с классами (class, onClick, и т.д.)
- `...children` - содержимое карточки

---

### Container - Контейнер

```typescript
Container({ class: "py-8" }, h("h1", {}, "Заголовок"), h("p", {}, "Текст"));
```

**Результат:**

```html
<div class="container py-8">
  <h1>Заголовок</h1>
  <p>Текст</p>
</div>
```

**Props:**

- `props` - классы и другие свойства
- `...children` - содержимое

---

### Grid - Сетка

```typescript
Grid(
  { columns: 3 },
  Card({}, "Карточка 1"),
  Card({}, "Карточка 2"),
  Card({}, "Карточка 3"),
);
```

**Результат:**

```html
<div class="grid grid-cols-3 gap-4">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

**Props:**

- `columns` (1-12) - количество колонок
- `...children` - элементы сетки

---

## 📝 Компоненты форм

### Input - Текстовое поле

```typescript
Input({ name: "username", placeholder: "Введите логин" });
Input({ name: "email", type: "email", placeholder: "Email" });
Input({ name: "password", type: "password", placeholder: "Пароль" });
Input({ value: "Начальное значение", readonly: true });
```

**Результат:**

```html
<input
  class="input input-bordered"
  name="username"
  placeholder="Введите логин"
/>
<input
  class="input input-bordered"
  name="email"
  type="email"
  placeholder="Email"
/>
```

**Props:**

- `name` - имя поля
- `type` - тип (text, email, password, number, и т.д.)
- `placeholder` - подсказка
- `value` - начальное значение
- `readonly` - только для чтения

---

### Textarea - Многострочный текст

```typescript
Textarea({ name: "description", placeholder: "Описание" });
Textarea({ name: "comment", rows: 5, placeholder: "Комментарий" });
```

**Результат:**

```html
<textarea
  class="textarea textarea-bordered"
  name="description"
  placeholder="Описание"
></textarea>
<textarea class="textarea textarea-bordered" rows="5"></textarea>
```

**Props:**

- `name` - имя поля
- `placeholder` - подсказка
- `rows` - количество строк
- `cols` - количество колонок

---

### Select - Выпадающее меню

```typescript
Select({
  name: "priority",
  options: [
    { value: "low", label: "Низкий" },
    { value: "medium", label: "Средний" },
    { value: "high", label: "Высокий" },
  ],
});

Select({
  name: "status",
  options: [
    { value: "open", label: "🕐 В работе" },
    { value: "done", label: "✅ Готово" },
  ],
});
```

**Результат:**

```html
<select class="select select-bordered" name="priority">
  <option value="low">Низкий</option>
  <option value="medium">Средний</option>
  <option value="high">Высокий</option>
</select>
```

**Props:**

- `name` - имя поля
- `options` - массив {value, label}

---

### Label - Метка

```typescript
Label({}, "Название проекта");
Label({ class: "text-sm" }, "Маленькая метка");
```

**Результат:**

```html
<label class="label">
  <span class="label-text">Название проекта</span>
</label>
```

**Props:**

- `class` - доп. классы
- `...children` - текст метки

---

### Form - Форма

```typescript
Form(
  {
    onSubmit: (e) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      console.log(data.get("name"));
    },
  },
  FormGroup({}, Label({}, "Название"), Input({ name: "name" })),
  FormGroup({}, Label({}, "Описание"), Textarea({ name: "desc" })),
  PrimaryButton({ children: "Сохранить", type: "submit" }),
);
```

**Результат:**

```html
<form>
  <div class="form-control">
    <label>Название</label>
    <input name="name" />
  </div>
  <div class="form-control">
    <label>Описание</label>
    <textarea name="desc"></textarea>
  </div>
  <button type="submit">Сохранить</button>
</form>
```

**Props:**

- `onSubmit` - функция при отправке
- `...children` - содержимое формы

---

### FormGroup - Группа формы

```typescript
FormGroup(
  { class: "mb-4" },
  Label({}, "Email"),
  Input({ name: "email", type: "email" }),
);
```

**Результат:**

```html
<div class="form-control mb-4">
  <label>Email</label>
  <input name="email" type="email" />
</div>
```

**Props:**

- `class` - доп. классы
- `...children` - элементы группы (Label, Input, и т.д.)

---

## 🧭 Компоненты макета

### Navbar - Навигационная панель

```typescript
Navbar(
  {},
  NavbarItem({ class: "flex-1" }, h("a", {}, "🐛 BugTracker")),
  NavbarItem(
    { class: "gap-2" },
    Button({ children: "Проекты" }),
    Button({ children: "Задачи" }),
  ),
);
```

**Результат:**

```html
<div class="navbar bg-base-100">
  <div class="flex-1">
    <a>🐛 BugTracker</a>
  </div>
  <div class="gap-2">
    <button>Проекты</button>
    <button>Задачи</button>
  </div>
</div>
```

**Props:**

- `class` - классы для элемента

---

### NavbarItem - Элемент навбара

```typescript
NavbarItem({}, "Текст");
NavbarItem({ class: "flex-1" }, "Главное меню");
NavbarItem({ class: "gap-2" }, Button({}), Button({}));
```

---

### PageHeader - Заголовок страницы

```typescript
PageHeader("Проекты", "Управляйте вашими проектами");
PageHeader("Задачи", "5 задач в работе");
```

**Результат:**

```html
<div class="space-y-2">
  <h1 class="text-3xl font-bold">Проекты</h1>
  <p class="text-base-content/70">Управляйте вашими проектами</p>
</div>
```

**Props:**

- Первый параметр - главный заголовок
- Второй параметр - подзаголовок/описание

---

### Divider - Разделитель

```typescript
Divider({});
Divider({ class: "my-4" });
```

**Результат:**

```html
<div class="divider"></div>
```

---

### Breadcrumb - Хлебные крошки

```typescript
Breadcrumb({}, ["Главная", "Проекты", "Мой проект"]);
```

**Результат:**

```html
<div class="breadcrumbs">
  <ul>
    <li><a>Главная</a></li>
    <li><a>Проекты</a></li>
    <li>Мой проект</li>
  </ul>
</div>
```

---

## 📊 Компоненты данных

### Badge - Бейдж

```typescript
Badge({}, "Текст");
Badge({ variant: "primary" }, "Основной");
Badge({ variant: "success" }, "Успех");
Badge({ variant: "error" }, "Ошибка");
```

**Варианты (variant):**

- `primary` - синий
- `success` - зелёный
- `error` - красный
- `warning` - жёлтый
- `info` - голубой
- `ghost` - простой (по умолчанию)

---

### StatusBadge - Статус бейдж

```typescript
StatusBadge("open"); // 🕐 В работе
StatusBadge("in_progress"); // ↻ В процессе
StatusBadge("done"); // ✅ Готово
StatusBadge("cancelled"); // ❌ Отменено
```

**Результат:**

```html
<span class="badge badge-warning">🕐 В работе</span>
<span class="badge badge-info">↻ В процессе</span>
<span class="badge badge-success">✅ Готово</span>
<span class="badge badge-error">❌ Отменено</span>
```

---

### PriorityBadge - Приоритет бейдж

```typescript
PriorityBadge("low"); // ⬇️ Низкий
PriorityBadge("medium"); // ⏺️ Средний
PriorityBadge("high"); // ⬆️ Высокий
```

**Результат:**

```html
<span class="badge badge-ghost">⬇️ Низкий</span>
<span class="badge badge-warning">⏺️ Средний</span>
<span class="badge badge-error">⬆️ Высокий</span>
```

---

### Table - Таблица

```typescript
Table(
  {},
  ["Название", "Статус", "Приоритет"],
  [
    ["Задача 1", "В работе", "Высокий"],
    ["Задача 2", "Готово", "Низкий"],
    ["Задача 3", "В процессе", "Средний"],
  ],
);
```

**Результат:**

```html
<table class="table">
  <thead>
    <tr>
      <th>Название</th>
      <th>Статус</th>
      <th>Приоритет</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Задача 1</td>
      <td>В работе</td>
      <td>Высокий</td>
    </tr>
    ...
  </tbody>
</table>
```

---

### Tab - Таб/вкладка

```typescript
Tab(
  { activeTab: 0 },
  { label: "Общее", content: h("p", {}, "Содержимое") },
  { label: "Детали", content: h("p", {}, "Деталирано") },
);
```

---

## 🔔 Компоненты обратной связи

### Alert - Уведомление

```typescript
Alert({}, "Это информационное сообщение");
Alert({ class: "alert-success" }, "Успешно!");
Alert({ class: "alert-error" }, "Ошибка!");
Alert({ class: "alert-warning" }, "Предупреждение!");
```

**Результат:**

```html
<div class="alert">Это информационное сообщение</div>
<div class="alert alert-success">Успешно!</div>
```

---

### showToast - Всплывающее сообщение

```typescript
showToast("Проект создан!", "success"); // 🟢 Зелёное
showToast("Произошла ошибка", "error"); // 🔴 Красное
showToast("Внимание!", "warning"); // 🟡 Жёлтое
showToast("Информация", "info"); // 🔵 Голубое

// С временем закрытия (по умолчанию 3000мс)
showToast("Скоро закроется", "success", 5000);
```

---

### Modal - Модальное окно

```typescript
// Открыть модальное окно
const modal = h(
  "div",
  { id: "my-modal", class: "modal" },
  h(
    "div",
    { class: "modal-box" },
    h("h3", { class: "font-bold text-lg" }, "Заголовок"),
    h("p", { class: "py-4" }, "Содержимое"),
    h(
      "div",
      { class: "modal-action" },
      Button({ children: "Отмена" }),
      PrimaryButton({ children: "ОК" }),
    ),
  ),
);

document.body.appendChild(modal);

// Открыть
modal.classList.remove("hidden");

// Закрыть
modal.classList.add("hidden");
```

---

### Loader - Загрузчик

```typescript
Loader({});
Loader({ class: "text-primary" });
```

**Результат:**

```html
<span class="loading loading-spinner"></span>
<span class="loading loading-spinner text-primary"></span>
```

---

### EmptyState - Пустое состояние

```typescript
EmptyState("Нет проектов. Создайте первый!");
EmptyState("Нет задач в этом проекте");
```

**Результат:**

```html
<div class="text-center py-8">
  <p class="text-base-content/50">Нет проектов. Создайте первый!</p>
</div>
```

---

## 🎨 CSS классы Tailwind

### Основные классы

```html
<!-- Текст -->
<p class="text-sm">Маленький</p>
<p class="text-base">Обычный</p>
<p class="text-lg">Большой</p>
<p class="text-xl">Очень большой</p>
<p class="text-3xl font-bold">Заголовок</p>

<!-- Цвета -->
<div class="text-primary">Синий текст</div>
<div class="bg-success">Зелёный фон</div>
<div class="border-error">Красная граница</div>

<!-- Расстояния -->
<div class="p-4">Padding 4</div>
<div class="m-2">Margin 2</div>
<div class="gap-2">Промежуток 2</div>
<div class="space-y-4">Вертикальный промежуток</div>

<!-- Флексбокс -->
<div class="flex">Flex строка</div>
<div class="flex flex-col">Flex колонка</div>
<div class="flex justify-center">По центру</div>
<div class="flex items-center">Вертикально по центру</div>
<div class="flex gap-4">С промежутком 4</div>

<!-- Сетка -->
<div class="grid grid-cols-3">3 колонки</div>
<div class="grid grid-cols-2 gap-4">2 колонки, промежуток</div>

<!-- Граница -->
<div class="border">Граница</div>
<div class="border-2">Толстая граница</div>
<div class="rounded">Закругление</div>
<div class="rounded-lg">Большое закругление</div>

<!-- Видимость -->
<div class="hidden">Скрыто</div>
<div class="invisible">Невидимо (место занимает)</div>
<div class="opacity-50">Полупрозрачно</div>
```

---

## 💡 Примеры

### Пример 1: Форма создания проекта

```typescript
Form(
  {
    onSubmit: (e) => {
      const data = new FormData(e.currentTarget);
      createProject(data);
    },
  },
  FormGroup(
    {},
    Label({}, "Название проекта"),
    Input({ name: "name", placeholder: "Введите название" }),
  ),
  FormGroup(
    { class: "mt-4" },
    Label({}, "Описание"),
    Textarea({ name: "description", placeholder: "Опишите проект" }),
  ),
  h(
    "div",
    { class: "flex gap-2 mt-6" },
    Button({ children: "Отмена" }),
    PrimaryButton({ children: "Создать", type: "submit" }),
  ),
);
```

### Пример 2: Карточка проекта

```typescript
Card(
  { class: "hover-lift cursor-pointer" },
  h("h2", { class: "card-title" }, project.name),
  h("p", { class: "text-sm text-base-content/70" }, project.description),
  h(
    "div",
    { class: "flex justify-between items-center mt-4" },
    Badge({ variant: "primary" }, `${project.issues_count} задач`),
    h("small", { class: "text-base-content/50" }, "Нажмите для открытия"),
  ),
);
```

### Пример 3: Список задач

```typescript
h(
  "div",
  { class: "space-y-4" },
  ...issues.map((issue) =>
    Card(
      {},
      issue.title,
      h("p", { class: "text-sm text-base-content/70" }, issue.description),
      h(
        "div",
        { class: "flex flex-wrap gap-2 mt-4" },
        StatusBadge(issue.status),
        PriorityBadge(issue.priority),
      ),
    ),
  ),
);
```

---

## 🎓 Дальше

→ Используйте эти компоненты в своих приложениях!

Если нужен новый компонент → Добавьте функцию в `src/components.ts`

🚀 **Happy coding!**
