# AI-Native LMS — Контекстная генерация уроков v2

**Дата:** 2026-03-21  
**Статус:** ЗАФИКСИРОВАНО

---

## Концепция

Как Cline изучает проект перед работой (`.clinerules`, код, структура), так и AI должен **"знать" весь курс** для генерации связного контента.

**Принципы:**
- **Непрерывность** — уроки связаны между собой
- **Цельность** — единый стиль, терминология, повествование
- **Полнота** — контекст достаточен для автономной генерации
- **Последовательность** — логика от простого к сложному соблюдается

---

## Проблемы текущей реализации

| # | Проблема | Корневая причина | Приоритет |
|---|----------|-----------------|-----------|
| 1 | Лишние комментарии "Внесённые улучшения" | Промпт enhance-шага генерирует мета-комментарии | P0 |
| 2 | Сломанные таблицы | AI генерирует таблицы в одну строку | P0 |
| 3 | Первый урок генерируется как обычный | Нет особой логики для `prev_lesson = null` | P1 |
| 4 | Нет контента предыдущих уроков | Передаётся только название, не содержание | P1 |
| 5 | Нет глоссария курса | Термины не согласованы между уроками | P2 |

---

## Архитектура контекста

### Типы уроков и их контекст

#### Первый урок (Введение)
```
Контекст:
├── course_title, course_description
├── course_goal — цель курса
├── target_audience — целевая аудитория
├── course_outline — полная структура курса
├── next_lesson_preview — краткий анонс следующего
└── course_glossary — ключевые термины курса

Особенность: БЕЗ prev_lesson (его нет)
```

#### Урок в середине курса
```
Контекст:
├── course_title, course_description
├── course_outline — полная структура
├── completed_lessons — ВСЕ пройденные уроки с контентом
├── current_lesson — info о текущем
├── next_lesson_title — название следующего
└── course_glossary — ключевые термины

Особенность: максимальный контекст для связности
```

#### Последний урок
```
Контекст:
├── course_title, course_description
├── course_outline
├── completed_lessons — все пройденные
├── current_lesson
├── course_summary — итоговые выводы курса
└── course_glossary

Особенность: БЕЗ next_lesson, подведение итогов
```

---

## Структура контекста в коде

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

## План реализации

### Этап 1: Фиксы P0 ✅ РЕАЛИЗОВАНО

| # | Задача | Файл | Статус |
|---|--------|------|--------|
| 1.1 | Убрать "Внесённые улучшения" | `lesson_theory.json` | ✅ Добавлено в enhance_prompt |
| 1.2 | Фикс таблиц | `lesson_theory.json` | ✅ Добавлен пример правильной таблицы |
| 1.3 | Логика первого урока | `ai_proxy.py` | ✅ `is_first` определён в контексте |

### Этап 2: Максимальный контекст P1 ✅ РЕАЛИЗОВАНО

| # | Задача | Файл | Статус |
|---|--------|------|--------|
| 2.1 | Контент пройденных уроков | `ai_proxy.py` | ✅ `completed_lessons` с `content[:800]` |
| 2.2 | Полная структура курса | `ai_proxy.py` | ✅ `_build_course_outline()` |
| 2.3 | Промпт с полным контекстом | `lesson_theory.json` | ✅ `completed_lessons` в промпте |
| 2.4 | Особый промпт для первого урока | `lesson_theory.json` | ✅ `{% if is_first %}` блок |

### Этап 3: Глоссарий P2 🔄 ОТЛОЖЕНО

| # | Задача | Статус |
|---|--------|--------|
| 3.1 | Сбор терминов | 🔄 Отложено |
| 3.2 | Передача глоссария | 🔄 Отложено |
| 3.3 | Использование в промпте | 🔄 Отложено |

---

## Изменённые файлы (реализация v2.1)

### AI Framework
- `ai_backend_framework/ai-backend-framework/pipelines/lesson_theory.json` (v2.1)

### LMS Backend
- `backend/app/api/ai_proxy.py`

---

## Детали реализации

### Файл: `ai_backend_framework/ai-backend-framework/pipelines/lesson_theory.json`

**Изменения в промптах:**

```json
{
  "nodes": [
    {
      "type": "PromptNode",
      "name": "prepare_prompt",
      "config": {
        "template": "Ты — эксперт-преподаватель. Создай подробный теоретический урок...\n\n{% if is_first %}\nЭТО ПЕРВЫЙ УРОК КУРСА. Создай введение, которое:\n- Мотивирует учиться\n- Даёт обзор всего курса\n- Объясняет, что будет изучаться\n{% endif %}\n\n=== ИСТОРИЯ КУРСА ===\n{% for lesson in completed_lessons %}\nУрок {{loop.index}}: {{lesson.title}}\nКраткое содержание: {{lesson.content}}\n{% endfor %}\n\n..."
      }
    },
    {
      "type": "PromptNode",
      "name": "enhance_content_prompt",
      "config": {
        "template": "Проверь и улучши следующий контент урока...\n\nВАЖНО:\n- Верни ТОЛЬКО контент урока\n- НЕ добавляй строки 'Внесённые улучшения:', 'Улучшения:', 'Исправления:'\n- Markdown таблицы: КАЖДЫЙ | разделяет ячейку, НЕ делай таблицы в одну строку\n..."
      }
    }
  ]
}
```

### Файл: `backend/app/api/ai_proxy.py`

**Изменения в `get_course_context()`:**

```python
async def get_course_context(db: AsyncSession, course_id: str, node_id: str) -> dict:
    # ... существующий код ...
    
    # Определить тип урока
    is_first = prev_lesson is None
    is_last = next_lesson is None
    
    # Собрать пройденные уроки с контентом
    completed_lessons = []
    for idx, n in enumerate(nodes_list[:current_idx]):
        if n["type"] in ["theory", "practice"]:
            node_result = await db.execute(select(Node).where(Node.id == uuid.UUID(n["id"])))
            node = node_result.scalar_one_or_none()
            if node and node.content:
                completed_lessons.append({
                    "title": node.title,
                    "content": node.content[:500],  # первые 500 символов
                    "type": node.type,
                    "order_index": node.order_index
                })
    
    # Построить структуру курса
    course_outline = build_course_outline(all_nodes)
    
    return {
        # ... существующие поля ...
        "is_first": is_first,
        "is_last": is_last,
        "completed_lessons": completed_lessons,
        "course_outline": course_outline,
        "next_lesson_preview": next_lesson["title"] if next_lesson else None,
        "course_summary_needed": is_last,
    }
```

---

## Глоссарий курса (будущее)

```python
# Извлечение терминов из контента уроков
def extract_glossary(lessons: list) -> dict:
    """Собирает ключевые термины из уроков."""
    glossary = {}
    for lesson in lessons:
        # Искать паттерны: **термин** или "Термин — определение"
        # Добавлять в glossary
    return glossary
```

---

## Success Criteria

- [ ] Первый урок генерируется как полноценное введение
- [ ] Нет комментариев "Внесённые улучшения"
- [ ] Таблицы отображаются корректно
- [ ] AI знает содержание пройденных уроков
- [ ] Терминология согласована между уроками
- [ ] Контекст достаточен для автономной генерации

---

## Файлы для изменения

### AI Framework
- `ai_backend_framework/ai-backend-framework/pipelines/lesson_theory.json`

### LMS Backend
- `backend/app/api/ai_proxy.py`

---

*Документ создан: 2026-03-21*
