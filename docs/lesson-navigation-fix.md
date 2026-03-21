# Исправление бага нумерации уроков

## Дата: 2026-03-21

## Проблема

При открытии урока в курсе номер отображается корректно, но при повторном входе номер **увеличивается на 1**.

### Пример:
1. Первый вход в Theory урок → "Theory • 25/37"
2. Выход из урока
3. Повторный вход → "Theory • 26/37"

---

## Корневая причина

### 1. Данные в БД

AI Framework генерирует структуру курса, где каждый child-элемент получает `order_index` из своего локального индекса в массиве children:

```
Topic 1:
  children[0] → Theory → order_index = 0
  children[1] → Practice → order_index = 1

Topic 2:
  children[0] → Theory → order_index = 0  ← ДУБЛИРУЕТСЯ!
  children[1] → Practice → order_index = 1  ← ДУБЛИРУЕТСЯ!
```

Результат в БД:
- 43 Theory + 13 Practice = 56 уроков
- Множество Theory имеют одинаковый `order_index` (0, 1, 2...)

### 2. Нестабильная сортировка

В трёх местах код сортирует ноды по `(parent_id, order_index)`:

**Backend `courses.py`:**
```python
return sorted(nodes, key=lambda n: (str(n.parent_id) if n.parent_id else "", n.order_index))
```

**Backend `ai_proxy.py`:**
```python
.order_by(Node.order_index)
```

**Frontend `theory/page.tsx`:**
```javascript
.sort((a, b) => {
  if (a.parent_id !== b.parent_id) { ... }
  return a.order_index - b.order_index
})
```

При одинаковых `(parent_id, order_index)` порядок **недетерминирован** — PostgreSQL и JavaScript сортируют по-своему при каждом запросе.

---

## План исправления

### 1. Backend `courses.py` - `sort_nodes_by_order`
```python
# Добавить вторичную сортировку по id для стабильности
return sorted(nodes, key=lambda n: (str(n.parent_id) if n.parent_id else "", n.order_index, str(n.id)))
```

### 2. Backend `ai_proxy.py` - `get_course_context`
```python
# Добавить вторичную сортировку по id
.order_by(Node.order_index, Node.id)
```

### 3. Frontend `theory/page.tsx` - `calculateNavigation`
```javascript
// Добавить вторичную сортировку по id для стабильности
.sort((a, b) => a.order_index - b.order_index || a.id.localeCompare(b.id))
```

### 4. Frontend `practice/page.tsx` - аналогичное исправление
```javascript
// Аналогично theory/page.tsx
```

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `backend/app/api/courses.py` | Добавить `str(n.id)` в сортировку |
| `backend/app/api/ai_proxy.py` | Добавить `Node.id` в order_by |
| `frontend/app/lesson/[id]/theory/page.tsx` | Добавить `a.id.localeCompare(b.id)` |
| `frontend/app/lesson/[id]/practice/page.tsx` | Добавить `a.id.localeCompare(b.id)` |

---

## Статус

- [x] Backend `courses.py` - исправить `sort_nodes_by_order`
- [x] Backend `ai_proxy.py` - исправить `get_course_context`
- [x] Frontend `theory/page.tsx` - исправить `calculateNavigation`
- [x] Frontend `practice/page.tsx` - исправить `calculateNavigation`
- [x] Обновить `development.md`

## ✅ ЗАВЕРШЕНО 2026-03-21

## Выполненные изменения

### 1. Backend `courses.py` - `sort_nodes_by_order`
```python
# Добавлен вторичный ключ сортировки по id
return sorted(nodes, key=lambda n: (str(n.parent_id) if n.parent_id else "", n.order_index, str(n.id)))
```

### 2. Backend `ai_proxy.py` - `get_course_context`
```python
# Добавлен order_by по id для стабильной сортировки
.order_by(Node.order_index, Node.id)
```

### 3. Frontend `theory/page.tsx` - `calculateNavigation`
```javascript
// Добавлена сортировка по id для стабильности
const orderDiff = a.order_index - b.order_index
if (orderDiff !== 0) return orderDiff
return a.id.localeCompare(b.id)
```

### 4. Frontend `practice/page.tsx` - `calculateNavigation`
```javascript
// Аналогично theory/page.tsx
const orderDiff = a.order_index - b.order_index
if (orderDiff !== 0) return orderDiff
return a.id.localeCompare(b.id)
```

---

## Примечание

После исправления порядок уроков будет стабильным. Номера останутся такими, какие есть (например, "25/37"), но不会再 меняться при повторных входах.
