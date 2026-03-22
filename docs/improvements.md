# AI-Native LMS — Планы улучшений

**Дата:** 2026-03-23  
**Версия:** 1.0 (объединённый)

---

## Концепция

Как Cline изучает проект перед работой (`.clinerules`, код, структура), так и AI должен **"знать" весь курс** для генерации связного контента.

**Принципы:**
- **Непрерывность** — уроки связаны между собой
- **Цельность** — единый стиль, терминология, повествование
- **Полнота** — контекст достаточен для автономной генерации
- **Последовательность** — логика от простого к сложному соблюдается

---

## Статус реализации

### ✅ Выполнено (v0.6.0)

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
| 2 | Валидация структуры | P1 | Проверка depth_limit, полноты курса |
| 3 | Code Validation | P2 | Docker-выполнение кода с тестами |

---

## Детали реализации

### Структура контекста в коде

```python
# ai_proxy.py: get_course_context()

{
    # Метаданные курса
    "course_title": str,
    "course_description": str,
    "language": str,  # "ru" или "en"
    
    # Структура курса (полное дерево)
    "course_outline": [
        {
            "title": str,
            "type": "topic|theory|practice",
            "children": [...]  # рекурсивно
        }
    ],
    
    # Пройденные уроки (для связности)
    "completed_lessons": [
        {
            "title": str,
            "content": str,  # первые 500-1000 символов
            "type": "theory|practice",
            "order_index": int
        }
    ],
    
    # Текущий урок
    "current_lesson": {
        "title": str,
        "type": str,
        "order_index": int,
        "is_first": bool,
        "is_last": bool
    },
    
    # Соседние уроки
    "prev_lesson": {...} | None,  # None если первый
    "next_lesson": {...} | None,  # None если последний
    
    # Для первого урока
    "next_lesson_preview": str,  # краткий анонс
    
    # Для последнего урока
    "course_summary_needed": bool,
    
    # Глоссарий курса
    "course_glossary": {
        "term": "definition",
        ...
    }
}
```

---

## Success Criteria

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

## Файлы изменённые в реализации

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

*Документ обновлён: 2026-03-23*
