# AI-Native LMS — План разработки

## Версия проекта: 0.4.1 (Content Generation Fixed)

---

## Прогресс зрелости проекта

| Компонент | Зрелость | Статус |
|-----------|----------|--------|
| Архитектура | ✅ 100% | Зафиксирована |
| Документация | ✅ 100% | Готово + DevOps |
| Frontend UI | ✅ 95% | Основные страницы + Auth |
| LMS Backend | ✅ 95% | API роуты + PostgreSQL + Auth |
| AI Интеграция | ✅ 95% | Proxy + AI Framework готовы |
| AI Pipelines | ⚠️ 30% | Нужно создать пайплайны |
| Схема БД | ✅ 100% | PostgreSQL + SQLAlchemy |
| Аутентификация | ✅ 100% | JWT + Login UI + Middleware |

---

## Этапы разработки

### Phase 1: Фундамент

- [x] **1.1** Инициализация проекта
  - [x] Создана документация (development.md, readme.md, plan.md)
  - [x] Настроены gitignore, clineignore, clinerules
  - [x] Инициализировать Next.js проект
  - [x] Инициализировать FastAPI проект

- [x] **1.2** Схема БД (PostgreSQL + SQLAlchemy)
  - [x] Таблица `users` — пользователи
  - [x] Таблица `courses` — курсы
  - [x] Таблица `nodes` — темы/уроки (self-referencing для вложенности)
  - [x] Таблица `user_progress` — прогресс
  - [x] Таблица `user_subscriptions` — подписки (заглушка)

- [x] **1.3** Базовая интеграция с AI Framework
  - [x] Настроить API-клиент
  - [x] Определить JSON-контракт
  - [x] Протестировать вызов пайплайнов (mock режим)

### Phase 2: AI Пайплайны

- [x] **2.1** Course Outline Generator
  - [x] Вход: user_prompt, difficulty, depth_limit
  - [x] Выход: JSON структура курса

- [x] **2.2** Lesson Theory Generator
  - [x] Вход: node_id, parent_context, title
  - [x] Выход: Markdown контент

- [x] **2.3** Lesson Practice Generator
  - [x] Вход: node_id, theory_content
  - [x] Выход: Задача + тесты + эталонное решение

- [x] **2.4** Code Validator
  - [x] Вход: user_code, expected_output, tests
  - [x] Выход: Результат проверки

- [x] **2.5** AI Mentor Chat
  - [x] Вход: question, context
  - [x] Выход: Ответ ментора

### Phase 3: Frontend — Layout

- [x] **3.1** Общий Layout
  - [x] Header: лого + User Menu (профиль, прогресс, настройки, выход)
  - [x] Sidebar: дерево курса (скрываемый)
  - [x] Конфигурация шрифтов и темы

- [x] **3.2** Landing Page
  - [x] Hero секция
  - [x] Описание фич
  - [x] Кнопка Get Started → Login

- [x] **3.3** Dashboard (Playground)
  - [x] Bento Grid: карточки курсов
  - [x] Статистика (заглушка)
  - [x] Создание курса (модалка с AI-чатом)

### Phase 4: Frontend — Course

- [x] **4.1** Course Map
  - [x] Древовидная структура (аккордеоны)
  - [x] Прогресс-бары
  - [x] Кнопка "Generate Next" (если курс неполный)

- [x] **4.2** Theory Page
  - [x] Рендеринг Markdown + LaTeX
  - [x] Smart Console внизу (чат с ИИ)
  - [x] Кнопка "Перегенерировать"

- [x] **4.3** Practice Page
  - [x] Monaco Editor (полноэкранный)
  - [x] Условие задачи сверху
  - [x] Smart Console: чат + логи + Run

### Phase 5: Backend API

- [x] **5.1** Auth API
  - [x] POST /register
  - [x] POST /login
  - [x] GET /me

- [x] **5.2** Courses API
  - [x] GET /courses — список курсов
  - [x] POST /courses — создать курс
  - [x] GET /courses/:id — детали курса
  - [x] DELETE /courses/:id — удалить курс

- [x] **5.3** Progress API
  - [x] GET /progress/:course_id
  - [x] POST /progress/:node_id/complete

- [x] **5.4** AI Proxy API
  - [x] POST /ai/generate/structure
  - [x] POST /ai/generate/content
  - [x] POST /ai/chat
  - [x] POST /ai/validate-code

### Phase 6: Docker & DevOps

- [x] **6.1** Docker Compose
  - [x] PostgreSQL сервис
  - [x] Backend сервис
  - [x] Frontend сервис
  - [x] AI Framework сервис

- [x] **6.2** Dockerfiles
  - [x] Backend Dockerfile
  - [x] Frontend Dockerfile (multi-stage)

### Phase 7: Аутентификация

- [x] **7.1** Frontend Auth UI
  - [x] Страница /login с формами логина и регистрации
  - [x] AuthProvider (React Context)
  - [x] Middleware для защиты роутов
  - [x] Logout в header Dashboard

- [x] **7.2** DevOps Документация
  - [x] docs/devops.md — полное руководство по развёртыванию

- [x] **7.3** Обновление документации
  - [x] development.md — актуализация
  - [x] plan.md — отметить выполненные пункты

---

### Phase 8: AI Pipelines Integration

- [x] **8.1** Создать пайплайн course_outline
  - [x] JSON конфиг в ai_backend_framework/pipelines/
  - [x] LLMNode + PromptNode для генерации структуры курса

- [x] **8.2** Создать пайплайн lesson_theory
  - [x] Генерация Markdown контента лекции
  - [x] Поддержка контекста родительской темы

- [x] **8.3** Создать пайплайн lesson_practice
  - [x] Генерация задачи + тестов + решения
  - [x] Code validation логика

- [x] **8.4** Создать пайплайн code_validator
  - [x] Валидация кода через LLM
  - [x] Проверка тестов

- [x] **8.5** Создать пайплайн ai_mentor
  - [x] Чат с историей
  - [x] Контекст урока

- [x] **8.6** Настроить реальный AI режим
  - [x] Добавить OPENROUTER_API_KEY в .env
  - [x] AI_MOCK_ENABLED=false

---

### Phase 9: Bug Fixes

- [x] **9.1** Исправлен баг: курс создавался пустым (без нод)
  - [x] Добавлен batch endpoint `/courses/:id/nodes/batch`
  - [x] Обновлён frontend для сохранения нод при создании курса
  - [x] Добавлены onClick обработчики на кнопки "Generate Course Structure" и "Generate More"

- [x] **9.2** Исправлен баг: контент не сохранялся в БД после генерации
  - [x] Добавлен PATCH endpoint `/api/v1/courses/nodes/{node_id}` в courses.py
  - [x] Модифицирован ai_proxy.py: после генерации контент сохраняется в БД
    - Для theory: сохраняется в поле `content`, status = "generated"
    - Для practice: сохраняется в поле `data` (task, solution, tests), status = "generated"
  - [x] Добавлен метод `nodesApi.update()` в frontend API
  - [x] Улучшена обработка ошибок в theory/practice страницах
- [x] **9.3** Исправлен контракт real-AI ключей между ai_proxy и AI pipelines
  - [x] theory: извлечение `lesson_content` и возврат `data.content`
  - [x] practice: парсинг `practice_task` (JsonParseNode) и нормализация в `data.task/solution/tests`
  - [x] chat: извлечение `mentor_response` и возврат `data.answer`

---

## Нерешённые вопросы

### 🔴 Критические

1. **Валидация кода**: Пока только LLM-валидация. Нужно решить, нужно ли Docker-выполнение.
2. **Стриминг UI**: Как показывать генерацию в дереве, чтобы UI не прыгал.
3. **Версионирование курсов**: При обновлении модели AI контент может измениться.

### 🟡 Требующие решения

1. **Монетизация**: Заглушки готовы, но нужна логика (пока в пром не выводим).
2. **Offline**: Кеширование контента в БД решает大部分, но полная офлайн-версия не планируется.
3. **Безопасность**: Нужно ограничить вызовы AI от злоумышленников.

---

## Следующий шаг

> Запустить Docker Compose и проверить работу:
> ```bash
> docker-compose up -d
> ```

---

## История изменений

| Версия | Дата | Описание |
|--------|------|----------|
| 0.4.1 | 2026-03-20 | Bug Fix: Исправлено сохранение контента в БД после генерации |
| 0.4.0 | 2026-03-19 | AI Integration: AI Framework подключён, нужны пайплайны |
| 0.3.0 | 2026-03-19 | Production-Ready Dev: Auth UI + DevOps docs |
| 0.2.0 | 2026-03-17 | MVP: PostgreSQL + JWT Auth + Docker |
| 0.1.0 | 2026-03-17 | Concept: Архитектура и документация |
