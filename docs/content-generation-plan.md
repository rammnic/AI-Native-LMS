# ПЛАН УЛУЧШЕНИЙ ГЕНЕРАЦИИ КОНТЕНТА

**Дата:** 2026-03-21  
**Статус:** ПЛАНИРОВАНИЕ ЗАВЕРШЕНО  

---

## АНАЛИЗ ПРОБЛЕМ

### Текущие проблемы:

| # | Проблема | Корневая причина | Приоритет |
|---|----------|-----------------|-----------|
| 1 | Нет связности уроков | `parent_context` всегда пустой | P1 |
| 2 | Уроки "улетают" в конец | `flattenStructure()` игнорирует `order_index` от AI | P0 |
| 3 | Смешанный язык | Нет параметра `language` в запросах | P0 |
| 4 | Скудный контент | Pipeline одношаговый, без проверки | P1 |

---

## ПЛАН РЕАЛИЗАЦИИ

### ЭТАП 1: Сохранение иерархии уроков (P0) ✅

**Цель:** Новые уроки не "улетают" в конец

**Файлы:**
- `frontend/app/course/[id]/page.tsx` — функция `flattenStructure()`
- `backend/app/api/courses.py` — batch create nodes

**Изменения:**
```typescript
// frontend: Использовать order_index из AI ответа
const nodesToCreate = structure.map((item, idx) => ({
  id: item.id || crypto.randomUUID(),
  title: item.title,
  type: item.type,
  parent_id: parentId,
  order_index: item.order_index ?? idx,  // ← Приоритет AI индексу
}));
```

**Ожидаемый результат:**
- Новые уроки сохраняют позицию в дереве
- Порядок соответствует структуре курса

---

### ЭТАП 2: Language Settings (P0) ✅

**Цель:** Контроль языка генерации

**Файлы:**
- `frontend/components/create-course-modal.tsx` — UI настройки
- `backend/app/db/schema.py` — поле `language` в `settings`
- `backend/app/api/ai_proxy.py` — передача языка в AI
- `backend/app/api/courses.py` — сохранение настроек

**Изменения:**

1. **Frontend UI:**
```tsx
<Select value={settings.language} onValueChange={(v) => setSettings({...settings, language: v})}>
  <Option value="ru">Русский</Option>
  <Option value="en">English</Option>
</Select>
```

2. **Backend schema:**
```python
class Course(Base):
    # ...
    settings = Column(JSONB, default={"language": "ru"})  # Default: Russian
```

3. **API request:**
```python
class LessonContentRequest(BaseModel):
    language: str = "ru"  # Добавить в запрос
```

**Ожидаемый результат:**
- Все уроки генерируются на выбранном языке
- Язык сохраняется в настройках курса

---

### ЭТАП 3: Контекстный движок (P1) 🔄

**Цель:** Собирать полный контекст для генерации связанных уроков

**Новый файл:**
- `backend/app/services/context_engine.py`

**Функции:**
```python
async def get_node_context(node_id: UUID) -> dict:
    """
    Собирает контекст урока:
    - prev_node: предыдущий урок в последовательности
    - next_node: следующий урок
    - parent_topic: родительская тема
    - sibling_nodes: все уроки темы
    - course_metadata: название, описание курса
    """
```

**Интеграция:**
- Вызывать в `ai_proxy.py` перед генерацией контента
- Передавать собранный контекст в AI pipeline

**Ожидаемый результат:**
- AI знает, что было на предыдущих уроках
- Ссылки между уроками корректны
- Терминология согласована

---

### ЭТАП 4: Улучшенный Pipeline (P1) 🔄

**Цель:** Многоступенчатая генерация с проверкой качества

**Новый файл (в ai_backend_framework):**
- `ai_backend_framework/pipelines/lesson_theory_v2.json`

**Стадии pipeline:**

```
1. context_preparation
   └─ Собрать информацию о курсе, соседних уроках

2. content_generation
   └─ Генерация контента (1500-2500 слов)
   └─ Включить код, примеры, ссылки на смежные темы

3. coherence_check
   └─ Проверка связности с prev/next
   └─ Валидация терминологии

4. final_refinement
   └─ Финальная полировка контента
```

**Quality gates:**
- Минимум 800 слов
- Обязательные секции: intro, main, code, summary
- Проверка: no orphan references

**Ожидаемый результат:**
- Контент полный, связный, последовательный
- Ощущение единого курса, а не набора статей

---

### ЭТАП 5: UI навигация (P2) 🔄

**Цель:** Показать прогресс и связь между уроками

**Файлы:**
- `frontend/app/lesson/[id]/theory/page.tsx`
- `frontend/app/lesson/[id]/practice/page.tsx`

**Изменения:**
```tsx
<div className="flex justify-between items-center">
  <Button variant="ghost" onClick={goToPrev}>
    ← {prevLessonTitle}
  </Button>
  <span className="text-sm text-slate-500">
    {currentIndex + 1} / {totalLessons}
  </span>
  <Button variant="ghost" onClick={goToNext}>
    {nextLessonTitle} →
  </Button>
</div>
```

**Ожидаемый результат:**
- Пользователь видит "где он" в курсе
- Легко переходить между уроками

---

### ЭТАП 6: Quality Assurance (P2) 🔄

**Цель:** Автоматическая проверка качества контента

**Добавить в pipeline:**
```yaml
quality_check:
  min_words: 800
  has_code_examples: true
  has_summary: true
  no_placeholder_text: true
```

---

### ЭТАП 7: Документация (P3) 🔄

**Цель:** Зафиксировать изменения

**Файлы:**
- `docs/development.md` — обновить API contracts
- `docs/plan.md` — отметить выполненные пункты

---

## TIMELINE

| Неделя | Этапы | Результат |
|--------|-------|-----------|
| 1 | Этап 1 + 2 | Быстрые победы: порядок + язык |
| 2 | Этап 3 | Контекстный движок |
| 3 | Этап 4 | Улучшенный pipeline |
| 4 | Этап 5 + 6 | UI + QA |
| 5 | Этап 7 | Документация |

---

## ЗАВИСИМОСТИ

```
Этап 1 ──┬── Этап 2 (независимы)
          │
          └── Этап 3 (нужен контекст для pipeline)
                   │
                   └── Этап 4 (использует контекст)
```

---

## РИСКИ

| Риск | Вероятность | Mitigation |
|------|-------------|------------|
| AI Framework не доступен | Средняя | Работать через mock |
| Pipeline слишком долгий | Средняя | Кэшировать контекст |
| Обратная совместимость | Низкая | API versioning |

---

## SUCCESS CRITERIA

- [x] Новые уроки сохраняют позицию в дереве ✅ РЕАЛИЗОВАНО
- [x] Все уроки на одном языке ✅ РЕАЛИЗОВАНО
- [x] AI использует контекст курса ✅ РЕАЛИЗОВАНО
- [x] Навигация между уроками (theory + practice) ✅ РЕАЛИЗОВАНО
- [x] AI Framework промпты улучшены ✅ РЕАЛИЗОВАНО
- [x] order_index в course_outline ✅ РЕАЛИЗОВАНО
- [ ] Контент полный (800+ слов, код, примеры) - требует тестирования

---

## ДОКУМЕНТАЦИЯ

- [x] `docs/content-generation-plan.md` — план улучшений
- [x] `docs/testing-checklist.md` — чеклист тестирования

---

## ФАЙЛЫ ИЗМЕНЁННЫЕ В РЕАЛИЗАЦИИ

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

*Документ обновлён: 2026-03-21*
