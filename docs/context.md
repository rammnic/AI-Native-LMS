# AI-Native LMS — Context

> Образовательная платформа с AI-генерируемым контентом. Версия 0.4.0

---

## Статус готовности

| Уровень | Готовность | Описание |
|---------|------------|----------|
| **Dev (mock)** | 100% | Всё работает без реального AI |
| **Dev (real AI)** | 95% | Пайплайны готовы, нужен API ключ |
| **Production** | 60% | Требует доработки P1-P2 |

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    AI-Native LMS                             │
├─────────────────────────────────────────────────────────────┤
│  Frontend (3000)  │  LMS Backend (8001)  │  AI Framework   │
│  Next.js + Shadcn │  FastAPI + JWT        │  (8000)         │
│  - /login         │  - /api/v1/auth       │  - /execute     │
│  - /dashboard     │  - /api/v1/courses    │  - /chat        │
│  - /course/[id]   │  - /api/v1/ai/*       │  - /execute/str │
│  - /lesson/[id]   │  - /api/v1/progress   │                 │
└─────────┬─────────┴──────────┬───────────┴────────┬─────────┘
          │                    │                    │
          ▼                    ▼                    ▼
      PostgreSQL (5432)  ───►  OpenRouter  ◄──  AI Nodes
```

---

## Что работает ✅

### Backend
- [x] JWT Auth (register/login/me)
- [x] CRUD Courses + Batch Nodes
- [x] Progress API
- [x] AI Proxy (mock mode)
- [x] PostgreSQL + SQLAlchemy async

### Frontend
- [x] Landing Page
- [x] Login/Register UI
- [x] Dashboard с созданием курсов (с нодами)
- [x] Course Map (дерево тем)
- [x] Theory/Practice страницы
- [x] Smart Console (Chat + Run)
- [x] Auth middleware
- [x] Кнопки "Generate Course Structure" и "Generate More" работают

### DevOps
- [x] docker-compose (4 сервиса)
- [x] Backend/Frontend Dockerfiles

---

## Что нужно сделать

### P0 — AI Pipelines (2-4 часа)
- [x] Создать `course_outline.json` пайплайн
- [x] Создать `lesson_theory.json` пайплайн
- [x] Создать `lesson_practice.json` пайплайн
- [x] Создать `code_validator.json` пайплайн
- [x] Создать `ai_mentor.json` пайплайн
- [x] Добавить OPENROUTER_API_KEY в .env
- [x] AI_MOCK_ENABLED=false

### P1 — UI улучшения (1-2 дня)
- [ ] Интегрировать Monaco Editor в Practice
- [ ] SSE стриминг в Smart Console
- [ ] React Query для кеширования

### P2 — Production (1 неделя)
- [ ] Alembic миграции
- [ ] Тесты
- [ ] Rate limiting
- [ ] HTTPS

---

## Как запустить

```bash
# 1. Создать .env
cp .env.example .env
# Добавить OPENROUTER_API_KEY=sk-or-...

# 2. Запустить
docker-compose up -d

# 3. Проверить
curl http://localhost:8001/health   # Backend
curl http://localhost:8000/health   # AI Framework
curl http://localhost:3000          # Frontend
```

---

## Структура проекта

```
AI-Native-LMS/
├── backend/           # FastAPI (8001)
│   ├── app/api/       # auth, courses, progress, ai_proxy
│   └── app/db/        # schema, database
├── frontend/          # Next.js (3000)
│   ├── app/           # pages (dashboard, course, lesson)
│   ├── components/    # UI (SmartConsole, CreateCourseModal)
│   └── lib/           # api, auth-context
├── docs/              # development.md, plan.md, devops.md
└── context.md         # этот файл
```

---

## Нерешённые вопросы

| Вопрос | Приоритет | Статус |
|--------|-----------|--------|
| LLM валидация vs Docker | Критический | Пока только LLM |
| Стриминг UI | Высокий | Нужно доработать |
| Версионирование курсов | Средний | Не реализовано |
| Rate limiting | Средний | Нужно добавить |

---

## Ключевые файлы

| Файл | Назначение |
|------|------------|
| `docker-compose.yml` | Запуск всех сервисов |
| `backend/app/api/ai_proxy.py` | AI интеграция (mock/real) |
| `frontend/components/smart-console.tsx` | Чат + валидация кода |
| `docs/plan.md` | Полный план разработки |
| `docs/development.md` | Техническая документация |

---

## AI Framework (внешний)

Проект использует [ai_backend_framework](https://github.com/rammnic/ai_backend_framework) как AI-движок.

- **Порт**: 8000
- **API**: `/execute`, `/chat`, `/execute/stream`
- **Nodes**: LLMNode, PromptNode, ConditionNode, WebSearchNode, etc.

---

*Обновлено: 2026-03-19*