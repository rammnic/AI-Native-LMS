# AI-Native LMS

Образовательная платформа нового поколения с AI-генерируемым и адаптивным контентом.

## Описание

AI-Native LMS — этоLearning Management System, где:

- Контент генерируется AI на лету
- Курсы строятся персонально под каждого пользователя
- Структура курса может быть бесконечно вложенной
- Практика и теория разделены
- AI выступает как ментор и валидатор

## Особенности

- 🎯 **Персонализация**: AI анализирует уровень и строит план
- 🔄 **JIT-генерация**: Контент создаётся когда нужно, не всё сразу
- 💬 **Smart Console**: Единый интерфейс для чата и кода
- 🌳 **Бесконечная вложенность**: Древовидная структура тем
- 🤖 **AI-ментор**: Помощь в реальном времени

## Архитектура

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)             │
├─────────────────────────────────────────┤
│           LMS Backend (FastAPI)          │
├─────────────────────────────────────────┤
│      AI Backend Framework (API)          │
├─────────────────────────────────────────┤
│              PostgreSQL                  │
└─────────────────────────────────────────┘
```

## Технологии

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Python
- **Database**: PostgreSQL, Drizzle ORM
- **AI**: ai_backend_framework (OpenRouter)

## Быстрый старт

### Docker Compose (рекомендуется)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/rammnic/ai-native-lms.git
cd ai-native-lms

# 2. Создать .env файл
copy .env.example .env

# 3. Запустить все сервисы
docker-compose up -d

# 4. Открыть в браузере
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

### Локальная разработка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/rammnic/ai-native-lms.git
cd ai-native-lms

# 2. PostgreSQL
docker run -d --name ai-lms-postgres -e POSTGRES_USER=lms_user -e POSTGRES_PASSWORD=lms_password -e POSTGRES_DB=ai_lms -p 5432:5432 postgres:16-alpine

# 3. Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# 4. Frontend
cd ../frontend
npm install
npm run dev
```

## Структура курса

```
Курс
├── Тема 1
│   ├── Лекция 1.1
│   ├── Практика 1.1
│   └── Тема 1.2
│       ├── Лекция 1.2.1
│       └── Практика 1.2.1
└── Тема 2
    └── ...
```

## Конфигурация

### .env (AI Backend)

```env
OPENROUTER_API_KEY=your-api-key
```

### .env (LMS Backend)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/lms
JWT_SECRET=your-secret-key
AI_API_URL=http://localhost:8000
```

## Страницы

| Путь | Описание |
|------|----------|
| `/` | Landing page |
| `/login` | Вход / Регистрация |
| `/dashboard` | Playground пользователя |
| `/course/[id]` | Карта курса (дерево) |
| `/lesson/[id]/theory` | Лекция |
| `/lesson/[id]/practice` | Практика |

## Roadmap

- [x] Архитектура системы
- [x] Схема БД
- [x] Backend API
- [x] AI интеграция
- [x] Frontend Layout
- [x] Dashboard
- [x] Course Map
- [x] Lesson Pages
- [x] Smart Console
- [x] Аутентификация (JWT + UI)
- [x] DevOps документация

## Лицензия

MIT

## Автор

Николай (rammnic)