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
│   - course_outline — генерация структуры курса                   │
│   - lesson_theory — генерация лекции                             │
│   - lesson_practice — генерация практики + тестов                │
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
- **LLM Provider**: OpenRouter (gpt-4o-mini, claude-3, etc.)
- **API**: FastAPI с SSE-стримингом

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
| order_index | INTEGER | Порядок |
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

## API Endpoints

### Auth
| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/v1/auth/register | Регистрация |
| POST | /api/v1/auth/login | Вход |
| GET | /api/v1/auth/me | Текущий пользователь |

### Courses
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/v1/courses | Список курсов |
| POST | /api/v1/courses | Создать курс |
| GET | /api/v1/courses/:id | Детали курса |
| DELETE | /api/v1/courses/:id | Удалить курс |

### Progress
| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/v1/progress/:course_id | Прогресс курса |
| POST | /api/v1/progress/:node_id/complete | Отметить завершённым |

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
- **Макс. токенов**: 4096
- **Температура**: 0.7

### LMS Backend
- **Порт**: 8001
- **JWT Expire**: 24h
- **Курс макс. глубина**: 5 уровней

### Frontend
- **Порт**: 3000
- **API Base**: http://localhost:8001

## Отладка

### Backend
```bash
# Запуск с отладкой
DEBUG=true uvicorn main:app --reload --port 8001

# Проверка health
curl http://localhost:8001/health
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
- [ ] Стриминг: нужно доработать UI для плавного отображения
- [ ] Консоль: режим Chat vs Debug нужно разделить UI
- [ ] Валидация кода: только LLM (юзер запускает локально)
- [ ] Монетизация: заглушки UI без логики

## Ссылки

- AI Backend Framework: https://github.com/rammnic/ai_backend_framework
- Next.js: https://nextjs.org
- Shadcn UI: https://ui.shadcn.com
- SQLAlchemy: https://www.sqlalchemy.org