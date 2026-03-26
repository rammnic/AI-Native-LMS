# AI-Native LMS — План разработки

## Версия проекта: 0.6.0 (Context v2)

---

## Прогресс зрелости проекта

| Компонент | Зрелость | Статус |
|-----------|----------|--------|
| Архитектура | ✅ 100% | Зафиксирована |
| Документация | ✅ 100% | Готово + DevOps |
| Frontend UI | ✅ 95% | Основные страницы + Auth |
| LMS Backend | ✅ 98% | API роуты + PostgreSQL + Auth |
| AI Интеграция | ✅ 100% | Proxy + AI Framework + Structured Output |
| AI Pipelines | ✅ 100% | Все пайплайны готовы |
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
  - [x] **Structured Output**: json_mode включён

- [x] **2.2** Lesson Theory Generator
  - [x] Вход: node_id, parent_context, title
  - [x] Выход: Markdown контент

- [x] **2.3** Lesson Practice Generator
  - [x] Вход: node_id, theory_content
  - [x] Выход: Задача + тесты + эталонное решение
  - [x] **Structured Output**: json_mode включён

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
  - [x] json_mode: true для Structured Output

- [x] **8.2** Создать пайплайн lesson_theory
  - [x] Генерация Markdown контента лекции
  - [x] Поддержка контекста родительской темы

- [x] **8.3** Создать пайплайн lesson_practice
  - [x] Генерация задачи + тестов + решения
  - [x] Code validation логика
  - [x] json_mode: true для Structured Output

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
- [x] **9.4** Исправлена ошибка шаблонизатора в lesson_theory.json
  - [x] Jinja2 не поддерживает синтаксис Handlebars (`{{#if}}`) — ошибка "unexpected char '#'"
  - [x] Исправлено: `{{#if}}` → `{% if %}`, `{{/if}}` → `{% endif %}`
  - [x] Добавлено детальное логирование ответа AI Framework в ai_proxy.py
  - [x] После генерации данные перечитываются из БД для гарантированного возврата

---

### Phase 10: JSON Parsing Fix (Structured Output)

- [x] **10.1** Добавлен json_mode в LLMNode
  - [x] Параметр `json_mode: bool` в конструкторе
  - [x] Добавление `response_format: {"type": "json_object"}` к API запросу
  - [x] Автоматический парсинг JSON из ответа

- [x] **10.2** Обновлены пайплайны
  - [x] course_outline.json: `json_mode: true`
  - [x] lesson_practice.json: `json_mode: true`
  - [x] Промпты обновлены для возврата JSON объектов

- [x] **10.3** Упрощён JsonParseNode
  - [x] Убран дублирующий парсинг (300+ строк → ~100)
  - [x] json_repair используется как primary fallback
  - [x] Поддержка уже распарсенных dict/list (от json_mode)

- [x] **10.4** Упрощён ai_proxy.py
  - [x] Убрана функция `_extract_json()` — парсинг в AI Framework
  - [x] Только нормализация ключей для frontend
  - [x] Добавлен helper `_save_content_to_db()`

- [x] **10.5** Тестирование
  - [x] selftest_json_transform_node.py обновлён
  - [x] Тесты проходят (новый и legacy форматы)

---

### Phase 12: UX улучшения

- [ ] **12.1** Опрос пользователя перед генерацией курса
  - [ ] Интерактивный режим — понять бэкграунд пользователя
  - [ ] Вдруг юзер с компьютером впервые сталкивается

- [ ] **12.2** Кнопка "Проверить усвоение" с тестами
  - [ ] AI генерирует тест (5-n вопросов) на основе материала урока
  - [ ] После прохождения (>50%) теория помечается "изученной"
  - [ ] Возможность перепройти тест (не перезаписывает успех)
  - [ ] При неуспехе — новый тест, старый не сохраняется

- [ ] **12.3** Полная реализация практики
  - [ ] Практика пока не реализована корректно
  - [ ] Нужен полноценный flow с код-редактором

- [ ] **12.4** Фоновая генерация курса с прогрессом
  - [ ] Генерация происходит в фоне
  - [ ] На странице курса отображается прогресс генерации

- [ ] **12.5** ai_mentor — улучшения UI
  - [ ] Изначально отображается в свёрнутом виде
  - [ ] Не занимает пол-экрана при открытии

---

## Нерешённые вопросы

### 🔴 Критические

1. **Валидация кода**: Пока только LLM-валидация. Docker-выполнение в планах.
2. **Стриминг UI**: UI для плавного отображения генерации в процессе.
3. **Версионирование курсов**: При обновлении модели AI контент может измениться.

### 🟡 Требующие решения

1. **Монетизация**: Заглушки готовы, но нужна логика (пока в пром не выводим).
2. **Безопасность**: Нужно ограничить вызовы AI от злоумышленников.
3. **Глоссарий курса**: Согласование терминологии между уроками (отложено).

---

## См. также

- `docs/testing.md` — чеклист тестирования
- `docs/devops.md` — руководство по развёртыванию

---

## Следующий шаг

> Протестировать реальную генерацию курсов:
> 1. Убедиться что AI_MOCK_ENABLED=false
> 2. Открыть http://localhost:3000
> 3. Создать новый курс
> 4. Проверить что JSON парсится корректно

---

### Phase 11: Контекстная генерация уроков v2

- [x] **11.1** Фиксы P0
  - [x] Убрать комментарии "Внесённые улучшения" из промпта
  - [x] Фикс таблиц (правильное форматирование Markdown)
  - [x] Логика первого урока (`is_first` flag)

- [x] **11.2** Максимальный контекст
  - [x] `completed_lessons` — контент пройденных уроков
  - [x] `course_outline` — полная структура курса
  - [x] `is_first` / `is_last` флаги
  - [x] Особый промпт для первого урока

- [ ] **11.3** Глоссарий курса (отложено)
  - [ ] Сбор терминов из уроков
  - [ ] Передача в контекст
  - [ ] Согласованность терминологии

---

## Улучшения контентной генерации (v0.6.0)

### ✅ Выполнено

| # | Улучшение | Описание |
|---|-----------|----------|
| 1 | Сохранение иерархии уроков | `flattenStructure()` использует `order_index` из AI ответа |
| 2 | Language Settings | Выбор языка в модалке, сохранение в `course.settings` |
| 3 | Контекстный движок | `get_course_context()` собирает полный контекст |
| 4 | Максимальный контекст | `completed_lessons`, `course_outline`, `is_first`/`is_last` флаги |
| 5 | Особый промпт для первого урока | Введение вместо обычного урока |
| 6 | Фикс таблиц | Добавлен пример правильной таблицы в промпт |
| 7 | Фикс "Внесённые улучшения" | Убраны мета-комментарии в enhance-шаге |
| 8 | JSON Structured Output | `json_mode: true` в LLMNode |
| 9 | f_order для нумерации | Плоский порядковый номер урока |
| 10 | Стабильная сортировка | Добавлена вторичная сортировка по `id` |

### 🔄 В процессе

| # | Улучшение | Описание |
|---|-----------|----------|
| 1 | SSE стриминг | UI для плавного отображения генерации |

### 🔲 Запланировано

| # | Улучшение | Приоритет | Описание |
|---|-----------|-----------|----------|
| 1 | Глоссарий курса | P2 | Сбор терминов, согласование терминологии |
| 2 | Code Validation | P2 | Docker-выполнение кода с тестами |

---

## Success Criteria (контент)

- [x] Новые уроки сохраняют позицию в дереве
- [x] Все уроки на одном языке
- [x] AI использует контекст курса
- [x] Навигация между уроками работает
- [x] AI Framework промпты улучшены
- [x] order_index в course_outline
- [x] Нет комментариев "Внесённые улучшения"
- [x] Таблицы отображаются корректно
- [x] Первый урок генерируется как введение
- [ ] Контент полный (800+ слов, код, примеры) — требует тестирования
- [ ] Глоссарий курса — отложено

---

## Файлы изменённые в реализации контента

### Frontend:
- `frontend/components/create-course-modal.tsx` — language selector, order_index
- `frontend/app/course/[id]/page.tsx` — flattenStructure sync
- `frontend/app/lesson/[id]/theory/page.tsx` — navigation
- `frontend/app/lesson/[id]/practice/page.tsx` — navigation + regenerate

### Backend:
- `backend/app/db/schema.py` — default language in settings
- `backend/app/api/ai_proxy.py` — context engine + language

### AI Framework:
- `ai_backend_framework/ai-backend-framework/pipelines/lesson_theory.json` — improved prompts
- `ai_backend_framework/ai-backend-framework/pipelines/course_outline.json` — order_index

---

## История изменений

| Версия | Дата | Описание |
|--------|------|---------|
| 0.6.0 | 2026-03-21 | Context v2: Максимальный контекст для связности уроков, фикс таблиц и комментариев |
| 0.5.0 | 2026-03-21 | JSON Structured Output: LLMNode json_mode, упрощён JsonParseNode |
| 0.4.1 | 2026-03-20 | Bug Fix: Исправлено сохранение контента в БД после генерации |
| 0.4.0 | 2026-03-19 | AI Integration: AI Framework подключён, нужны пайплайны |
| 0.3.0 | 2026-03-19 | Production-Ready Dev: Auth UI + DevOps docs |
| 0.2.0 | 2026-03-17 | MVP: PostgreSQL + JWT Auth + Docker |
| 0.1.0 | 2026-03-17 | Concept: Архитектура и документация |
