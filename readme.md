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

### Требования

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Установка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/rammnic/ai-native-lms.git
cd ai-native-lms

# 2. Настроить AI Backend Framework
cd ../ai_backend_framework
cp .env.example .env
# Добавить OPENROUTER_API_KEY
cd ai-backend-framework
uvicorn api.main:app --reload --port 8000

# 3. Настроить LMS Backend
cd ../../ai-native-lms/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8001

# 4. Запустить Frontend
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
| `/dashboard` | Playground пользователя |
| `/course/[id]` | Карта курса (дерево) |
| `/lesson/[id]/theory` | Лекция |
| `/lesson/[id]/practice` | Практика |

## Roadmap

- [x] Архитектура системы
- [ ] Схема БД
- [ ] Backend API
- [ ] AI интеграция
- [ ] Frontend Layout
- [ ] Dashboard
- [ ] Course Map
- [ ] Lesson Pages
- [ ] Smart Console

## Лицензия

MIT

## Автор

Николай (rammnic)