# AI-Native LMS — Developer Guide

## Описание проекта

AI-Native LMS — это образовательная платформа нового поколения, где контент генерируется и адаптируется "на лету" с помощью AI. В отличие от классических платформ (Stepik, Coursera), здесь нет статичных уроков — AI строит персонализированный учебный план.

## Архитектура системы

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI-Native LMS Frontend                       │
│                       (Next.js + Shadcn UI)                      │
│                                                                  │
│   Страницы:                                                      │
│   - / (Landing) — маркетинг                                      │
│   - /dashboard — Playground пользователя                         │
│   - /course/[id] — карта курса (дерево тем)                      │
│   - /lesson/[id]/theory — лекция                                 │
│   - /lesson/[id]/practice — практика                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP / JWT
┌─────────────────────────▼───────────────────────────────────────┐
│                    LMS Backend (FastAPI)                         │
│                                                                  │
│   - /api/v1/auth — аутентификация (JWT)                          │
│   - /api/v1/courses — CRUD курсов (PostgreSQL)                   │
│   - /api/v1/progress — прогресс обучения                         │
│   - /api/v1/ai/* — проксирование к AI Framework                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP / SSE
┌─────────────────────────▼───────────────────────────────────────┐
│               AI Backend Framework (Port 8000)                   │
│                                                                  │
│   Пайплайны:                                                     │
│   - course_outline — генерация структуры курса (Structured JSON)  │
│   - lesson_theory — генерация лекции (Markdown)                  │
│   - lesson_practice — генерация практики + тестов (Structured JSON)│
│   - code_validator — проверка кода                               │
│   - ai_mentor — чат-ментор                                       │
└─────────────────────────────────────────────────────────────────┘
                          │
                    PostgreSQL (5432)
```

## Технический стек

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI**: Shadcn UI + Tailwind CSS
- **State**: Zustand / React Query
- **Code Editor**: Monaco Editor
- **Markdown**: react-markdown + rehype-katex

### Backend (LMS)
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy 2.0 (async)
- **DB**: PostgreSQL
- **Auth**: JWT (python-jose + passlib)

### AI Backend
- **Framework**: ai_backend_framework (https://github.com/rammnic/ai_backend_framework)
- **LLM Provider**: OpenRouter (gpt-4o-mini, gpt-5.4-nano, etc.)
- **API**: FastAPI с SSE-стримингом
- **JSON Parsing**: Structured Output (response_format: json_object)

## Как запустить проект

### Вариант 1: Docker Compose (рекомендуется)

```bash
# Клонировать репозиторий
git clone https://github.com/rammnic/ai-native-lms.git
cd ai-native-lms

# Скопировать .env.example в .env (или создать вручную)
copy .env.example .env

# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps
```

#### Конфигурация .env

Создайте `.env` файл в корне проекта:

```env
# JWT Secret for authentication (change in production!)
JWT_SECRET=dev-secret-key-change-in-production

# AI Configuration
AI_MOCK_ENABLED=true
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**Примечание:** AI Framework монтируется из соседней папки `C:\DevOps\VS_Code_Projects\ai_backend_framework`. Убедитесь, что эта папка существует.

### Вариант 2: Локальная разработка

#### 1. PostgreSQL

```bash
# Запустить PostgreSQL в Docker
docker run -d \
  --name ai-lms-postgres \
  -e POSTGRES_USER=lms_user \
  -e POSTGRES_PASSWORD=lms_password \
  -e POSTGRES_DB=ai_lms \
  -p 5432:5432 \
  postgres:16-alpine
```

#### 2. Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Установить зависимости
pip install -r requirements.txt

# Настроить .env
copy .env.example .env
# DATABASE_URL=postgresql+asyncpg://lms_user:lms_password@localhost:5432/ai_lms

# Запустить
uvicorn main:app --reload --port 8001
```

#### 3. Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Запустить
npm run dev
```

## Структура проекта

```
AI-Native-LMS/
├── docker-compose.yml          # Docker Compose конфигурация
├── backend/                    # LMS Backend (FastAPI)
│   ├── Dockerfile
│   ├── main.py                 # Точка входа
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/                # API routes
│       │   ├── auth.py         # JWT аутентификация
│       │   ├── courses.py      # CRUD курсов
│       │   ├── progress.py     # Прогресс
│       │   └── ai_proxy.py     # AI прокси
│       └── db/
│           ├── database.py     # SQLAlchemy настройка
│           └── schema.py       # Модели БД
│
├── frontend/                   # Next.js Frontend
│   ├── Dockerfile
│   ├── next.config.ts
│   ├── package.json
│   ├── app/
│   │   ├── page.tsx           # Landing
│   │   ├── dashboard/         # Dashboard
│   │   ├── course/            # Course pages
│   │   └── lesson/            # Lesson pages
│   ├── components/            # UI components
│   └── lib/
│       └── api.ts             # API клиент
│
├── ai_backend_framework/       # AI Backend Framework (submodule)
│   └── ai-backend-framework/
│       ├── pipelines/         # JSON конфиги пайплайнов
│       ├── ai_flow_engine/    # Движок
│       │   └── nodes/         # Узлы (LLMNode, JsonParseNode, etc.)
│       └── api/               # FastAPI приложение
│
└── docs/                      # Документация
    ├── development.md
    ├── readme.md
    └── plan.md
```

## Схема БД

### Таблица users
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Уникальный email |
| password_hash | VARCHAR(255) | Хеш пароля |
| name | VARCHAR(255) | Имя пользователя |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### Таблица courses
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Primary key |
| author_id | UUID | Foreign key на users |
| title | VARCHAR(500) | Название курса |
| description | TEXT | Описание |
| status | VARCHAR(50) | draft/ready |
| settings | JSONB | Настройки курса |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

### Таблица nodes
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Primary key |
| course_id | UUID | Foreign key на courses |
| parent_id | UUID | Self-reference для дерева |
| title | VARCHAR(500) | Название |
| type | VARCHAR(50) | topic/theory/practice |
| order_index | INTEGER | Порядок внутри темы |
| f_order | INTEGER | Плоский порядок урока (1, 2, 3...) в рамках курса. Topics имеют 0 |
| content_status | VARCHAR(50) | pending/generated |
| content | TEXT | Markdown контент |
| data | JSONB | Доп. данные |

### Таблица user_progress
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key на users |
| node_id | UUID | Foreign key на nodes |
| course_id | UUID | Foreign key на courses |
| status | VARCHAR(50) | in_progress/completed |
| score | INTEGER | Оценка |
| completed_at | TIMESTAMP | Дата завершения |

### Таблица invite_codes
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | UUID | Primary key |
| code | VARCHAR(20) | Уникальный код (LC-XXXX-XXXX-XXXX) |
| created_by | UUID | Foreign key на users (создатель) |
| uses_count | INTEGER | Текущее использований |
| max_uses | INTEGER | Максимум использований |
| is_active | BOOLEAN | Активен ли код |
| expires_at | TIMESTAMP | Срок действия (nullable) |
| created_at | TIMESTAMP | Дата создания |

## JSON-контракт: Генерация курса

### Запрос: Создание структуры курса

```json
POST /api/v1/ai/generate/structure
{
  "user_prompt": "Хочу выучить Golang за 2 недели, знаю Python",
  "difficulty": "intermediate",
  "depth_limit": 3,
  "user_id": "user-123"
}
```

### Ответ: Структура курса

```json
{
  "success": true,
  "data": {
    "course_title": "Go для Python-разработчиков",
    "course_description": "...",
    "structure": [
      {
        "id": "node-1",
        "title": "Основы Go",
        "type": "topic",
        "children": [
          {
            "id": "node-1-1",
            "title": "Синтаксис и типы данных",
            "type": "theory",
            "content": null
          },
          {
            "id": "node-1-2",
            "title": "Практика: Переменные и функции",
            "type": "practice",
            "content": null
          }
        ]
      }
    ]
  }
}
```

### Ответ: Контент урока (POST /api/v1/ai/generate/content)

**Theory** (pipeline `lesson_theory`) — фронтенд ожидает:

```json
{
  "success": true,
  "data": {
    "content": "<markdown>"
  }
}
```

**Practice** (pipeline `lesson_practice`) — фронтенд ожидает:

```json
{
  "success": true,
  "data": {
    "task": "<task text>",
    "solution": "<reference solution>",
    "tests": [
      { "input": "...", "expected_output": "..." }
    ]
  }
}
```

## API Endpoints

### Auth
| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/v1/auth/register | Регистрация |
| POST | /api/v1/auth/login | Вход |
| GET | /api/v1/auth/me | Текущий пользователь |
| GET | /api/v1/auth/config | Публичная конфигурация (invite_code_required) |

### Admin (требуется авторизация + ADMIN_EMAIL)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/v1/admin/config | Получить конфигурацию |
| GET | /api/v1/admin/invite-codes | Список всех кодов |
| POST | /api/v1/admin/invite-codes | Создать код |
| PATCH | /api/v1/admin/invite-codes/:id | Обновить код |
| DELETE | /api/v1/admin/invite-codes/:id | Деактивировать код |

### Courses
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/v1/courses | Список курсов |
| POST | /api/v1/courses | Создать курс |
| GET | /api/v1/courses/:id | Детали курса |
| DELETE | /api/v1/courses/:id | Удалить курс |
| POST | /api/v1/courses/:id/nodes/batch | Создать несколько нод |
| GET | /api/v1/courses/:id/validate-structure | Валидация структуры курса |
| POST | /api/v1/courses/:id/nodes/recalculate-f-order | Пересчёт f_order |

### Nodes
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/v1/courses/nodes/:id | Получить ноду по ID |
| PATCH | /api/v1/courses/nodes/:id | Обновить ноду (content, data, content_status) |

### Progress
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/v1/progress/:course_id | Прогресс курса |
| POST | /api/v1/progress/:node_id/complete | Отметить завершённым |

### Prompts (шаблоны курсов)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/v1/prompts | Список всех промптов |
| GET | /api/v1/prompts/:id | Конкретный промпт |
| GET | /api/v1/prompts/career-paths | Карьерные пути |
| GET | /api/v1/prompts/categories/list | Категории |

### AI
| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/v1/ai/generate/structure | Структура курса |
| POST | /api/v1/ai/generate/content | Контент урока |
| POST | /api/v1/ai/validate-code | Валидация кода |
| POST | /api/v1/ai/chat | Чат с ментором |

## Константы и настройки

### AI Framework
- **Порт**: 8000
- **Модель по умолчанию**: openai/gpt-4o-mini
- **Модель для курсов**: openai/gpt-5.4-nano
- **Макс. токенов**: 4096
- **Температура**: 0.7
- **JSON Mode**: `response_format: {"type": "json_object"}` для структурированного вывода

### LMS Backend
- **Порт**: 8001
- **JWT Expire**: 24h
- **Курс макс. глубина**: 3 уровня

### Frontend
- **Порт**: 3000
- **API Base**: http://localhost:8001

## AI JSON Parsing (Structured Output)

Начиная с версии 0.5.0, JSON парсинг использует **Structured Output** (OpenRouter `response_format`).

### Как это работает:

1. **LLMNode** (`ai_backend_framework/ai-backend-framework/ai_flow_engine/nodes/llm_node.py`)
   - При `json_mode: true` добавляет `response_format: {"type": "json_object"}` к API запросу
   - OpenRouter гарантирует валидный JSON в ответе
   - LLMNode автоматически парсит JSON из ответа

2. **Пайплайны с JSON**:
   - `course_outline.json` — `json_mode: true`
   - `lesson_practice.json` — `json_mode: true`

3. **Пайплайны без JSON**:
   - `lesson_theory.json` — возвращает Markdown текст
   - `ai_mentor.json` — возвращает текст

4. **JsonParseNode** — упрощён, использует `json_repair` как fallback

### Тестирование:

```bash
cd ai_backend_framework/ai-backend-framework
python examples/selftest_json_transform_node.py
```

## Отладка

### Backend
```bash
# Запуск с отладкой
DEBUG=true uvicorn main:app --reload --port 8001

# Проверка health
curl http://localhost:8001/health
```

### AI Framework
```bash
# Проверка AI Framework напрямую
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"pipeline_name": "course_outline", "input_data": {"user_prompt": "test"}}'
```

### Frontend
```bash
# React Developer Tools
# Next.js DEBUG mode
DEBUG=next* npm run dev
```

## known Issues / TODO

- [x] Select component: исправлено управление видимостью dropdown (открыт/закрыт)
- [x] Frontend: настроен dev-режим с hot-reload в Docker
- [x] Аутентификация: добавлена страница /login, AuthProvider, middleware
- [x] AI Pipeline: исправлена проблема с пустым курсом при создании (добавлены JsonParseNode, JsonTransformNode, ExtractCourseMetadataNode)
- [x] Генерация контента: исправлено сохранение в БД (ai_proxy.py теперь сохраняет content/data после генерации)
- [x] **Исправлена ошибка шаблонизатора в lesson_theory.json**: Jinja2 не поддерживает синтаксис Handlebars (`{{#if}}`), исправлено на `{% if %}` / `{% endif %}`
- [x] **Исправлен возврат контента**: после генерации AI Framework данные теперь корректно сохраняются в БД и возвращаются на фронтенд
- [x] **Добавлено детальное логирование**: ai_proxy.py теперь логирует полный ответ AI Framework для отладки
- [x] Контракт AI proxy ↔ pipelines: нормализованы keys для real AI (lesson_theory/lesson_practice/ai_mentor)
- [x] Nodes API: добавлен PATCH endpoint для обновления ноды
- [x] **JSON Parsing**: переведён на Structured Output (response_format: json_object) — устранены проблемы с парсингом
- [x] **Courses API 500 error**: исправлена функция `sort_nodes_by_order` в courses.py — `asyncpg.UUID` объекты из PostgreSQL теперь корректно конвертируются в строку перед сортировкой
- [x] **Frontend build error**: добавлена зависимость `remark-gfm` в frontend/package.json для поддержки GitHub Flavored Markdown
- [x] **Нестабильная сортировка уроков**: исправлена функция `sort_nodes_by_order` в courses.py и `calculateNavigation` в theory/practice pages — добавлена вторичная сортировка по `id` для стабильного порядка уроков
- [x] **f_order для корректной нумерации уроков**: добавлено поле `f_order` в таблицу nodes — плоский порядковый номер урока (1, 2, 3...) в рамках курса. Topics имеют f_order=0. Автоматический пересчёт при создании/изменении узлов. API: POST `/api/v1/courses/nodes/recalculate-f-order`
- [x] **Рекурсивный пересчёт f_order**: функция `recalculate_f_order()` теперь обрабатывает вложенные подтемы рекурсивно. Theory всегда идёт перед practice.
- [x] **JsonTransformNode с order_index**: при трансформации JSON назначается order_index: theory = position*2 (чётные), practice = position*2+1 (нечётные).
- [x] **Улучшенный промпт course_outline.json (v4.0.0)**: добавлены правила полноты (3-5 уроков на подтему), порядка (theory всегда перед practice), гранулярности (100 маленьких лучше чем 50 неполных).
- [x] **Валидация структуры курса**: новый эндпоинт GET `/api/v1/courses/:id/validate-structure` — проверяет непрерывность, цельность, полноту, последовательность. Возвращает score 0-100 и рекомендации.
- [ ] Стриминг: нужно доработать UI для плавного отображения
- [ ] Консоль: режим Chat vs Debug нужно разделить UI
- [ ] Валидация кода: только LLM (юзер запускает локально)
- [ ] Монетизация: заглушки UI без логики
- [x] **Система Invite Codes**: добавлена регистрация по приглашениям
  - Backend: `/api/v1/admin/*` endpoints для управления кодами
  - Frontend: `/admin` страница для админов, поле в форме регистрации
  - Env: `INVITE_CODE_REQUIRED=true` + `ADMIN_EMAIL=admin@example.com`
- [x] **Career Paths и Templates**: добавлена система готовых промптов
  - Backend: `/api/v1/prompts/*` endpoints
  - Frontend: `/prompts` страница с интерактивной картой карьерного роста (React Flow)
  - Frontend: `PromptSelector` компонент для выбора шаблона
  - Frontend: `CreateCourseModal` — таб "Templates"
  - docs/prompts/ — 12 готовых промптов для разных уровней и направлений

## Ссылки

- AI Backend Framework: https://github.com/rammnic/ai_backend_framework
- Next.js: https://nextjs.org
- Shadcn UI: https://ui.shadcn.com
- SQLAlchemy: https://www.sqlalchemy.org
- OpenRouter: https://openrouter.ai
