# Промпты для генерации курсов

Коллекция готовых промптов для LMS-системы, сгруппированных по направлениям и уровням подготовки.

## Структура каталогов

```
docs/prompts/
├── README.md                    # Этот файл
│
├── zero-to-it/
│   └── computer-basics.md       # "Нулинок" — от игр к IT
│
├── support/
│   ├── support-beginner.md      # L1 Helpdesk с нуля
│   └── support-l1-to-l2.md      # L1 → L2 переход
│
├── sysadmin/
│   ├── sysadmin-beginner.md     # Junior SysAdmin с нуля
│   └── sysadmin-junior-middle.md # Junior → Middle
│
├── devops/
│   ├── devops-beginner.md       # Beginner: IT → DevOps
│   ├── devops-intermediate.md   # Intermediate: Junior → Middle
│   └── devops-senior-sre.md     # Advanced: Middle → Senior
│
├── sre/
│   ├── sre-basics.md            # SRE Fundamentals
│   └── sre-advanced.md          # SRE Advanced
│
├── cloud/
│   └── cloud-engineer.md        # Cloud Engineer
│
└── platform/
    └── platform-engineer.md      # Platform Engineer / IDP
```

## Обзор промптов

### 📊 Карта карьерного роста

```
                        IT Support
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         Zero-to-IT   L1 Support    Computer
              │        (beginner)     Basics
              │             │
              │             ▼
              │        L2 Support
              │        (intermediate)
              │             │
              ▼             ▼
        SysAdmin ◄────┴────► DevOps
          (intermediate)       │
              │           ┌────┴────┐
              ▼           ▼         ▼
        Senior       Cloud      Platform
        SysAdmin    Engineer    Engineer
              │           │         │
              ▼           ▼         ▼
             SRE      SRE       SRE
          (advanced)  (adv)    (advanced)
```

### 📋 Детальная таблица

| # | Файл | Уровень | difficulty | depth | Аудитория |
|---|------|---------|------------|-------|-----------|
| 1 | `zero-to-it/computer-basics.md` | Zero | beginner | 2 | Полные новички |
| 2 | `support/support-beginner.md` | Beginner | beginner | 2 | L1 с нуля |
| 3 | `support/support-l1-to-l2.md` | Intermediate | intermediate | 3 | L1 → L2 |
| 4 | `sysadmin/sysadmin-beginner.md` | Beginner | beginner | 2 | Junior SA |
| 5 | `sysadmin/sysadmin-junior-middle.md` | Intermediate | intermediate | 3 | Junior → Middle SA |
| 6 | `devops/devops-beginner.md` | Beginner | beginner | 2 | IT → DevOps |
| 7 | `devops/devops-intermediate.md` | Intermediate | intermediate | 3 | Junior → Middle DevOps |
| 8 | `devops/devops-senior-sre.md` | Advanced | advanced | 3 | Middle → Senior / SRE |
| 9 | `sre/sre-basics.md` | Intermediate | intermediate | 2 | SRE основы |
| 10 | `sre/sre-advanced.md` | Advanced | advanced | 3 | SRE Advanced |
| 11 | `cloud/cloud-engineer.md` | Intermediate | intermediate | 3 | Cloud Engineer |
| 12 | `platform/platform-engineer.md` | Advanced | advanced | 3 | Platform Engineer |

## Использование

### 1. Выбор промпта

Определите текущий уровень пользователя и выберите соответствующий промпт:

- **Zero**: Никогда не работал в IT → `zero-to-it/computer-basics.md`
- **Beginner**: Базовые знания → `*support-beginner.md`, `*sysadmin-beginner.md`, `*devops-beginner.md`
- **Intermediate**: Опыт в роли → `*l1-to-l2.md`, `*junior-middle.md`, `*devops-intermediate.md`
- **Advanced**: Senior уровень → `*senior-sre.md`, `*sre-advanced.md`, `*platform-engineer.md`

### 2. Копирование промпта

1. Откройте нужный `.md` файл
2. Скопируйте текст из секции "Основной промпт для LMS"
3. Вставьте в интерфейс LMS при создании курса

### 3. Параметры генерации

Для API используйте параметры из раздела "Параметры генерации":

```json
{
  "user_prompt": "текст промпта",
  "difficulty": "beginner|intermediate|advanced",
  "depth_limit": 2|3
}
```

## Рекомендации по уровням сложности

### Beginner (difficulty: beginner)
- Для новичков без опыта
- Простые объяснения
- Много практики
- `depth_limit: 2`

### Intermediate (difficulty: intermediate)
- Для людей с базовым опытом
- Углублённые темы
- Production-практики
- `depth_limit: 3`

### Advanced (difficulty: advanced)
- Для опытных специалистов
- Архитектурные паттерны
- Стратегические решения
- `depth_limit: 3`

## Roadmap обучения

### Путь 1: Support → DevOps

```
computer-basics.md
    ↓
support-beginner.md (L1)
    ↓
support-l1-to-l2.md (L2)
    ↓
devops-beginner.md
    ↓
devops-intermediate.md
    ↓
devops-senior-sre.md
```

### Путь 2: SysAdmin → DevOps/SRE

```
computer-basics.md
    ↓
sysadmin-beginner.md
    ↓
sysadmin-junior-middle.md
    ↓
devops-intermediate.md
    ↓
devops-senior-sre.md
    ↓
sre-advanced.md
```

### Путь 3: Cloud → Platform

```
cloud-engineer.md
    ↓
devops-senior-sre.md
    ↓
platform-engineer.md
```

## Добавление новых промптов

1. Создайте файл в соответствующей категории
2. Используйте формат:
   - `# Промпт: [Название]`
   - `## Основной промпт для LMS`
   - `## Параметры генерации`
   - `## Ожидаемая структура курса`
3. Обновите этот README

---

*Дата создания: 2026-03-24*