// Mock data for BugForge
const PROJECTS = [
  { id: 'web', name: 'Web App', color: '#5E6AD2' },
  { id: 'ios', name: 'iOS App', color: '#D97757' },
  { id: 'api', name: 'Public API', color: '#4CA85C' },
  { id: 'admin', name: 'Admin Panel', color: '#9665C9' },
];

const USERS = [
  { id: 'om', name: 'Олена Мельник', initials: 'ОМ', color: 'linear-gradient(135deg,#F4A261,#E76F51)' },
  { id: 'ds', name: 'Дмитро Савченко', initials: 'ДС', color: 'linear-gradient(135deg,#6BB6FF,#4651B5)' },
  { id: 'np', name: 'Наталія Петренко', initials: 'НП', color: 'linear-gradient(135deg,#9665C9,#6B3F9C)' },
  { id: 'ak', name: 'Андрій Коваль', initials: 'АК', color: 'linear-gradient(135deg,#4CA85C,#2F7A3D)' },
  { id: 'iv', name: 'Ірина Возняк', initials: 'ІВ', color: 'linear-gradient(135deg,#E04B43,#B8413A)' },
  { id: 'mt', name: 'Максим Ткаченко', initials: 'МТ', color: 'linear-gradient(135deg,#D4951F,#9A6B0F)' },
];

const userById = (id) => USERS.find(u => u.id === id) || USERS[0];

const BUGS = [
  { id: 'BUG-2041', title: 'Не зберігаються налаштування 2FA після виходу з акаунту', status: 'open', priority: 'critical', assignee: 'om', reporter: 'ds', project: 'web', tags: ['security','auth'], comments: 12, attachments: 4, updated: '2 год тому', created: '12 хв 04', env: 'Production' },
  { id: 'BUG-2040', title: 'Падіння застосунку при відкритті профілю в офлайн-режимі', status: 'progress', priority: 'critical', assignee: 'np', reporter: 'iv', project: 'ios', tags: ['crash','offline'], comments: 8, attachments: 7, updated: '34 хв тому', created: 'сьогодні', env: 'iOS 17.4' },
  { id: 'BUG-2039', title: 'Кнопка «Зберегти» зникає на мобільних при довгій формі', status: 'progress', priority: 'high', assignee: 'ds', reporter: 'om', project: 'web', tags: ['ui','responsive'], comments: 4, attachments: 2, updated: 'сьогодні', created: 'вчора', env: 'Safari iOS' },
  { id: 'BUG-2038', title: 'Webhook повторно надсилає подію після таймауту 504', status: 'open', priority: 'high', assignee: 'ak', reporter: 'mt', project: 'api', tags: ['webhook','reliability'], comments: 6, attachments: 1, updated: 'вчора', created: '2 дні тому', env: 'API v3' },
  { id: 'BUG-2037', title: 'Невірний формат дати у звітах для локалі pl-PL', status: 'open', priority: 'medium', assignee: 'iv', reporter: 'np', project: 'web', tags: ['i18n','reports'], comments: 2, attachments: 0, updated: 'вчора', created: '3 дні тому', env: 'Production' },
  { id: 'BUG-2036', title: 'Експорт CSV ігнорує фільтри дашборду', status: 'progress', priority: 'medium', assignee: 'mt', reporter: 'ds', project: 'admin', tags: ['export','reports'], comments: 9, attachments: 3, updated: '2 дні тому', created: '4 дні тому', env: 'Staging' },
  { id: 'BUG-2035', title: 'Помилка 500 при завантаженні великих файлів (>50MB)', status: 'blocked', priority: 'high', assignee: 'ak', reporter: 'om', project: 'api', tags: ['upload','performance'], comments: 11, attachments: 2, updated: '3 дні тому', created: 'тиждень тому', env: 'Production' },
  { id: 'BUG-2034', title: 'Темна тема: контраст тексту нижче WCAG AA на сторінці білінгу', status: 'open', priority: 'low', assignee: 'om', reporter: 'iv', project: 'web', tags: ['a11y','theme'], comments: 3, attachments: 4, updated: '3 дні тому', created: 'тиждень тому', env: 'Production' },
  { id: 'BUG-2033', title: 'Сповіщення в Slack приходять з затримкою 15+ хв', status: 'resolved', priority: 'medium', assignee: 'ds', reporter: 'np', project: 'admin', tags: ['integrations','slack'], comments: 5, attachments: 0, updated: '4 дні тому', created: 'тиждень тому', env: 'Production' },
  { id: 'BUG-2032', title: 'Пошук не індексує коментарі до тест-кейсів', status: 'closed', priority: 'low', assignee: 'mt', reporter: 'ak', project: 'admin', tags: ['search'], comments: 2, attachments: 0, updated: '5 днів тому', created: '2 тижні тому', env: 'Production' },
  { id: 'BUG-2031', title: 'Drag-and-drop не працює у Firefox 124', status: 'resolved', priority: 'medium', assignee: 'np', reporter: 'mt', project: 'web', tags: ['firefox','dnd'], comments: 7, attachments: 1, updated: '5 днів тому', created: '2 тижні тому', env: 'Firefox 124' },
  { id: 'BUG-2030', title: 'Помилка валідації email з + у локальній частині', status: 'closed', priority: 'low', assignee: 'iv', reporter: 'ds', project: 'web', tags: ['validation'], comments: 4, attachments: 0, updated: '6 днів тому', created: '2 тижні тому', env: 'Production' },
];

const TEST_SUITES = [
  { id: 'auth', name: 'Authentication', count: 24 },
  { id: 'billing', name: 'Billing & Payments', count: 31 },
  { id: 'profile', name: 'User Profile', count: 18 },
  { id: 'reports', name: 'Reports & Export', count: 22 },
  { id: 'api', name: 'Public API', count: 47 },
];

const TEST_CASES = [
  { id: 'TC-104', title: 'Користувач може увімкнути 2FA через email-код', suite: 'auth', priority: 'critical', status: 'pass', steps: 6, lastRun: '2 год тому', author: 'om', automated: true },
  { id: 'TC-103', title: 'Скидання паролю відправляє лист протягом 30 секунд', suite: 'auth', priority: 'high', status: 'pass', steps: 4, lastRun: '2 год тому', author: 'om', automated: true },
  { id: 'TC-102', title: 'Sign-in через Google зберігає сесію 30 днів', suite: 'auth', priority: 'high', status: 'fail', steps: 5, lastRun: '2 год тому', author: 'ds', automated: true },
  { id: 'TC-101', title: 'Невірний пароль після 5 спроб блокує акаунт на 15 хв', suite: 'auth', priority: 'high', status: 'pass', steps: 7, lastRun: '2 год тому', author: 'iv', automated: false },
  { id: 'TC-100', title: 'Logout очищує всі активні сесії на пристроях', suite: 'auth', priority: 'medium', status: 'pending', steps: 3, lastRun: '—', author: 'om', automated: false },
  { id: 'TC-088', title: 'Оплата карткою Visa проходить за 1 крок', suite: 'billing', priority: 'critical', status: 'pass', steps: 8, lastRun: 'вчора', author: 'mt', automated: true },
  { id: 'TC-087', title: 'Failed payment показує зрозумілу помилку', suite: 'billing', priority: 'high', status: 'fail', steps: 5, lastRun: 'вчора', author: 'mt', automated: true },
  { id: 'TC-086', title: 'Перехід на річний план застосовує знижку 20%', suite: 'billing', priority: 'medium', status: 'skip', steps: 6, lastRun: 'вчора', author: 'np', automated: true },
  { id: 'TC-072', title: 'Зміна аватара через drag-and-drop оновлює превʼю', suite: 'profile', priority: 'low', status: 'pass', steps: 4, lastRun: '3 дні тому', author: 'om', automated: false },
  { id: 'TC-071', title: 'Видалення акаунта потребує підтвердження email', suite: 'profile', priority: 'critical', status: 'pass', steps: 6, lastRun: '3 дні тому', author: 'iv', automated: true },
];

// Burndown / trend data
const BURNDOWN = [
  { d: '08.04', open: 142, opened: 14, closed: 6 },
  { d: '09.04', open: 150, opened: 18, closed: 10 },
  { d: '10.04', open: 156, opened: 12, closed: 6 },
  { d: '11.04', open: 158, opened: 15, closed: 13 },
  { d: '12.04', open: 154, opened: 8, closed: 12 },
  { d: '13.04', open: 149, opened: 10, closed: 15 },
  { d: '14.04', open: 144, opened: 11, closed: 16 },
  { d: '15.04', open: 138, opened: 9, closed: 15 },
  { d: '16.04', open: 132, opened: 13, closed: 19 },
  { d: '17.04', open: 128, opened: 14, closed: 18 },
  { d: '18.04', open: 122, opened: 7, closed: 13 },
  { d: '19.04', open: 119, opened: 10, closed: 13 },
  { d: '20.04', open: 116, opened: 12, closed: 15 },
  { d: '21.04', open: 113, opened: 9, closed: 12 },
];

const ACTIVITY = [
  { who: 'om', verb: 'закрила', what: 'BUG-2031', detail: 'Drag-and-drop не працює у Firefox 124', when: '5 хв', kind: 'closed' },
  { who: 'ds', verb: 'призначив', what: 'BUG-2040', detail: 'Наталії Петренко', when: '12 хв', kind: 'assign' },
  { who: 'ak', verb: 'додав коментар до', what: 'BUG-2038', detail: '"Webhook ретраїть з тим самим ID — потрібен ідемпотентний ключ"', when: '34 хв', kind: 'comment' },
  { who: 'np', verb: 'оновила статус', what: 'BUG-2040', detail: 'Open → In Progress', when: '1 год', kind: 'status' },
  { who: 'iv', verb: 'створила', what: 'BUG-2041', detail: 'Не зберігаються налаштування 2FA після виходу з акаунту', when: '2 год', kind: 'created' },
  { who: 'mt', verb: 'запустила тест-ран', what: 'TR-58', detail: 'Smoke · Auth · Billing — 73 кейсів', when: '3 год', kind: 'run' },
  { who: 'om', verb: 'прикріпила скріншот до', what: 'BUG-2034', detail: 'billing-contrast.png', when: '4 год', kind: 'attach' },
];

const HISTORY_2041 = [
  { who: 'iv', verb: 'створила баг', when: 'Сьогодні · 09:14', kind: 'created' },
  { who: 'iv', verb: 'прикріпила screenshot-2fa-modal.png та 3 інші файли', when: 'Сьогодні · 09:16', kind: 'attach' },
  { who: 'ds', verb: 'призначив на Олену Мельник', when: 'Сьогодні · 10:02', kind: 'assign' },
  { who: 'ds', verb: 'змінив пріоритет: High → Critical', when: 'Сьогодні · 10:02', kind: 'priority' },
  { who: 'om', verb: 'звʼязала з PR #4128 у repo/web', when: 'Сьогодні · 10:35', kind: 'link' },
  { who: 'om', verb: 'додала тег: security', when: 'Сьогодні · 10:36', kind: 'tag' },
  { who: 'np', verb: 'додала коментар', when: 'Сьогодні · 11:12', kind: 'comment' },
  { who: 'ak', verb: 'оновив статус: Open → In Progress → Open', when: 'Сьогодні · 11:48', kind: 'status' },
];

const COMMENTS_2041 = [
  { who: 'np', when: 'сьогодні · 11:12', body: 'Зловила ще раз: на staging повторюється стабільно після logout → login. Пушнула HAR у вкладення. Думаю проблема у secure-cookie прапорі під час redirect.' },
  { who: 'ds', when: 'сьогодні · 11:24', body: 'Підтверджую — у production-логах бачу той самий патерн. Сесія створюється без 2FA-claim після soft-logout. Винесу окрему задачу на бекенд.' },
  { who: 'om', when: 'сьогодні · 11:48', body: 'Звʼязала з PR #4128. Тимчасовий workaround: примусовий повторний login через `/auth/refresh` після зміни 2FA. Треба ще тест на TC-104.' },
];

window.PROJECTS = PROJECTS;
window.USERS = USERS;
window.userById = userById;
window.BUGS = BUGS;
window.TEST_SUITES = TEST_SUITES;
window.TEST_CASES = TEST_CASES;
window.BURNDOWN = BURNDOWN;
window.ACTIVITY = ACTIVITY;
window.HISTORY_2041 = HISTORY_2041;
window.COMMENTS_2041 = COMMENTS_2041;
